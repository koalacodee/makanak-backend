// Repository interfaces for drivers module
// Note: Drivers primarily use Redis, but we need order repository access

import type { IOrderRepository } from "../../orders/domain/orders.iface";

export interface IDriverService {
  // Redis operations are handled directly in use cases
  // This interface is for future extensibility if needed
}
