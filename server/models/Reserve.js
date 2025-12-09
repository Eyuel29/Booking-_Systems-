import mongoose from "mongoose";

const reserveSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      enum: [
     
        
        "Ato",  
        "W/ro",  
        "W/rt",
        "Dr", 
      ],
      required: [true, "Title is required"],
    },
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
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
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
    Talk: {
  type: String,
  enum: ["Email", "Phone"],
  required: [true, "Please choose a contact method"],
},



    peopleAttend: {
      type: Number,
      required: [true, "Attend number is required"],
      min: [1, "At least 20 person must attend"],
    },

    message: {
      type: String,
    },

    ReservedDate: {
      type: Date,
      required: [true, "Reservation date is required"],
    },

    eventStartTime: {
      type: String,
      required: [true, "Event start time is required"],
      validate: {
        validator: function (v) {
          return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v); // Matches HH:mm format
        },
        message: "Start time must be in HH:mm format (24-hour)",
      },
    },

    eventEndTime: {
      type: String,
      required: [true, "Event end time is required"],
      validate: {
        validator: function (v) {
          return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: "End time must be in HH:mm format (24-hour)",
      },
    },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Reserve", reserveSchema);
