import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import Reserve from "../models/Reserve.js";

//  Needed to simulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  Absolute path to your logo image
const logoPath = path.resolve(__dirname, "../assets/logo.png");

export const createReservation = async (req, res) => {
  try {
    const {
      title,
      SenderName,
      email,
      phone,
      events,
      Talk,
      peopleAttend,
      message,
      ReservedDate,
      eventStartTime,
      eventEndTime,
    } = req.body;

    //  1. Validate ReservedDate (not today or past)
    const today = new Date();
    const reservedDate = new Date(ReservedDate);

    today.setHours(0, 0, 0, 0);
    reservedDate.setHours(0, 0, 0, 0);

    if (reservedDate <= today) {
      return res.status(400).json({
        success: false,
        message: "Reservation date must be in the future (not today or past).",
      });
    }

    //  (optional) Limit reservations to within 60 days
    const maxAdvance = new Date();
    maxAdvance.setDate(today.getDate() + 60);
    if (reservedDate > maxAdvance) {
      return res.status(400).json({
        success: false,
        message: "Reservations can only be made within 60 days in advance.",
      });
    }

    //  2. Convert times to numbers for comparison
    const [startHour, startMinute] = eventStartTime.split(":").map(Number);
    const [endHour, endMinute] = eventEndTime.split(":").map(Number);

    //  3. Check if times are within hall hours (08:00 – 22:00)
    if (
      startHour < 8 || startHour > 22 ||
      endHour < 8 || endHour > 22
    ) {
      return res.status(400).json({
        success: false,
        message: "Reservation time must be between 08:00 and 22:00",
      });
    }

    //  4. Ensure end time is after start time
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    if (endTotal <= startTotal) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    //  5. Save reservation
    const newReserve = await Reserve.create({
      title,
      SenderName,
      email,
      phone,
      events,
      Talk,
      peopleAttend,
      message,
      ReservedDate,
      eventStartTime,
      eventEndTime,
    });

    //  6. Send Emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ---- ADMIN EMAIL ----
    await transporter.sendMail({
      from: `"Century Cinema " <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "New Hall Reservation",
      html: `
        <h2>New Hall Reservation</h2>
        <p><strong>Name:</strong> ${title} ${SenderName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Preferred Contact:</strong> ${Talk}</p>
        <p><strong>Event:</strong> ${events}</p>
        <p><strong>People Attending:</strong> ${peopleAttend}</p>
        <p><strong>Date:</strong> ${new Date(ReservedDate).toLocaleDateString()}</p>
        <p><strong>Start Time:</strong> ${eventStartTime}</p>
        <p><strong>End Time:</strong> ${eventEndTime}</p>
        <p><strong>Message:</strong> ${message || "No message provided"}</p>
      `,
    });

    // ---- USER EMAIL ----
    await transporter.sendMail({
      from: `"Century Cinema Hall" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reservation Request Received",
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "centurycinema-logo",
        },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
          <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-top: 5px solid #d9534f; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="padding: 30px; text-align: center; border-bottom: 1px dashed #eee;">
              <img src="cid:centurycinema-logo" width="50" style="margin-bottom: 10px; opacity: 0.8;" />
              <h2 style="margin: 0; color: #333;">Reservation Request</h2>
              <p style="color: #888; margin-top: 5px;">Century Cinema Hall</p>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #555;">Hi ${title} ${SenderName},</p>
              <p style="line-height: 1.6; color: #666;">We’ve received your hall reservation request. We’ll review it and contact you soon.</p>

              <table width="100%" style="margin-top: 25px; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; color: #999;">Event Type</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold;">${events}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; color: #999;">Date</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold;">${new Date(ReservedDate).toDateString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; color: #999;">Time</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold;">${eventStartTime} - ${eventEndTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #999;">Contact via</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #d9534f;">${Talk}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #aaa;">
              <p style="margin: 0;">Thank you for choosing Century Cinema Hall.</p>
            </div>
          </div>
        </div>
      `,
    });

    //  Response
    res.status(201).json({
      success: true,
      message: "Reservation created successfully. Emails sent.",
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

//  Approve reservation
export const approveReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Reserve.findByIdAndUpdate(
      id,
      { approved: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Reservation approved successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error approving reservation:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//  Delete reservation
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Reserve.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Reservation deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};