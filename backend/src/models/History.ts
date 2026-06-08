import { Schema, model, InferSchemaType } from "mongoose";

const historyItemSchema = new Schema(
  {
    originalOrderItemId: {
      type: Schema.Types.ObjectId,
      required: true
    },
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
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: ""
    },
    fulfillmentStatus: {
      type: String,
      required: true
    },
    fulfilledAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const historyOrderSchema = new Schema(
  {
    originalOrderId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    orderInstructions: {
      type: String,
      trim: true,
      default: ""
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    createdAt: {
      type: Date,
      required: true
    },
    fulfilledAt: {
      type: Date,
      default: null
    },
    items: {
      type: [historyItemSchema],
      required: true
    }
  },
  { _id: false }
);

const historySchema = new Schema(
  {
    originalSessionId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },
    originalBillId: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true
    },
    tableNumber: {
      type: Number,
      required: true,
      min: 1,
      index: true
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true
    },
    sessionStatus: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      required: true,
      index: true
    },
    orders: {
      type: [historyOrderSchema],
      required: true
    },
    itemCount: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    startedAt: {
      type: Date,
      required: true
    },
    endedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    billGeneratedAt: {
      type: Date,
      required: true
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

historySchema.index({ endedAt: -1 });

export type History = InferSchemaType<typeof historySchema>;

export const HistoryModel = model<History>("History", historySchema);
