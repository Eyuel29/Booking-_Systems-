import express from "express";
import { createReservation, getAllReservations } from "../controllers/reserveController.js";

const router = express.Router();

router.post("/Add", createReservation);
router.get('/get', getAllReservations);

export default router;
