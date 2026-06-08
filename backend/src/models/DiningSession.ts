import { Schema, model, InferSchemaType } from "mongoose";

export const diningSessionStatuses = ["Active", "ReadyForBill", "Paid", "Closed", "Cancelled"] as const;
export type DiningSessionStatus = (typeof diningSessionStatuses)[number];

const diningSessionSchema = new Schema(
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
    status: {
      type: String,
      enum: diningSessionStatuses,
      default: "Active",
      index: true
    },
    orderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order"
      }
    ],
    billId: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
      index: true
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

diningSessionSchema.index(
  { tableNumber: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["Active", "ReadyForBill"] }
    }
  }
);

export type DiningSession = InferSchemaType<typeof diningSessionSchema>;

export const DiningSessionModel = model<DiningSession>("DiningSession", diningSessionSchema);
