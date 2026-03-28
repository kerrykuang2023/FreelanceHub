import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

const getDatabaseConfig = () => {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || "";
  
  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 30000,
  };

  return { uri, options };
};

const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    console.log("✅[Database]: Already connected to MongoDB");
    return;
  }

  const config = getDatabaseConfig();
  
  if (!config.uri) {
    console.error("❌[Database]: MONGO_URI or MONGO_URL environment variable is not set");
    process.exit(1);
  }

  try {
    console.log("⏳[Database]: Connecting to MongoDB...");
    
    await mongoose.connect(config.uri, config.options);
    
    isConnected = true;
    console.log("✅[Database]: MongoDB connected successfully");
    
    mongoose.connection.on("error", (error) => {
      console.error("❌[Database]: MongoDB connection error:", error);
      isConnected = false;
    });
    
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️[Database]: MongoDB disconnected");
      isConnected = false;
    });
    
  } catch (error) {
    console.error("❌[Database]: Failed to connect to MongoDB:", error);
    console.log("🔄[Database]: Retrying connection in 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectDatabase();
  }
};

const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("✅[Database]: MongoDB disconnected gracefully");
  } catch (error) {
    console.error("❌[Database]: Error disconnecting from MongoDB:", error);
  }
};

const checkDatabaseConnection = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export { connectDatabase, disconnectDatabase, checkDatabaseConnection, getDatabaseConfig };
