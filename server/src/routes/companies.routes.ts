import { Router } from "express";
import CompaniesController from "../controllers/companies.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware } from "../middlewares/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads/licenses");
const logoDir = path.join(__dirname, "../../uploads/logos");
const coverDir = path.join(__dirname, "../../uploads/covers");

[uploadDir, logoDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const licenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "license-" + uniqueSuffix + ext);
  },
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "logo-" + uniqueSuffix + ext);
  },
});

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, coverDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "cover-" + uniqueSuffix + ext);
  },
});

const imageFileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and WebP are allowed."));
  }
};

const licenseUpload = multer({
  storage: licenseStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

const coverUpload = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

export default class CompaniesRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.get("/search", asyncWrapper(CompaniesController.searchCompanies));
    this.router.post(
      "/setup",
      authMiddleware,
      licenseUpload.single("license_file"),
      asyncWrapper(CompaniesController.setupCompany)
    );
    this.router.post(
      "/",
      authMiddleware,
      asyncWrapper(CompaniesController.createCompany)
    );
    this.router.get("/my-company", authMiddleware, asyncWrapper(CompaniesController.getMyCompany));
    this.router.get("/:id", asyncWrapper(CompaniesController.getCompany));
    this.router.put("/:id", authMiddleware, asyncWrapper(CompaniesController.updateCompany));
    this.router.post(
      "/:id/logo",
      authMiddleware,
      logoUpload.single("logo"),
      asyncWrapper(CompaniesController.uploadLogo)
    );
    this.router.post(
      "/:id/cover",
      authMiddleware,
      coverUpload.single("cover"),
      asyncWrapper(CompaniesController.uploadCover)
    );
    this.router.get(
      "/admin/pending",
      authMiddleware,
      asyncWrapper(CompaniesController.getPendingCompanies)
    );
    this.router.post(
      "/admin/:id/approve",
      authMiddleware,
      asyncWrapper(CompaniesController.approveCompany)
    );
    this.router.post(
      "/admin/:id/reject",
      authMiddleware,
      asyncWrapper(CompaniesController.rejectCompany)
    );
  }
}
