import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // ------ REFERENCES ------
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    // ------ FIELDS FROM JSON ------
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },

    currency: { type: String, default: "ETB" },
    amount: { type: Number, required: true },
    charge: { type: Number },

    mode: { type: String }, // test | live
    method: { type: String }, // test | card | wallet | ...
    type: { type: String }, // API

    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending",
    },

    reference: { type: String }, // ex: "6jnheVKQEmy"
    tx_ref: { type: String }, // ex: "chewatatest-6669"

    customization: {
      title: { type: String },
      description: { type: String },
      logo: { type: String, default: null },
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    created_at: { type: Date },
    updated_at: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
