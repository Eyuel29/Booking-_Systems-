import React, { useState } from "react";
import axios from "axios";
import { assets } from "../assets/assets";
import { toast } from "react-hot-toast";

const ReservationForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    SenderName: "",
    email: "",
    phone: "",
    events: "Private Screening",
    peopleAttend: "",
    message: "",
    ReservedDate: "",
    eventStartTime: "",
    eventEndTime: "",
    Talk: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Required fields check
    const requiredFields = [
      "title",
      "SenderName",
      "email",
      "phone",
      "events",
      "peopleAttend",
      "ReservedDate",
      "eventStartTime",
      "eventEndTime",
      "Talk",
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        toast.error("Please fill all required fields ❌");
        return;
      }
    }

    // ✅ Time validation
    const [startHour, startMinute] = formData.eventStartTime.split(":").map(Number);
    const [endHour, endMinute] = formData.eventEndTime.split(":").map(Number);

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    if (startTotal < 8 * 60 || startTotal > 22 * 60 || endTotal < 8 * 60 || endTotal > 22 * 60) {
      toast.error("Reservation time must be between 08:00 and 22:00 ⏰");
      return;
    }

    if (endTotal <= startTotal) {
      toast.error("End time must be after start time ⏰");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/reserve/Add", formData);

      // ✅ Custom success message based on contact method
      if (formData.Talk === "Phone") {
        toast.success(`Thank you ${formData.title} ${formData.SenderName}, we will call you soon 📞`);
      } else if (formData.Talk === "Email") {
        toast.success(`Thank you ${formData.title} ${formData.SenderName}, we will email you shortly ✉️`);
      } else {
        toast.success(`Reservation submitted successfully ✅`);
      }

      // ✅ Reset form
      setFormData({
        title: "",
        SenderName: "",
        email: "",
        phone: "",
        events: "Private Screening",
        peopleAttend: "",
        message: "",
        ReservedDate: "",
        eventStartTime: "",
        eventEndTime: "",
        Talk: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 xl:p-10">
    
      <div className="w-full max-w-lg xl:max-w-6xl mt-40 bg-gray-800 p-6 sm:p-8 shadow-xl rounded-2xl border border-gray-700">
        <img src={assets.logo} alt="Logo" className="w-16 h-auto mx-auto" />
        <h2 className="text-3xl font-extrabold text-primary mb-4 text-center border-b border-primary pb-2">
          Book the Hall
        </h2>

        <p className="text-gray-300 text-sm mb-6 text-center">
          N.B — You are not paying yet, this is just a reservation.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ✅ Title and Full Name */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-4">
  {/* Title */}
  <div className="flex flex-col">
    <label className="text-gray-300 font-medium mb-2">Title:</label>
    <select
      name="title"
      value={formData.title}
      onChange={handleChange}
      required
      className="bg-gray-900 text-white px-3 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-all duration-300 shadow-inner"
    >
      <option value="">Select Title...</option>
      <option value="Ato">Ato</option>
      <option value="W/ro">W/ro</option>
      <option value="W/rt">W/rt</option>
      <option value="Dr">Dr</option>
    </select>
  </div>
  
  {/* Full Name */}
  <div className="flex flex-col">
    <label className="text-gray-300 font-medium mb-2">Full Name:</label>
    <input
      type="text"
      name="SenderName"
      placeholder="Full Name"
      value={formData.SenderName}
      onChange={handleChange}
      required
      className="bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400 shadow-inner transition-all duration-300 hover:border-primary"
    />
  </div>
</div>


          {/* ✅ Email & Phone */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white">Email:</label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white">Phone:</label>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>
          </div>

          {/* ✅ Event Type and People Attending */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white">Event Type:</label>
              <select
                name="events"
                value={formData.events}
                onChange={handleChange}
                required
                className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Private Screening">Private Screening</option>
                <option value="Business Meetings">Business Meetings</option>
                <option value="School Package">School Package</option>
                <option value="Special Events">Special Events</option>
                <option value="Corporate Celebrations">Corporate Celebrations</option>
                <option value="Movies">Movies</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-white">People Attending:</label>
              <input
                type="number"
                name="peopleAttend"
                placeholder="Number of People Attending"
                value={formData.peopleAttend}
                onChange={handleChange}
                min="20"
                required
                className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>
          </div>

          {/* ✅ Talk Via and Date */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white">Talk Via:</label>
              <select
                name="Talk"
                value={formData.Talk}
                onChange={handleChange}
                required
                className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="">Select...</option>
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-white">Pick Date:</label>
             <input
              type="date"
              name="ReservedDate"
              value={formData.ReservedDate}
              onChange={handleChange}
              required
              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]} // prevents today & past
              className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />

            </div>
          </div>

          {/* ✅ Start and End Time */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white">Start Time:</label>
              <input
                type="time"
                name="eventStartTime"
                value={formData.eventStartTime}
                onChange={handleChange}
                min="08:00"
                max="22:00"
                required
                className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white">End Time:</label>
              <input
                type="time"
                name="eventEndTime"
                value={formData.eventEndTime}
                onChange={handleChange}
                min="08:01"
                max="22:00"
                required
                className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* ✅ Message */}
          <div className="flex flex-col">
            <label className="text-white">Message:</label>
            <textarea
              name="message"
              placeholder="Message / Special Requirements (Optional)"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              className="border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400 resize-none"
            />
          </div>

          {/* ✅ Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-primary text-gray-900 font-semibold tracking-wider uppercase px-4 py-3 rounded-lg shadow-md hover:bg-primary-dull transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? "Booking..." : "Book Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm;
