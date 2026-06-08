import { Router } from "express";
import { HistoryModel } from "../models/History";

export const historyRouter = Router();

historyRouter.get("/", async (_req, res, next) => {
  try {
    const history = await HistoryModel.find().sort({ endedAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

historyRouter.get("/:id", async (req, res, next) => {
  try {
    const history = await HistoryModel.findById(req.params.id);

    if (!history) {
      res.status(404).json({ message: "History record not found." });
      return;
    }

    res.json(history);
  } catch (error) {
    next(error);
  }
});
