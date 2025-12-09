import express from "express";
import {
  addShow,
 
  getNowPlayingMovies,
  getShow,
  getShows,

} from "../controllers/showControllers.js";
import {
  addMovies,
  getManualMovies,
  getManualMovieById,
  

} from "../controllers/moviesController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

/* ------------------ TMDB MOVIES ------------------ */
showRouter.get("/now-playing", protectAdmin, getNowPlayingMovies);
showRouter.post("/add", protectAdmin, addShow);
showRouter.get("/all", getShows);
showRouter.get("/:movieId", getShow);

/* ------------------ MANUAL MOVIES ------------------ */
// Add new manual movie
showRouter.post("/manual/movie/add",  addMovies);





// Get shows for one manual movie


// Get all manual movies
showRouter.get("/manual/movies/all", getManualMovies);

// Get one manual movie
showRouter.get("/manual/movies/:id", getManualMovieById);


export default showRouter;
