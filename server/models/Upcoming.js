import mongoose from "mongoose";

const upcomingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    backdrop_path: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    description : {
        type: String,
        required: true
    },
    release_date: { type: String, required: true },
    come_date: { type: String, required: true },
    language: { type: String },
    genres: { type: [String], required: true },
    casts: [
      {
        name: { type: String, required: true },
        castsImage: { // 👈 changed here
          public_id: { type: String, required: true },
          url: { type: String, required: true },
        },
      },
    ],
    runtime: { type: Number, required: true },
    trailer: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Upcoming", upcomingSchema);
