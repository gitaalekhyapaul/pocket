import { Router } from "express";
import { SpendController } from "../controllers/spendController.js";

const router = Router();
const spendController = new SpendController();

// Spend request routes
router.get(
  "/requests/pending",
  spendController.getPendingRequests.bind(spendController)
);
router.post(
  "/requests/approve",
  spendController.approveSpend.bind(spendController)
);
router.post(
  "/requests/reject",
  spendController.rejectSpend.bind(spendController)
);
router.get(
  "/requests/history",
  spendController.getSpendHistory.bind(spendController)
);

// Transaction routes
router.get(
  "/transactions/history",
  spendController.getTransactionHistory.bind(spendController)
);

export default router;
