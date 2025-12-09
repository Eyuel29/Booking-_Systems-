import cloudinary from "../configs/cloudinary.js";
import Upcoming from "../models/Upcoming.js";

// ✅ Add Upcoming Movie
// ✅ Robust addUpcoming controller — replace your existing function with this
export const addUpcoming = async (req, res, next) => {
  try {
    // read raw fields
    const { title, description, release_date, come_date ,language, runtime } = req.body;

    // === normalize genres ===
    const rawGenres =
      req.body.genres ?? req.body.genres_json ?? req.body["genres[]"] ?? req.body["genres"];

    let genres = [];
    if (Array.isArray(rawGenres)) {
      genres = rawGenres.map((g) => String(g).trim()).filter(Boolean);
    } else if (typeof rawGenres === "string" && rawGenres.length) {
      try {
        const parsed = JSON.parse(rawGenres);
        if (Array.isArray(parsed)) genres = parsed.map((g) => String(g).trim()).filter(Boolean);
        else genres = String(parsed).split(",").map((g) => g.trim()).filter(Boolean);
      } catch {
        // not JSON -> comma-separated or single value
        genres = String(rawGenres).split(",").map((g) => g.trim()).filter(Boolean);
      }
    }

    // quick validation (genres considered)
    if (!title || !description || !release_date || !come_date || !language || !runtime || genres.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required (including at least one genre)." });
    }

    // === Poster (backdrop) existence & validation ===
    if (!req.files || !req.files.backdrop_path) {
      return res.status(400).json({ success: false, message: "Poster (backdrop_path) is required." });
    }
    const backdrop_path = req.files.backdrop_path;

    if (!backdrop_path.mimetype || !backdrop_path.mimetype.startsWith("image/")) {
      return res.status(400).json({ success: false, message: "Uploaded poster must be an image." });
    }

    // === Prepare concurrent uploads ===
    // We'll upload poster (required), optional trailer, and casts images (if provided)
    const uploadPromises = [];
    const uploadMap = {}; // map role -> promise result index

    // poster first push
    uploadMap.posterIndex = uploadPromises.length;
    uploadPromises.push(cloudinary.uploader.upload(backdrop_path.tempFilePath, { folder: "POSTER" }));

    // trailer (optional)
    let trailerFile = null;
    if (req.files && req.files.trailer) {
      trailerFile = req.files.trailer;
      uploadMap.trailerIndex = uploadPromises.length;
      uploadPromises.push(cloudinary.uploader.upload(trailerFile.tempFilePath, { folder: "TRAILERS", resource_type: "video" }));
    }

    // casts uploads: collect file keys and indexes
    const castsList = [];
    if (req.body.casts) {
      try {
        const parsedCasts = typeof req.body.casts === "string" ? JSON.parse(req.body.casts) : req.body.casts;
        if (Array.isArray(parsedCasts)) castsList.push(...parsedCasts);
      } catch {
        // fallback: ignore malformed casts — keep empty
      }
    }

    // For each cast, if image exists push upload promise and track index
    const castUploadIndexes = []; // will store { idx, uploadIndex } for mapping result later
    castsList.forEach((cast, index) => {
      const key = `castsImage_${index}`;
      if (req.files && req.files[key]) {
        const fileObj = req.files[key];
        const uploadIndex = uploadPromises.length;
        uploadPromises.push(cloudinary.uploader.upload(fileObj.tempFilePath, { folder: "CASTS" }));
        castUploadIndexes.push({ idx: index, uploadIndex });
      }
    });

    // === Run all uploads in parallel ===
    let uploadResults = [];
    try {
      uploadResults = await Promise.all(uploadPromises);
    } catch (uploadErr) {
      console.error("Cloudinary upload error:", uploadErr);
      return res.status(500).json({ success: false, message: "One or more file uploads failed." });
    }

    // === Map upload results ===
    const posterUpload = uploadResults[uploadMap.posterIndex];
    if (!posterUpload || posterUpload.error) {
      console.error("Poster upload failed:", posterUpload);
      return res.status(500).json({ success: false, message: "Poster upload failed." });
    }

    let trailerData = null;
    if (typeof uploadMap.trailerIndex !== "undefined") {
      const trailerUpload = uploadResults[uploadMap.trailerIndex];
      if (trailerUpload && !trailerUpload.error) {
        trailerData = { public_id: trailerUpload.public_id, url: trailerUpload.secure_url };
      } else {
        // trailer failed -> log but continue (optional)
        console.warn("Trailer upload failed or missing result, continuing without trailer.");
      }
    }

    // Build casts array (with uploaded images where available)
    let castsArray = [];
    if (castsList.length > 0) {
      castsArray = await Promise.all(
        castsList.map(async (cast, index) => {
          const fileKey = `castsImage_${index}`;
          // find corresponding upload mapping for this index
          const found = castUploadIndexes.find((ci) => ci.idx === index);
          if (found) {
            const imgUp = uploadResults[found.uploadIndex];
            if (imgUp && !imgUp.error) {
              return { name: cast.name, castsImage: { public_id: imgUp.public_id, url: imgUp.secure_url } };
            }
          }
          // fallback: no image uploaded
          return { name: cast.name };
        })
      );
    }

    // === Create the DB document (genres is already an array) ===
    const upcoming = await Upcoming.create({
      title,
      description,
      release_date,
      come_date,
      language,
      genres, // stored as array
      runtime,
      backdrop_path: { public_id: posterUpload.public_id, url: posterUpload.secure_url },
      casts: castsArray,
      trailer: trailerData,
    });

    // return a friendly genres string for UI/Postman (no brackets)
    const genres_text = Array.isArray(genres) ? genres.join(", ") : String(genres);

    return res.status(201).json({
      success: true,
      message: "Upcoming movie added successfully",
      upcoming,
      genres_text, // <-- human-friendly string
    });
  } catch (err) {
    console.error("Add Upcoming error:", err);
    // send a helpful error message instead of a vague popup
    return res.status(500).json({ success: false, message: err.message || "Server error while adding upcoming movie" });
  }
};


