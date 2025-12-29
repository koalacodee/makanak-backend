import crypto from 'node:crypto'
import type { Coupon } from '@/modules/coupons/domain/coupon.entity'
import type { ICouponRepository } from '@/modules/coupons/domain/coupon.iface'
import type { UpsertCustomerUseCase } from '@/modules/customers/application/upsert-customer.use-case'
import type { Customer } from '@/modules/customers/domain/customer.entity'
import type { ISettingsRepository } from '@/modules/settings/domain/settings.iface'
import filehub, { type SignedPutUrl } from '@/shared/filehub'
import { generateCodeAndHash } from '@/shared/helpers/hash'
import redis from '@/shared/redis'
import { inventoryIO } from '@/socket.io'
import { BadRequestError } from '../../../shared/presentation/errors'
import type { ICustomerRepository } from '../../customers/domain/customers.iface'
import type { IProductRepository } from '../../products/domain/products.iface'
import type { Order, PaymentMethod } from '../domain/order.entity'
import type { IOrderRepository } from '../domain/orders.iface'
export class CreateOrderUseCase {
  async execute(
    data: {
      customerName: string
      phone: string
      address: string
      items: Array<{ id: string; quantity: number }>
      paymentMethod: PaymentMethod
      pointsToUse?: number
      attachWithFileExtension?: string
      password: string
      couponName?: string
    },
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    upsertCustomerUC: UpsertCustomerUseCase,
    settingsRepo: ISettingsRepository,
    customerRepo: ICustomerRepository,
    couponRepo: ICouponRepository,
  ): Promise<{
    order: Order
    receiptUploadUrl?: string
    verificationCode: string
  }> {
    let couponDiscount: number | null = null
    let couponData: { remainingUses: number; id: string } | null = null
    if (data.couponName) {
      const coupon = await couponRepo.findByName(data.couponName)
      if (!coupon) {
        throw new BadRequestError([
          {
            path: 'couponName',
            message: 'Coupon not found',
          },
        ])
      }

      if (coupon.remainingUses <= 0) {
        throw new BadRequestError([
          {
            path: 'couponName',
            message: 'Coupon has no remaining uses',
          },
        ])
      }
      couponDiscount = coupon.value
      couponData = { remainingUses: coupon.remainingUses, id: coupon.id }
    }
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError([
        {
          path: 'items',
          message: 'Order must have at least one item',
        },
      ])
    }

    // Validate quantities
    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new BadRequestError([
          {
            path: 'items',
            message: `Item ${item.id} must have a quantity greater than 0`,
          },
        ])
      }
    }

    const products = await productRepo.findByIds(
      data.items.map((item) => item.id),
    )

    if (products.length !== data.items.length) {
      throw new BadRequestError([
        {
          path: 'items',
          message: 'Some products not found',
        },
      ])
    }
    let subtotal = 0

    products.forEach((product) => {
      const item = data.items.find((item) => item.id === product.id) as {
        id: string
        quantity: number
      }
      if (product.stock < item.quantity) {
        throw new BadRequestError([
          {
            path: 'items',
            message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          },
        ])
      }
      subtotal += product.price * item.quantity
    })

    const settings = await settingsRepo.find()

    // Calculate total if not provided
    const deliveryFee = settings?.deliveryFee || 0
    const discount =
      (data.pointsToUse
        ? (settings?.pointsSystem?.redemptionValue || 0) * data.pointsToUse
        : 0) + (couponDiscount ?? 0)

    const customer = await upsertCustomerUC.execute(
      {
        phone: data.phone,
        name: data.customerName,
        address: data.address,
        password: data.password,
      },
      customerRepo,
    )

    if (data.pointsToUse && data.pointsToUse > customer.points) {
      throw new BadRequestError([
        {
          path: 'pointsToUse',
          message:
            'Insufficient points. You have ' +
            customer.points +
            ' points. You need ' +
            (data.pointsToUse - customer.points) +
            ' points',
        },
      ])
    }
    // Calculate total amount for customer stats
    const totalAmount = subtotal + deliveryFee - discount
    const earnValue = settings?.pointsSystem?.value
    const pointsToEarn =
      earnValue && earnValue > 0 ? Math.floor(totalAmount / earnValue) : 0
    // Create order
    const { code, hash } = generateCodeAndHash()
    const order = await orderRepo.create({
      customerName: data.customerName,
      referenceCode: crypto.randomInt(10000000, 99999999).toString(),
      phone: data.phone,
      address: data.address,
      items: data.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      subtotal: subtotal.toString(),
      deliveryFee: deliveryFee.toString(),
      paymentMethod: data.paymentMethod,
      pointsUsed: data.pointsToUse || 0,
      pointsDiscount: discount.toString(),
      pointsEarned: pointsToEarn,
      couponDiscount: couponDiscount ?? 0,
      couponId: couponData?.id ?? undefined,
      verificationHash: hash,
    })

    await CreateOrderUseCase.handlePendingStatus(
      order,
      productRepo,
      couponRepo,
      customerRepo,
    )

    let receiptUploadUrl: SignedPutUrl | null = null
    if (data.paymentMethod === 'online') {
      if (!data.attachWithFileExtension) {
        throw new BadRequestError([
          {
            path: 'attachWithFileExtension',
            message: 'Attach with file extension is required',
          },
        ])
      }
      receiptUploadUrl = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        data.attachWithFileExtension,
      )
      await redis.hset(`filehub:${receiptUploadUrl.filename}`, {
        id: order.id,
        shouldConvertToAvif: '1',
      })
    }

    // No side effects on order creation - all effects happen when status changes
    // Stock, points, customer stats, and coupon usage will be handled when order becomes "ready"
    const pendingOrder = await orderRepo.findById(order.id)
    if (pendingOrder) {
      inventoryIO.notifyInventoryWithPendingOrder({
        ...pendingOrder,
        pointsDiscount: pendingOrder.pointsDiscount
          ? parseFloat(pendingOrder.pointsDiscount)
          : 0,
      })
    }
    return {
      order,
      receiptUploadUrl: receiptUploadUrl?.signedUrl,
      verificationCode: code,
    }
  }

  /**
   * Handle when order status initially set to "pending"
   * - Reduce stock
   * - Reduce coupon usage by 1
   * - Reduce points (if points were used)
   */
  static async handlePendingStatus(
    order: Order,
    productRepo: IProductRepository,
    couponRepo: ICouponRepository,
    customerRepo: ICustomerRepository,
  ): Promise<void> {
    const promises: Array<Promise<void> | Promise<Coupon> | Promise<Customer>> =
      [
        // Reduce stock
        productRepo.updateStockMany(
          order.orderItems.map((item) => ({
            id: item.productId,
            delta: -item.quantity,
          })),
        ),
      ]

    // Reduce coupon usage by 1 (if coupon exists)
    if (order.couponId) {
      const coupon = await couponRepo.findById(order.couponId)
      if (coupon && coupon.remainingUses > 0) {
        promises.push(
          couponRepo.update(order.couponId, {
            remainingUses: coupon.remainingUses - 1,
          }),
        )
      }
    }

    // Reduce points (if points were used)
    if (order.pointsUsed && order.pointsUsed > 0) {
      promises.push(
        customerRepo.update(order.phone, {
          pointsDelta: -order.pointsUsed,
        }),
      )
    }

    await Promise.all(promises)
  }
}
