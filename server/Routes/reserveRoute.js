import express from "express";
import { createReservation, getAllReservations, approveReservation, deleteReservation } from "../controllers/reserveController.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/Add", createReservation);
router.get('/get', getAllReservations);
router.patch("/approve/:id", approveReservation);
router.delete("/delete/:id", deleteReservation);

export default router;
