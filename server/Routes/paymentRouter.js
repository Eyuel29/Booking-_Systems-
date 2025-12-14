import express from "express";
import {
  initializePayment,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/initialize/:bookingId", initializePayment);
router.get("/verify/:txRef", verifyPayment);

export default router;
