import React, { useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

const ReservationForm = () => {
  const [formData, setFormData] = useState({
    SenderName: "",
    email: "",
    phone: "",
    events: "Private Screening",
    peopleAttend: "",
    message: "",
    ReservedDate: "",
  });

  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("/api/reserve/Add", formData);

      // Show success toast
      toast.success("Reservation successful! Check your email ✅");

      // Reset form
      setFormData({
        SenderName: "",
        email: "",
        phone: "",
        events: "Private Screening",
        peopleAttend: "",
        message: "",
        ReservedDate: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 bg-white shadow-md rounded-lg mt-6">
      {/* Hot Toast container */}
      <Toaster position="top-right" reverseOrder={false} />

      <h2 className="text-2xl font-bold mb-4 text-center">Book the Hall</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="SenderName"
          placeholder="Full Name"
          value={formData.SenderName}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <select
          name="events"
          value={formData.events}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="Business Meetings">Business Meetings</option>
          <option value="Private Screening">Private Screening</option>
          <option value="School Package">School Package</option>
          <option value="Special Events">Special Events</option>
          <option value="Corporate Celebrations">Corporate Celebrations</option>
          <option value="Movies">Movies</option>
        </select>

        <input
          type="number"
          name="peopleAttend"
          placeholder="Number of People Attending"
          value={formData.peopleAttend}
          onChange={handleChange}
          min="1"
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="date"
          name="ReservedDate"
          value={formData.ReservedDate}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <textarea
          name="message"
          placeholder="Message (optional)"
          value={formData.message}
          onChange={handleChange}
          rows="3"
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {loading ? "Applying..." : "Apply for resrvation"}
        </button>
      </form>
    </div>
  );
};

export default ReservationForm;
