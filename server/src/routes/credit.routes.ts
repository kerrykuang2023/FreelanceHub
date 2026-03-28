import { Router } from "express";
import CreditController from "../controllers/credit.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.get("/my", authMiddleware, asyncWrapper(CreditController.getMyCredit));
router.get("/history", authMiddleware, asyncWrapper(CreditController.getTransactionHistory));

router.post("/adjust", authMiddleware, requireRole("admin"), asyncWrapper(CreditController.adjustCredit));
router.get("/user/:userId", authMiddleware, requireRole("admin"), asyncWrapper(CreditController.getUserCredit));

export default router;
