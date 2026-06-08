import { Router } from "express";
import { DiningSessionModel } from "../models/DiningSession";

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
