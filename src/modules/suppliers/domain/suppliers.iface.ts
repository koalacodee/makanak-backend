import { Supplier, SupplierInput, SupplierStatus } from "./supplier.entity";

export interface ISupplierRepository {
  findAll(filters?: {
    status?: SupplierStatus;
    category?: string;
  }): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
  create(data: SupplierInput): Promise<Supplier>;
  update(id: string, data: Partial<SupplierInput>): Promise<Supplier>;
  delete(id: string): Promise<void>;
}
