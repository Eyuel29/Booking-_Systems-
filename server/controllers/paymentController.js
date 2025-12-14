import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { Chapa } from "chapa-nodejs";

const chapa = new Chapa(process.env.CHAPA_SECRET_KEY ?? "");

export const initializePayment = async (req, res) => {
  const { bookingId } = req.params;

  if (!bookingId) {
    return res.json({ success: false, message: "Invalid input!" });
  }

  try {
    const booking = await Booking.findById(bookingId).populate("user");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found!" });
    }

    const paymentInfo = {
      amount: booking.amount,
      callback_url: `${process.env.BACKEND_URL}/api/payment/verify/${bookingId}`,
      return_url: `${process.env.FRONTEND_URL}/booking/success`,
      currency: "ETB",
      customization: {
        title: "Cinema Ticket Booking",
        description: `Booking for ${booking.bookedSeats.length} seat(s)`,
      },
      email: booking.user.email,
      first_name: booking.user.name?.split(" ")[0] || "Customer",
      last_name: booking.user.name?.split(" ")[1] || "",
      metadata: {
        bookingId: booking._id,
        showId: booking.show,
      },
      phone_number: booking.user.phone || "",
      tx_ref: `booking-${bookingId}-${Date.now()}`,
    };

    const { data, status } = await chapa.initialize(paymentInfo);

    if (status !== "success") {
      return res
        .status(500)
        .json({ success: false, message: "Payment initialization failed!" });
    }

    const payment = await Payment.create({
      first_name: paymentInfo.first_name,
      last_name: paymentInfo.last_name,
      email: paymentInfo.email,
      currency: paymentInfo.currency,
      amount: paymentInfo.amount,
      tx_ref: paymentInfo.tx_ref,
      customization: paymentInfo.customization,
      meta: paymentInfo.metadata,
      booking: booking._id,
      user: booking.user._id,
      status: "pending",
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { txRef } = req.params;
    const result = await chapa.verify({
      tx_ref: txRef,
    });

    if (!result || !result.data) {
      return res
        .status(404)
        .json({ success: false, message: "No transaction found!" });
    }

    if (result.data.status === "failed") {
      return res
        .status(500)
        .json({ success: false, message: "Transaction failed!" });
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { tx_ref: txRef },
      {
        status: result.data.status,
        reference: result.data.reference,
        method: result.data.method,
        charge: result.data.charge,
        mode: result.data.mode,
        type: result.data.type,
        updated_at: new Date(),
      },
      { new: true }
    );

    res.json({ success: true, payment: updatedPayment });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
