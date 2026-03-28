import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Routes from "./routes";
import Seeders from "./seeders";
import { errorMiddleware } from "./middlewares/error.middleware";
import passport from "passport";
import { connectDatabase } from "./config/database.config";

class Application {
  public server;

  constructor() {
    this.server = express();

    this.environment();
    this.middlewares();
    this.passport();
    this.routes();
    this.initDirectories();
  }

  private environment() {
    dotenv.config();
  }

  private middlewares() {
    const corsOptions = {
      origin: process.env.CORS_ORIGIN || "http://localhost:5137",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    };
    this.server.use(cors(corsOptions));
    this.server.use(express.json({ limit: "10mb" }));
    this.server.use(express.urlencoded({ extended: true, limit: "10mb" }));
  }

  private routes() {
    new Routes(this.server);
    this.server.use(errorMiddleware);
  }

  private initDirectories() {
    const directories = [
      path.join(__dirname, "../public"),
      path.join(__dirname, "../public/resumes"),
      path.join(__dirname, "../public/uploads"),
      path.join(__dirname, "../public/avatars"),
      path.join(__dirname, "../public/invoices"),
      path.join(__dirname, "../public/contracts"),
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  public async initializeDatabase() {
    await connectDatabase();
    await Seeders.runSeeders();
  }

  private passport() {
    this.server.use(passport.initialize());
    require("./middlewares/jwt.middleware")(passport);
  }

  public start() {
    const PORT: number = process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : 5555;
    this.server
      .listen(PORT, () => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `⚡️[Server]: Server is running at http://localhost:${PORT}`
          );
        } else {
          console.log(`⚡️[Server]: Server is running`);
        }
      })
      .on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.log(`❌ Error: address already in use`);
        } else {
          console.log(err);
        }
      });
  }
}

export default Application;
