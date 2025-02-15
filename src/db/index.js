import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connect = async () => {
  try {
    console.log(`Connecting to: ${process.env.MONGODB_URI}/${DB_NAME}`);
    
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    console.log(`MongoDB Connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connect;
