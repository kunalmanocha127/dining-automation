import { Router } from "express";
import { BillModel } from "../models/Bill";
import { DiningSessionModel } from "../models/DiningSession";
import { HistoryModel } from "../models/History";
import { OrderModel } from "../models/Order";

export const sessionRouter = Router();

sessionRouter.get("/active", async (_req, res, next) => {
  try {
    const sessions = await DiningSessionModel.find({ status: { $in: ["Active", "ReadyForBill"] } })
      .populate("orderIds")
      .sort({ updatedAt: -1 });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

sessionRouter.get("/:id", async (req, res, next) => {
  try {
    const session = await DiningSessionModel.findById(req.params.id).populate("orderIds");

    if (!session) {
      res.status(404).json({ message: "Dining session not found." });
      return;
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

sessionRouter.post("/:id/bill", async (req, res, next) => {
  try {
    const existingBill = await BillModel.findOne({ sessionId: req.params.id });

    if (existingBill) {
      await DiningSessionModel.findByIdAndUpdate(req.params.id, { billId: existingBill._id }, { runValidators: true });
      res.json(existingBill);
      return;
    }

    const session = await DiningSessionModel.findById(req.params.id).populate("orderIds");

    if (!session) {
      res.status(404).json({ message: "Dining session not found." });
      return;
    }

    if (session.status !== "ReadyForBill") {
      res.status(400).json({ message: "Bill can be generated only after all session items are fulfilled." });
      return;
    }

    const orders = session.orderIds as unknown as Array<{
      _id: unknown;
      items: Array<{
        _id: unknown;
        name: string;
        price: number;
        quantity: number;
        specialInstructions: string;
      }>;
    }>;

    const billItems = orders.flatMap((order) =>
      order.items.map((item) => ({
        orderId: order._id,
        orderItemId: item._id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.price * item.quantity,
        specialInstructions: item.specialInstructions
      }))
    );

    const subtotal = billItems.reduce((total, item) => total + item.lineTotal, 0);

    const bill = await BillModel.create({
      sessionId: session._id,
      tableNumber: session.tableNumber,
      mobileNumber: session.mobileNumber,
      items: billItems,
      subtotal,
      totalAmount: subtotal,
      paymentStatus: "Pending"
    });

    session.billId = bill._id;
    await session.save();

    req.app.get("io").emit("bill:generated", bill);
    req.app.get("io").emit("session:updated", session);
    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
});

sessionRouter.patch("/:id/end", async (req, res, next) => {
  try {
    const session = await DiningSessionModel.findById(req.params.id).populate("orderIds");

    if (!session) {
      res.status(404).json({ message: "Dining session not found." });
      return;
    }

    if (!session.billId) {
      res.status(400).json({ message: "Generate a bill before ending the session." });
      return;
    }

    const bill = await BillModel.findById(session.billId);

    if (!bill) {
      res.status(404).json({ message: "Generated bill not found." });
      return;
    }

    const endedAt = new Date();
    const orders = session.orderIds as unknown as Array<{
      _id: unknown;
      status: string;
      orderInstructions: string;
      totalAmount: number;
      createdAt: Date;
      items: Array<{
        _id: unknown;
        menuItemId: unknown;
        name: string;
        price: number;
        quantity: number;
        specialInstructions: string;
        fulfillmentStatus: string;
        fulfilledAt: Date | null;
      }>;
    }>;

    const history = await HistoryModel.findOneAndUpdate(
      { originalSessionId: session._id },
      {
        originalSessionId: session._id,
        originalBillId: bill._id,
        tableNumber: session.tableNumber,
        mobileNumber: session.mobileNumber,
        sessionStatus: "Closed",
        paymentStatus: bill.paymentStatus,
        orders: orders.map((order) => ({
          originalOrderId: order._id,
          status: order.status,
          orderInstructions: order.orderInstructions,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          fulfilledAt:
            order.items
              .map((item) => item.fulfilledAt)
              .filter((value): value is Date => Boolean(value))
              .sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
          items: order.items.map((item) => ({
            originalOrderItemId: item._id,
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            lineTotal: item.price * item.quantity,
            specialInstructions: item.specialInstructions,
            fulfillmentStatus: item.fulfillmentStatus,
            fulfilledAt: item.fulfilledAt
          }))
        })),
        itemCount: orders.reduce((count, order) => count + order.items.length, 0),
        totalAmount: session.totalAmount,
        startedAt: session.startedAt,
        endedAt,
        billGeneratedAt: bill.generatedAt,
        paidAt: bill.paidAt
      },
      { new: true, runValidators: true, upsert: true }
    );

    const orderIds = orders.map((order) => order._id);
    await OrderModel.deleteMany({ _id: { $in: orderIds } });
    await DiningSessionModel.findByIdAndDelete(session._id);

    req.app.get("io").emit("session:ended", {
      sessionId: session._id,
      history
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
});
