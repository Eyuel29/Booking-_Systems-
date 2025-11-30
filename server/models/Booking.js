import mongoose from "mongoose";

 const bookingSchema = new mongoose.Schema({

    user: {
        type: String, required: true, ref: 'User'
    },
    show: {
        type: String, required: true, ref: 'Show'
    },
    email: {
        type: String, required: true, ref: 'User'

    },
    amount: {
        type: Number, required: true
    },    
    bookedSeats: {
        type: Array, required: true
    },
    hall:{
         type: String, required: true,

    },
    category: {
      type: String,
      enum: ["regular", "vip"],
      required: true,
    },
    type:{
         type: String, required: true,

    },

    snacks:{
        type: Array, required: true

    },
    isPaid: {
        type: Boolean,  default:false
    },
    paymentLink: {
        type: String
    },

 },{timestamps: true})


 const Booking = mongoose.model("Booking", bookingSchema);

 export default Booking;