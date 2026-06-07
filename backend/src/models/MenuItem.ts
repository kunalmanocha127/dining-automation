import { Schema, model, InferSchemaType } from "mongoose";

const menuItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

menuItemSchema.index({ category: 1, name: 1 }, { unique: true });

export type MenuItem = InferSchemaType<typeof menuItemSchema>;

export const MenuItemModel = model<MenuItem>("MenuItem", menuItemSchema);
