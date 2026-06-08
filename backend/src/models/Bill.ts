import { Schema, model, InferSchemaType } from "mongoose";

export const billPaymentStatuses = ["Pending", "Paid", "Failed", "Cancelled"] as const;

const billItemSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    orderItemId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const billSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "DiningSession",
      required: true,
      unique: true,
      index: true
    },
    tableNumber: {
      type: Number,
      required: true,
      min: 1
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [billItemSchema],
      required: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: billPaymentStatuses,
      default: "Pending",
      index: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type Bill = InferSchemaType<typeof billSchema>;

export const BillModel = model<Bill>("Bill", billSchema);