// ✅ Get All Upcomings
export const getUpcomings = async (req, res, next) => {
  try {
    const upcoming = await Upcoming.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, upcoming });
  } catch (error) {
    console.error("Get all Upcoming Movies:", error);
    return next(error);
  }
};

// ✅ Delete Upcoming
export const deleteUpcoming = async (req, res, next) => {
  try {
    const upcomingIdParam = req.params.id; // fixed from res.params.id → req.params.id

    if (!upcomingIdParam)
      return res.json({
        success: false,
        message: "Unknown upcoming movie ID",
      });

    const upcoming = await Upcoming.findById(upcomingIdParam);
    if (!upcoming)
      return res.json({
        success: false,
        message: "Upcoming movie not found",
      });

    // ✅ Delete images from Cloudinary
    await cloudinary.uploader.destroy(upcoming.backdrop_path.public_id);

    if (upcoming.trailer?.public_id) {
      await cloudinary.uploader.destroy(upcoming.trailer.public_id, {
        resource_type: "video",
      });
    }

    for (const cast of upcoming.casts) {
      if (cast.castsImage?.public_id) {
        await cloudinary.uploader.destroy(cast.castsImage.public_id);
      }
    }

    await Upcoming.findByIdAndDelete(upcoming._id);
    return res.json({
      success: true,
      message: "Upcoming movie deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};


// ✅ Get single upcoming movie detail
export const getUpcomingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Movie ID is required" });
    }

    const upcoming = await Upcoming.findById(id);

    if (!upcoming) {
      return res.status(404).json({ success: false, message: "Upcoming movie not found" });
    }

    return res.status(200).json({ success: true, upcoming });
  } catch (error) {
    console.error("Get upcoming by ID error:", error);
    return next(error);
  }
};
