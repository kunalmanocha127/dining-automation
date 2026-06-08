import { Router } from "express";
import { BillModel } from "../models/Bill";

export const billRouter = Router();

billRouter.get("/visible", async (_req, res, next) => {
  try {
    const paidVisibleSince = new Date(Date.now() - 60_000);
    const bills = await BillModel.find({
      $or: [{ paymentStatus: "Pending" }, { paymentStatus: "Paid", paidAt: { $gte: paidVisibleSince } }]
    }).sort({ updatedAt: -1 });

    res.json(bills);
  } catch (error) {
    next(error);
  }
});

billRouter.patch("/:id/paid", async (req, res, next) => {
  try {
    const bill = await BillModel.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Paid", paidAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!bill) {
      res.status(404).json({ message: "Bill not found." });
      return;
    }

    req.app.get("io").emit("bill:paid", bill);
    res.json(bill);
  } catch (error) {
    next(error);
  }
});
