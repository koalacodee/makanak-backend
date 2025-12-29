import filehub from '@/shared/filehub'
import redis from '@/shared/redis'
import {
  NotFoundError,
  ValidationError,
} from '../../../shared/presentation/errors'
import type { Product } from '../domain/product.entity'
import type { IProductRepository } from '../domain/products.iface'

export class UpdateProductUseCase {
  async execute(
    id: string,
    data: Partial<Omit<Product, 'id'>> & { attachWithFileExtension?: string },
    repo: IProductRepository,
  ): Promise<{ product: Product; uploadUrl?: string; newSignedUrl?: string }> {
    if (Object.keys(data).length === 0) {
      throw new ValidationError([
        {
          path: 'product',
          message: 'At least one field must be provided for update',
        },
      ])
    }

    const existing = await repo.findById(id)
    if (!existing) {
      throw new NotFoundError([
        { path: 'product', message: 'Product not found' },
      ])
    }

    // Determine the effective quantityType and unitOfMeasurement after update
    const effectiveQuantityType =
      data.quantityType !== undefined
        ? data.quantityType
        : existing.quantityType
    const effectiveUnitOfMeasurement =
      data.unitOfMeasurement !== undefined
        ? data.unitOfMeasurement
        : existing.unitOfMeasurement

    // Validate quantityType and unitOfMeasurement relationship
    if (effectiveQuantityType === 'weight') {
      if (!effectiveUnitOfMeasurement) {
        throw new ValidationError([
          {
            path: 'unitOfMeasurement',
            message:
              "unitOfMeasurement is required when quantityType is 'weight'",
          },
        ])
      }
    } else if (effectiveQuantityType === 'count') {
      if (
        effectiveUnitOfMeasurement !== undefined &&
        effectiveUnitOfMeasurement !== null
      ) {
        throw new ValidationError([
          {
            path: 'unitOfMeasurement',
            message:
              "unitOfMeasurement must be null when quantityType is 'count'",
          },
        ])
      }
      if (effectiveQuantityType === 'count') {
        data.unitOfMeasurement = null
      }
    }

    const product = await repo.update(id, data)

    if (data.attachWithFileExtension) {
      const upload = await filehub.getSignedPutUrl(
        3600 * 24 * 7,
        data.attachWithFileExtension,
      )
      const filename = upload.filename.split('.')[0]
      const newSignedUrl = await filehub.getSignedUrl(`${filename}.avif`)
      await redis.hset(`filehub:${upload.filename}`, {
        id: product.id,
        shouldConvertToAvif: '1',
      })
      return {
        product,
        uploadUrl: upload.signedUrl,
        newSignedUrl: newSignedUrl.signedUrl,
      }
    }
    return { product }
  }
}
