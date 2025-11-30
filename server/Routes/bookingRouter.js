import express from "express";
import { createBooking, getOccupiedSeats } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/create", createBooking);
router.get("/seats/:showId", getOccupiedSeats);

export default router;
