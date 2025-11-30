import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from '../models/User.js'





// API to check if user is admin
export const isAdmin = async (req, res) => {
  
  res.json({ success: true, isAdmin: true });
};


// API to get dashboard data


export const getDashboardData = async (req, res) =>{
    
    try{
        const bookings = await Booking.find({ispaid: true});
        const activeShows = await Show.find({showDateTime:{$gte: new Date()}}).populate('movie');

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUser

        }

        res.json({success: true, dashboardData})

    }catch(error){
        console.error(error);
        res.json({success: false, message: error.message});


    }
}


//API To get all shows

export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // Calculate occupied seats and earnings for each show
    const showsWithStats = await Promise.all(
      shows.map(async (show) => {
        const bookings = await Booking.find({ show: show._id });

        const occupiedSeats = { regular: [], vip: [] };
        bookings.forEach((b) => {
          const category = b.category?.toLowerCase();
          if (category === "regular") occupiedSeats.regular.push(...b.bookedSeats);
          if (category === "vip") occupiedSeats.vip.push(...b.bookedSeats);
        });

        const regularEarnings = (show.showPrice?.regular || 0) * occupiedSeats.regular.length;
        const vipEarnings = (show.showPrice?.vip || 0) * occupiedSeats.vip.length;

        return {
          ...show.toObject(),
          occupiedSeats,
          earnings: {
            regular: regularEarnings,
            vip: vipEarnings,
            total: regularEarnings + vipEarnings,
          },
        };
      })
    );

    res.json({ success: true, shows: showsWithStats });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};



//API To get all bookings

export const getAllBookings = async (req, res) => {
  try {
    const { email } = req.query; // get ?email=... from query params

    // Base query
    const query = {};

    // If email is provided, filter by user email (case-insensitive)
    if (email) {
      const users = await User.find({
        email: { $regex: email, $options: "i" }
      }).select("_id");

      // Filter bookings by user IDs
      query.user = { $in: users.map(u => u._id) };
    }

    // Fetch bookings
    const bookings = await Booking.find(query)
      .populate("user")
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.json({ success: false, message: error.message });
  }
};
