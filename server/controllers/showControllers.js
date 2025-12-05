import mongoose from "mongoose";
import axios from "axios"
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import ManualMovie from "../models/ManualMovie.js";


export const getNowPlayingMovies = async (req, res)=>{
    try{
       const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
            headers: {
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`

            }
        })
        const movies = data.results;
        res.json({success: true, movies: movies})
        
    }catch(error){
        console.error(error);
        res.json({success: false, message: error.message})

    }
    
}



export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, price, type } = req.body;

    if (!movieId || !showsInput || !price) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Always treat movieId as a string internally
    const movieIdStr = String(movieId).trim();

    // Try to find in Movies collection first (Movies._id may be string for TMDB ids)
    let movie = await Movie.findById(movieIdStr);

    // Only attempt ManualMovie lookup if movieId is a valid MongoDB ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(movieIdStr);
    if (!movie && isObjectId) {
      const manual = await ManualMovie.findById(movieIdStr);
      if (manual) {
        // Map manual movie structure into the Movie schema shape
        const movieFromManual = {
          _id: manual._id.toString(), // store as string to stay consistent with Movies._id type
          title: manual.title || "",
          overview: manual.overview || "",
          poster_path: manual.backdrop_path?.url || "",
          backdrop_path: manual.backdrop_path?.url || "",
          genres: (manual.genres || []).map(g => (typeof g === "string" ? { name: g } : g)),
          casts: (manual.casts || []).map(c => ({
            name: c.name || "",
            profile_path: c.castsImage?.url || c.profile_path || "",
            character: c.character || "",
          })),
          runtime: manual.runtime || 0,
          release_date: manual.release_date || "",
          language: manual.original_language || manual.language || "en",
          tagline: manual.tagline || "",
          vote_average: manual.vote_average || 0,
        };

        movie = await Movie.create(movieFromManual);
      }
    }

    // If still not found, fallback to TMDB fetch (handles numeric TMDB ids)
    if (!movie) {
      // TMDB fetch - wrap in try to provide clearer errors
      let movieApiData;
      let movieCreditsData;
      try {
        const [detailsRes, creditsRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${movieIdStr}`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${movieIdStr}/credits`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          }),
        ]);
        movieApiData = detailsRes.data;
        movieCreditsData = creditsRes.data;
      } catch (tmdbErr) {
        console.error("TMDB fetch error:", tmdbErr.response?.data || tmdbErr.message);
        return res.status(502).json({
          success: false,
          message: "Failed to fetch movie from TMDB",
          error: tmdbErr.response?.data || tmdbErr.message,
        });
      }

      const movieDetails = {
        _id: movieIdStr, // store TMDB id as string
        title: movieApiData.title || "",
        overview: movieApiData.overview || "",
        poster_path: movieApiData.poster_path || "",
        backdrop_path: movieApiData.backdrop_path || "",
        genres: movieApiData.genres || [],
        casts: movieCreditsData?.cast || [],
        runtime: movieApiData.runtime || 0,
        release_date: movieApiData.release_date || "",
        language: movieApiData.original_language || "en",
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average || 0,
      };

      movie = await Movie.create(movieDetails);
    }

    // Build show documents
    const showsToCreate = [];

    showsInput.forEach((s) => {
      const { hall, date, times } = s;
      if (!hall || !date || !Array.isArray(times)) return;

      times.forEach((time) => {
        const showDateTime = new Date(`${date}T${time}`);
        if (isNaN(showDateTime.getTime())) return;

        // Validate price object fields
        const regular = Number(price?.regular ?? NaN);
        const vip = Number(price?.vip ?? NaN);
        if (Number.isNaN(regular) || Number.isNaN(vip)) return;

        showsToCreate.push({
          movie: movie._id.toString(),
          showDateTime,
          showPrice: { regular, vip },
          hall,
          type: type || "2D",
          occupiedSeats: { regular: [], vip: [] },
        });
      });
    });

    if (showsToCreate.length === 0) {
      return res.status(400).json({ success: false, message: "No valid shows to add." });
    }

    await Show.insertMany(showsToCreate);

    return res.json({ success: true, message: "Shows added successfully." });
  } catch (error) {
    console.error("addShow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};






// api to get all shows from the database


export const getShows = async (req, res) =>{
    try{
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({ showDateTime: 1});


        // filter unique shows 

        const uniqueShows = new Set(shows.map(show => show.movie))
        res.json({success: true, shows: Array.from(uniqueShows)})

    }catch(error){
        console.error(error);
        res.json({success: false, message: error.message})

    }
}

// api to get A single show from the database
export const getShow = async (req, res) =>{
    try{
        const {movieId} = req.params;
        const shows = await Show.find({movie: movieId, showDateTime: {$gte: new Date()}})

        const movie = await Movie.findById(movieId);

        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split('T')[0];
            if(!dateTime[date]){
                dateTime[date] = [];
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id, hall: show.hall, type: show.type, showPrice: show.showPrice});
        })
        res.json({success: true, movie, dateTime});
    }catch(error){
        console.error(error);
        res.json({success: false, message: error.message})
}
}

export const getAllShowsCombined = async (req, res) => {
  try {
    const [tmdbShows, manualShows] = await Promise.all([
      Show.find({ showDateTime: { $gte: new Date() } })
        .populate("movie")
        .sort({ showDateTime: 1 }),
      ManualShow.find({ showDateTime: { $gte: new Date() } })
        .populate("movie")
        .sort({ showDateTime: 1 }),
    ]);

    // Add a flag so frontend knows where each show came from
    const allShows = [
      ...tmdbShows.map((show) => ({ ...show._doc, isManual: false })),
      ...manualShows.map((show) => ({ ...show._doc, isManual: true })),
    ];

    res.json({ success: true, shows: allShows });
  } catch (error) {
    console.error("Get All Shows Combined Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};