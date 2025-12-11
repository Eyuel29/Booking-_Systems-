import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import ManualMovie from "../models/ManualMovie.js";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

// config
const EMAIL_BATCH_SIZE = parseInt(process.env.EMAIL_BATCH_SIZE || "100", 10);

// simulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// absolute path to local logo (adjust relative path if needed)
const logoPath = path.resolve(__dirname, "../assets/logo.png");

// Helper: ensure poster is absolute URL
const makeAbsolutePoster = (poster) => {
  if (!poster) return null;
  if (typeof poster === "object" && poster.url) return poster.url;
  if (typeof poster === "string" && (poster.startsWith("http://") || poster.startsWith("https://"))) return poster;
  const base = process.env.IMAGE_BASE_URL || "https://image.tmdb.org/t/p/original";
  const rel = String(poster).replace(/^\/+/, "");
  return `${base.replace(/\/+$/, "")}/${rel}`;
};

/**
 * htmlBody(title, poster, overview, showsHtml, movieId, logoSrc)
 * - logoSrc: either "cid:centurycinema-logo" (if attachment) or a public URL (fallback) or empty string.
 */
const htmlBody = (title, poster, overview, showsHtml, movieId, logoSrc) => {
  const client = process.env.CLIENT_URL || "http://localhost:5173";
  const bookLink = `${client.replace(/\/$/, "")}/movie/${movieId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Century Cinema - ${title} - Now Showing</title>
  <style>
  a.book-btn:hover {
    background-color: #eab308 !important;
    color: #000000 !important;
  }
</style>
</head>
<body style="margin:0; padding:0; background: linear-gradient(to bottom, #111827, #030712); font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <!-- MAIN CONTAINER -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#000; padding:20px 0;">
    <tr><td align="center">

      <!-- CARD -->
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#141414; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(255,60,120,0.15); border:1px solid #333;">

        <!-- HEADER / LOGO -->
        <tr>
          <td style="padding:25px 30px; border-bottom:1px solid #222; text-align:center;">
            ${logoSrc ? `<img src="${logoSrc}" width="50" style="margin-bottom:10px; opacity:0.9; display:block; margin-left:auto; margin-right:auto;" />` : ""}
            <span style="color:#fff; font-size:18px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
              Century <span style="color:#eab308;">Cinema</span>
            </span>
          </td>
        </tr>

        <!-- POSTER -->
        ${poster ? `<tr><td style="width:100%; background-color:#000;">
          <a href="${bookLink}" style="text-decoration:none; display:block;">
            <img src="${poster}" alt="${title}" style="width:100%; max-width:600px; height:auto; display:block; border:0;">
          </a>
        </td></tr>` : ""}

        <!-- CONTENT -->
        <tr>
          <td style="padding:30px;">

            <h1 style="margin:0 0 15px 0; color:#ffffff; font-size:24px; font-weight:700; line-height:1.2;">
              ${title}
            </h1>

            <p style="margin:0 0 25px 0; color:#aaaaaa; font-size:15px; line-height:1.6;">
              ${overview || "Join us for an unforgettable movie experience."}
            </p>

            <div style="border-top:1px solid #333; margin:20px 0;"></div>
            <h3 style="margin:0 0 15px 0; color:#eab308; font-size:16px; text-transform:uppercase; letter-spacing:1px;">
              Available Showtimes
            </h3>

            <div style="overflow-x:auto;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#2a2a2a;">
                    <th style="padding:10px; text-align:left; color:#888; font-size:11px; text-transform:uppercase; font-weight:600;">Date</th>
                    <th style="padding:10px; text-align:left; color:#888; font-size:11px; text-transform:uppercase; font-weight:600;">Time</th>
                    <th style="padding:10px; text-align:left; color:#888; font-size:11px; text-transform:uppercase; font-weight:600;">Hall</th>
                    <th style="padding:10px; text-align:left; color:#888; font-size:11px; text-transform:uppercase; font-weight:600;">Type</th>
                    <th style="padding:10px; text-align:right; color:#888; font-size:11px; text-transform:uppercase; font-weight:600;">Reg</th>
                    <th style="padding:10px; text-align:right; color:#888; font-size:11px; text-transform:uppercase; font-weight:600;">VIP</th>
                  </tr>
                </thead>
                <tbody>
                  ${showsHtml || "<tr><td colspan='6' style='padding:20px; text-align:center; color:#666;'>No shows currently listed.</td></tr>"}
                </tbody>
              </table>
            </div>

            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-top:30px;">
              <tr>
                <td align="center">
                      
              <a href="${bookLink}" target="_blank"
                 class="book-btn"
                 style="
                   display:inline-block;
                   padding:16px 36px;
                   background-color:#014d4e;
                   color:#ffffff;
                   text-decoration:none;
                   border-radius:50px;
                   font-weight:bold;
                   font-size:16px;
                   text-transform:uppercase;
                   box-shadow:0 4px 15px rgba(255,60,120,0.4);
                   transition: all 0.3s ease;
                 ">
                 🎟 Book Your Seats
              </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <tr>
          <td style="background-color:#111; padding:20px; text-align:center; border-top:1px solid #222;">
            <p style="margin:0; color:#555; font-size:12px;">
              Century Cinema • Addis Ababa, Ethiopia
            </p>
            <p style="margin:8px 0 0 0; color:#444; font-size:11px;">
              You are receiving this email because you subscribed to our movie updates.
            </p>
          </td>
        </tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
};

/**
 * Send "Now Showing" email to all users in batches.
 * Accepts movieTitle, posterPath, movieId, movieOverview, shows (array with showDateTime Date/ISO, hall, type, regular, vip).
 */
const sendNowShowingEmailToAllUsers = async (movieTitle, posterPath, movieId, movieOverview, shows) => {
  try {
    const users = await User.find({ email: { $exists: true, $ne: "" } }, "email");
    const emails = users.map((u) => u.email).filter(Boolean);
    if (emails.length === 0) {
      console.log("No user emails found — skipping notification.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // batching
    const chunk = (arr, size) => {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };
    const batches = chunk(emails, EMAIL_BATCH_SIZE);

    // absolute poster
    const absolutePoster = makeAbsolutePoster(posterPath);

    // build formatted rows using Addis Ababa timezone
    const showsRows = (shows || [])
      .map((s, index) => {
        const dt = new Date(s.showDateTime);
        const dateStr = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit", timeZone: "Africa/Addis_Ababa" }).format(dt);
        const timeStr = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Addis_Ababa" }).format(dt);
        const bg = index % 2 === 0 ? "#252525" : "#1f1f1f";
        return `
          <tr style="background-color: ${bg};">
            <td style="padding:12px 10px; border-bottom:1px solid #333; font-size:13px; color:#eee; white-space:nowrap;">${dateStr}</td>
            <td style="padding:12px 10px; border-bottom:1px solid #333; font-size:13px; color:#eab308; font-weight:bold;">${timeStr}</td>
            <td style="padding:12px 10px; border-bottom:1px solid #333; font-size:13px; color:#ccc;">${s.hall}</td>
            <td style="padding:12px 10px; border-bottom:1px solid #333; font-size:13px; color:#ccc;">${s.type}</td>
            <td style="padding:12px 10px; border-bottom:1px solid #333; font-size:13px; color:#fff; text-align:right;">${s.regular != null ? s.regular + " ETB" : "-"}</td>
            <td style="padding:12px 10px; border-bottom:1px solid #333; font-size:13px; color:#ffd700; text-align:right;">${s.vip != null ? s.vip + " ETB" : "-"}</td>
          </tr>
        `;
      })
      .join("");

    // check logo existence
    const logoExists = fs.existsSync(logoPath);
    const logoCid = "centurycinema-logo";
    const logoUrlFallback = process.env.LOGO_URL || "";
    const logoSrc = logoExists ? `cid:${logoCid}` : (logoUrlFallback || "");

    // build final HTML
    const finalHtml = htmlBody(movieTitle, absolutePoster, movieOverview, showsRows, movieId, logoSrc);

    // prepare attachments only if logo exists
    const attachments = [];
    if (logoExists) {
      attachments.push({
        filename: path.basename(logoPath),
        path: logoPath,
        cid: logoCid,
      });
    }

    // debug logs (optional)
    console.log("sendNowShowingEmailToAllUsers: emails:", emails.length, "batches:", batches.length, "logoExists:", logoExists, "logoSrc:", logoSrc);

    for (const [index, batch] of batches.entries()) {
      const mailOptions = {
        from: `"Century Cinema" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        bcc: batch,
        subject: `Now Showing: ${movieTitle}`,
        html: finalHtml,
        attachments: attachments.length ? attachments : undefined,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Now Showing email batch ${index + 1}/${batches.length} sent (${batch.length} recipients).`);
      } catch (err) {
        console.error(`Failed to send email batch ${index + 1}:`, err);
      }
    }
  } catch (err) {
    console.error("sendNowShowingEmailToAllUsers error:", err);
  }
};

// --- Get Now Playing from TMDB ---
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
      headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
    });
    res.json({ success: true, movies: data.results });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// --- Add Show ---
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, price, type } = req.body;
    if (!movieId || !showsInput || !price) return res.status(400).json({ success: false, message: "Missing required fields" });

    const movieIdStr = String(movieId).trim();
    let movieCreated = false;
    let movie = await Movie.findById(movieIdStr);

    const isObjectId = mongoose.Types.ObjectId.isValid(movieIdStr);
    if (!movie && isObjectId) {
      const manual = await ManualMovie.findById(movieIdStr);
      if (manual) {
        const movieFromManual = {
          _id: manual._id.toString(),
          title: manual.title || "",
          overview: manual.overview || "",
          poster_path: manual.backdrop_path?.url || "",
          backdrop_path: manual.backdrop_path?.url || "",
          genres:
            typeof manual.genres === "string"
              ? manual.genres.split(",").map((g) => ({ name: g.trim() }))
              : Array.isArray(manual.genres)
              ? manual.genres.map((g) => (typeof g === "string" ? { name: g } : g))
              : [],
          casts: (manual.casts || []).map((c) => ({
            name: c.name || "",
            profile_path: c.castsImage?.url || c.profile_path || "",
            character: c.character || "",
          })),
          runtime: manual.runtime || 0,
          release_date: manual.release_date || "",
          language: manual.original_language || manual.language || "en",
          tagline: manual.tagline || "",
          vote_average: manual.vote_average || 0,
          trailer: manual.trailer || null,
        };
        movie = await Movie.create(movieFromManual);
        movieCreated = true;
      }
    }

    if (!movie) {
      const [detailsRes, creditsRes, videosRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieIdStr}`, { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }, timeout: 10000 }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieIdStr}/credits`, { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }, timeout: 10000 }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieIdStr}/videos`, { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }, timeout: 10000 }),
      ]);

      const trailerObj =
        (videosRes.data.results || []).find((v) => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
        (videosRes.data.results || []).find((v) => v.type === "Trailer" && v.site === "YouTube") ||
        (videosRes.data.results || []).find((v) => v.site === "YouTube");

      const movieDetails = {
        _id: movieIdStr,
        title: detailsRes.data.title || "",
        overview: detailsRes.data.overview || "",
        poster_path: detailsRes.data.poster_path || "",
        backdrop_path: detailsRes.data.backdrop_path || "",
        genres: detailsRes.data.genres || [],
        casts: creditsRes.data?.cast || [],
        runtime: detailsRes.data.runtime || 0,
        release_date: detailsRes.data.release_date || "",
        language: detailsRes.data.original_language || "en",
        tagline: detailsRes.data.tagline || "",
        vote_average: detailsRes.data.vote_average || 0,
        trailer: trailerObj ? `https://www.youtube.com/watch?v=${trailerObj.key}` : null,
      };

      movie = await Movie.create(movieDetails);
      movieCreated = true;
    }

    // Build shows
    const showsToCreate = [];
    showsInput.forEach((s) => {
      const { hall, date, times } = s;
      if (!hall || !date || !Array.isArray(times)) return;
      times.forEach((time) => {
        const showDateTime = new Date(`${date}T${time}`);
        if (isNaN(showDateTime.getTime())) return;
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

    if (!showsToCreate.length) return res.status(400).json({ success: false, message: "No valid shows to add." });

    const insertedShows = await Show.insertMany(showsToCreate);

    // Send email if new movie created
    if (movieCreated) {
      const posterPath = makeAbsolutePoster(movie.backdrop_path || movie.poster_path);
      const showsForEmail = insertedShows.map((s) => ({
        showDateTime: s.showDateTime,
        hall: s.hall,
        type: s.type || "2D",
        regular: s.showPrice?.regular ?? null,
        vip: s.showPrice?.vip ?? null,
      }));

      await sendNowShowingEmailToAllUsers(movie.title, posterPath, movie._id.toString(), movie.overview || "", showsForEmail);
    }

    return res.json({ success: true, message: "Shows added successfully." });
  } catch (error) {
    console.error("addShow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Get all shows ---
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate("movie").sort({ showDateTime: 1 });
    const uniqueShows = Array.from(new Set(shows.map((show) => show.movie._id.toString()))).map((id) => shows.find((s) => s.movie._id.toString() === id).movie);
    res.json({ success: true, shows: uniqueShows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// --- Get single movie detail + shows ---
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } });
    const movie = await Movie.findById(movieId);

    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) dateTime[date] = [];
      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id,
        hall: show.hall,
        type: show.type,
        showPrice: show.showPrice,
      });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
