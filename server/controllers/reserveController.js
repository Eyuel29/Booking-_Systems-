import nodemailer from "nodemailer";
import Reserve from "../models/Reserve.js";

// Create and send hall reservation
export const createReservation = async (req, res) => {
  try {
    const { SenderName, email, phone, events, peopleAttend, message, ReservedDate } = req.body;

    // Save reservation to MongoDB
    const newReserve = await Reserve.create({
      SenderName,
      email,
      phone,
      events,
      peopleAttend,
      message,
      ReservedDate,
    });

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email to yourself
    await transporter.sendMail({
      from: `"Cinema Hall Booking" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "New Hall Reservation",
      html: `
        <h2>New Hall Reservation</h2>
        <p><strong>Name:</strong> ${SenderName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Event:</strong> ${events}</p>
        <p><strong>People Attending:</strong> ${peopleAttend}</p>
        <p><strong>Date:</strong> ${new Date(ReservedDate).toLocaleString()}</p>
        <p><strong>Message:</strong> ${message || "No message"}</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Reservation created and email sent successfully.",
      data: newReserve,
    });
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get all reservations (for admin)
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reserve.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
