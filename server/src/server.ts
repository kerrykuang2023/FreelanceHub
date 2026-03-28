import Application from "./application";

const app = new Application();

const startServer = async () => {
  try {
    await app.initializeDatabase();
    app.start();
  } catch (error) {
    console.error("❌[Server]: Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

process.on("uncaughtException", (err: Error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("❌ UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
