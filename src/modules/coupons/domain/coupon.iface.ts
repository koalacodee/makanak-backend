import { Coupon, CouponInput } from "./coupon.entity";

export interface ICouponRepository {
  findAll(): Promise<Coupon[]>;
  findById(id: string): Promise<Coupon | null>;
  findByName(name: string): Promise<Coupon | null>;
  create(data: CouponInput): Promise<Coupon>;
  update(id: string, data: Partial<CouponInput>): Promise<Coupon>;
  delete(id: string): Promise<void>;
}
