import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is required in the environment.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};
