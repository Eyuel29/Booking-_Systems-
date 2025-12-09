import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";



export const getUserBookings = async (req, res) => {
    try{
        const user = req.auth().userId;
        const bookings = await Booking.find({user}).populate({
            path: 'show',
            populate: {path: 'movie'}

        }).sort({ createdAt: -1})
        res.json({success: true, bookings});
    }catch(error){
        console.error(error);
        res.json({success: false, message: error.message});


    }
}



// api to get function to update favorite movie

export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId; // Make sure req.auth() is correct

    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata.favorites) {
      user.privateMetadata.favorites = [];
    }

    if (!user.privateMetadata.favorites.includes(movieId)) {
      user.privateMetadata.favorites.push(movieId);
    } else {
      user.privateMetadata.favorites = user.privateMetadata.favorites.filter(
        (item) => item !== movieId
      );
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: user.privateMetadata,
    });

    res.json({ success: true, message: "Favorite movies updated successfully." });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};




export const getFavorites = async (req, res) => {
  try {
   const { userId } = req.auth();// ✅ Correct way to access auth info
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: userId missing" });
    }

    const user = await clerkClient.users.getUser(userId);
    const favorites = user?.privateMetadata?.favorites || [];

    const movies = await Movie.find({ _id: { $in: favorites } });

    res.json({ success: true, movies });
  } catch (error) {
    console.error("Error in getFavorites:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch favorites",
    });
  }
};


