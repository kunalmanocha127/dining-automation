import { Router } from "express";
import { MenuItemModel } from "../models/MenuItem";

export const menuRouter = Router();

menuRouter.get("/", async (_req, res, next) => {
  try {
    const menuItems = await MenuItemModel.find().sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});

menuRouter.post("/", async (req, res, next) => {
  try {
    const menuItem = await MenuItemModel.create(req.body);
    req.app.get("io").emit("menu:item-created", menuItem);
    res.status(201).json(menuItem);
  } catch (error) {
    next(error);
  }
});

menuRouter.put("/:id", async (req, res, next) => {
  try {
    const menuItem = await MenuItemModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!menuItem) {
      res.status(404).json({ message: "Menu item not found." });
      return;
    }

    req.app.get("io").emit("menu:item-updated", menuItem);
    res.json(menuItem);
  } catch (error) {
    next(error);
  }
});

menuRouter.patch("/:id/availability", async (req, res, next) => {
  try {
    const { isAvailable } = req.body as { isAvailable?: unknown };

    if (typeof isAvailable !== "boolean") {
      res.status(400).json({ message: "isAvailable must be a boolean." });
      return;
    }

    const menuItem = await MenuItemModel.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      res.status(404).json({ message: "Menu item not found." });
      return;
    }

    req.app.get("io").emit("menu:availability-changed", {
      itemId: menuItem._id,
      isAvailable: menuItem.isAvailable
    });

    res.json(menuItem);
  } catch (error) {
    next(error);
  }
});

menuRouter.delete("/:id", async (req, res, next) => {
  try {
    const menuItem = await MenuItemModel.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      res.status(404).json({ message: "Menu item not found." });
      return;
    }

    req.app.get("io").emit("menu:item-deleted", { itemId: menuItem._id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
