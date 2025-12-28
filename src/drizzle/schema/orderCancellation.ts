import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { pgEnum } from "drizzle-orm/pg-core";

export const cancelledByEnum = pgEnum("cancelled_by", ["driver", "inventory"]);
export const orderCancellation = pgTable(
  "order_cancellation",
  {
    id: uuid("id").primaryKey(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .unique(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    cancelledBy: cancelledByEnum("cancelled_by"),
  },
  (table) => [index("order_cancellation_order_id_idx").on(table.orderId)]
);
