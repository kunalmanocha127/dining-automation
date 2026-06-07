import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { MenuItemModel } from "../models/MenuItem";

const menuItems = [
  {
    name: "Paneer Tikka",
    description: "Char-grilled paneer with peppers, onions, and house tikka marinade.",
    category: "Starters",
    price: 249,
    imageUrl: "",
    isAvailable: true
  },
  {
    name: "Crispy Corn",
    description: "Golden fried corn tossed with chilli, garlic, and spring onion.",
    category: "Starters",
    price: 189,
    imageUrl: "",
    isAvailable: true
  },
  {
    name: "Butter Chicken",
    description: "Tender chicken simmered in a rich tomato, butter, and cream gravy.",
    category: "Main Course",
    price: 349,
    imageUrl: "",
    isAvailable: true
  },
  {
    name: "Dal Makhani",
    description: "Slow-cooked black lentils finished with butter and cream.",
    category: "Main Course",
    price: 269,
    imageUrl: "",
    isAvailable: true
  },
  {
    name: "Veg Biryani",
    description: "Aromatic basmati rice layered with vegetables, herbs, and spices.",
    category: "Rice & Biryani",
    price: 239,
    imageUrl: "",
    isAvailable: true
  },
  {
    name: "Garlic Naan",
    description: "Tandoor-baked naan brushed with garlic butter.",
    category: "Breads",
    price: 79,
    imageUrl: "",
    isAvailable: true
  },
  {
    name: "Masala Chaas",
    description: "Chilled buttermilk with roasted cumin, mint, and mild spices.",
    category: "Beverages",
    price: 69,
    imageUrl: "",
    isAvailable: true
  },
  {
    name: "Gulab Jamun",
    description: "Warm milk-solid dumplings soaked in cardamom sugar syrup.",
    category: "Desserts",
    price: 119,
    imageUrl: "",
    isAvailable: true
  }
];

const seedMenu = async (): Promise<void> => {
  await connectDB();

  await MenuItemModel.deleteMany({});
  await MenuItemModel.insertMany(menuItems);

  console.log(`Seeded ${menuItems.length} menu items.`);
  await mongoose.disconnect();
};

seedMenu().catch(async (error) => {
  console.error("Failed to seed menu items", error);
  await mongoose.disconnect();
  process.exit(1);
});
