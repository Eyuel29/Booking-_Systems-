import mongoose from "mongoose";
import User from "../models/User.js";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";

// CREATE BOOKING
export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats = [], category, snacks = [], wantSnacks = false } = req.body;

    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0)
      return res.json({ success: false, message: "No seats selected" });

    const cat = String(category).toLowerCase();
    if (!["regular", "vip"].includes(cat))
      return res.json({ success: false, message: "Invalid category" });

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    const existingBookings = await Booking.find({
      show: showId,
      category: cat,
      bookedSeats: { $in: selectedSeats.map((s) => s.trim().toUpperCase()) },
    });

    if (existingBookings.length > 0)
      return res.json({ success: false, message: "One or more selected seats are already taken" });

    const showData = await Show.findById(showId);
    if (!showData) return res.json({ success: false, message: "Show not found" });

    const seatPrice = Number(
      cat === "vip"
        ? showData?.showPrice?.vip ?? 0
        : showData?.showPrice?.regular ?? 0
    );

    if (!seatPrice || seatPrice <= 0) {
      return res.json({ success: false, message: "Invalid or missing seat price for this show." });
    }

    const seatsAmount = seatPrice * selectedSeats.length;

    let totalSnacksPrice = 0;
    if (wantSnacks && Array.isArray(snacks) && snacks.length > 0) {
      totalSnacksPrice = snacks.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    }

    const totalAmount = seatsAmount + totalSnacksPrice;

    console.log({ seatPrice, seatsAmount, totalSnacksPrice, totalAmount }); // debug log

    const booking = await Booking.create({
      user: userId,
      email: user.email,
      show: showId,
      type: showData.type,
      hall: showData.hall,
      bookedSeats: selectedSeats.map((s) => s.trim().toUpperCase()),
      amount: totalAmount,
      category: cat,
      snacks: wantSnacks && Array.isArray(snacks) ? snacks : [],
      isPaid: false,
    });

    res.json({ success: true, message: "Booked successfully", booking });
  } catch (err) {
    console.error("createBooking error:", err);
    res.json({ success: false, message: err.message || "Something went wrong" });
  }
};


// GET OCCUPIED SEATS
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    // Fetch all bookings for this show
    const bookings = await Booking.find({ show: showId });

    const occupiedSeats = { regular: [], vip: [] };

    bookings.forEach((b) => {
      const cat = b.category.toLowerCase();
      if (!occupiedSeats[cat]) occupiedSeats[cat] = [];
      occupiedSeats[cat].push(...b.bookedSeats.map((s) => String(s).trim().toUpperCase()));
    });

    res.json({ success: true, occupiedSeats });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
