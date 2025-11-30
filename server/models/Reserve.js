import mongoose from "mongoose";

const reserveSchema = new mongoose.Schema(
  {
    SenderName: {
      type: String,
      minLength: [2, "Name must contain at least 2 characters"],
      required: [true, "Sender name is required"],
      validate: {
        validator: function (v) {
          // Allow only letters, spaces, apostrophes, and hyphens
          return /^[A-Za-z\s'-]+$/.test(v);
        },
        message: "Name must contain only letters and spaces (no numbers or symbols)",
      },
    },

    email: {
      type: String,
      required: [true, "Email is required"],
    },

    phone: {
      type: Number,
      required: [true, "Phone number is required"],
    },

    events: {
      type: String,
      enum: [
        "Business Meetings",
        "Private Screening",
        "School Package",
        "Special Events",
        "Corporate Celebrations",
        "Movies",
      ],
      required: [true, "Event type is required"],
    },
    peopleAttend:{
       type: Number,
      required: [true, "Attend number is required"],

    },

    message: {
      type: String,
    },

    ReservedDate: {
      type: Date,
      required: [true, "Reservation date is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reserve", reserveSchema);
