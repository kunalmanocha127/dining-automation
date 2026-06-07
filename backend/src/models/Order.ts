import { Schema, model, InferSchemaType, Types } from "mongoose";

export const orderStatuses = ["Received", "Preparing", "Ready to Serve", "Fulfilled", "Paid", "Cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const fulfillmentStatuses = ["Pending", "Fulfilled"] as const;

const orderItemSchema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: ""
    },
    fulfillmentStatus: {
      type: String,
      enum: fulfillmentStatuses,
      default: "Pending",
      index: true
    },
    fulfilledAt: {
      type: Date,
      default: null
    }
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      min: 1,
      index: true
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Mobile number must be 10 digits."]
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "Order must contain at least one item."
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: orderStatuses,
      default: "Received",
      index: true
    },
    orderInstructions: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

orderSchema.index({ createdAt: -1 });

export type Order = InferSchemaType<typeof orderSchema>;

export type CreateOrderItemInput = {
  menuItemId: Types.ObjectId | string;
  quantity: number;
  specialInstructions?: string;
};

export const OrderModel = model<Order>("Order", orderSchema);
