import { Router } from "express";
import { Types } from "mongoose";
import { MenuItemModel } from "../models/MenuItem";
import { CreateOrderItemInput, OrderModel, OrderStatus, orderStatuses } from "../models/Order";

export const orderRouter = Router();

type CreateOrderRequest = {
  tableNumber?: unknown;
  mobileNumber?: unknown;
  items?: CreateOrderItemInput[];
  orderInstructions?: unknown;
};

const activeStatuses: OrderStatus[] = ["Received", "Preparing", "Ready to Serve", "Fulfilled"];

const isOrderStatus = (value: string): value is OrderStatus => {
  return orderStatuses.includes(value as OrderStatus);
};

orderRouter.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" && isOrderStatus(req.query.status) ? req.query.status : undefined;
    const query = status ? { status } : {};
    const orders = await OrderModel.find(query).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

orderRouter.get("/active", async (_req, res, next) => {
  try {
    const orders = await OrderModel.find({ status: { $in: activeStatuses } }).sort({ createdAt: 1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

orderRouter.post("/", async (req, res, next) => {
  try {
    const { tableNumber, mobileNumber, items, orderInstructions } = req.body as CreateOrderRequest;

    if (typeof tableNumber !== "number" || tableNumber < 1) {
      res.status(400).json({ message: "tableNumber must be a positive number." });
      return;
    }

    if (typeof mobileNumber !== "string" || !/^[0-9]{10}$/.test(mobileNumber)) {
      res.status(400).json({ message: "mobileNumber must be a 10 digit string." });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "items must contain at least one order item." });
      return;
    }

    const menuItemIds = items.map((item) => item.menuItemId).filter((id) => Types.ObjectId.isValid(id));

    if (menuItemIds.length !== items.length) {
      res.status(400).json({ message: "Every order item must include a valid menuItemId." });
      return;
    }

    const menuItems = await MenuItemModel.find({ _id: { $in: menuItemIds } });
    const menuItemById = new Map(menuItems.map((item) => [String(item._id), item]));

    const orderItems = items.map((item) => {
      const menuItem = menuItemById.get(String(item.menuItemId));

      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }

      if (!menuItem.isAvailable) {
        throw new Error(`${menuItem.name} is currently unavailable.`);
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error("Each item quantity must be at least 1.");
      }

      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions ?? "",
        fulfillmentStatus: "Pending"
      };
    });

    const totalAmount = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);

    const order = await OrderModel.create({
      tableNumber,
      mobileNumber,
      items: orderItems,
      totalAmount,
      orderInstructions: typeof orderInstructions === "string" ? orderInstructions : ""
    });

    req.app.get("io").emit("order:created", order);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

orderRouter.patch("/:orderId/items/:itemId/fulfill", async (req, res, next) => {
  try {
    const order = await OrderModel.findById(req.params.orderId);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const orderItem = order.items.id(req.params.itemId);

    if (!orderItem) {
      res.status(404).json({ message: "Order item not found." });
      return;
    }

    orderItem.fulfillmentStatus = "Fulfilled";
    orderItem.fulfilledAt = new Date();

    if (order.status === "Received") {
      order.status = "Preparing";
    }

    const allItemsFulfilled = order.items.every((item) => item.fulfillmentStatus === "Fulfilled");

    if (allItemsFulfilled) {
      order.status = "Fulfilled";
    }

    await order.save();

    req.app.get("io").emit("order:item-fulfilled", {
      orderId: order._id,
      itemId: orderItem._id,
      order
    });

    if (allItemsFulfilled) {
      req.app.get("io").emit("order:fulfilled", order);
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

orderRouter.patch("/:id/fulfill", async (req, res, next) => {
  try {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const fulfilledAt = new Date();
    order.items.forEach((item) => {
      item.fulfillmentStatus = "Fulfilled";
      item.fulfilledAt = item.fulfilledAt ?? fulfilledAt;
    });
    order.status = "Fulfilled";

    await order.save();

    req.app.get("io").emit("order:fulfilled", order);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

orderRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body as { status?: unknown };

    if (typeof status !== "string" || !isOrderStatus(status)) {
      res.status(400).json({ message: "Invalid order status." });
      return;
    }

    const order = await OrderModel.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    req.app.get("io").emit("order:status-updated", {
      orderId: order._id,
      status: order.status
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
});
