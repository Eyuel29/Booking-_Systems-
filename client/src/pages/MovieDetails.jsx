import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StarIcon } from "@heroicons/react/24/solid";
import TimeFormat from "../lib/TimeForamt";
import { Heart, PlayCircleIcon, X } from "lucide-react";
import DateSelect from "../components/DateSelect";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavorites,
    favoriteMovies,
    image_base_url,
  } = useAppContext();

  // trailer UI
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerEmbedUrl, setTrailerEmbedUrl] = useState(null); // always an embed url

  const getPosterSrc = (poster) =>
    (typeof poster === "string" && poster) ||
    poster?.url ||
    poster?.secure_url ||
    "/images/default-poster.jpg";

  const getCastSrc = (path) =>
    (typeof path === "string" && path) || path?.url || path?.secure_url || "/images/default-cast.jpg";

  // Fetch show + movie details
  const getShow = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success && data.movie) {
        setShow(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("getShow error:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Favorites
  const handleFavorite = async () => {
    if (!user) return toast.error("Please login to proceed");

    try {
      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data.success) {
        await fetchFavorites();
        toast.success(data.message);
      } else {
        toast.error("Failed to update favorites");
      }
    } catch (err) {
      console.error("favorite error:", err);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Escape handler and cleanup for trailer full/near-full overlay
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && trailerOpen) closeTrailer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trailerOpen]);

  // parse YouTube id from multiple URL formats
  const parseYouTubeId = (url = "") => {
    if (!url) return null;
    // matches watch?v=, youtu.be/, embed/, v/
    const re =
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/;
    const m = url.match(re);
    return m ? m[1] : null;
  };

  const openTrailer = (embedUrl) => {
    setTrailerEmbedUrl(embedUrl);
    setTrailerOpen(true);
  };

  const closeTrailer = () => {
    setTrailerOpen(false);
    setTrailerEmbedUrl(null);
  };

  const handlePlayTrailer = () => {
    const movie = show?.movie;
    if (!movie) return toast.error("Movie not loaded yet.");
    const trailer = movie.trailer; // admin-provided YouTube URL (string)

    if (!trailer) {
      return toast.error("Trailer not available for this movie.");
    }

    const youtubeId = parseYouTubeId(trailer);
    if (!youtubeId) {
      return toast.error("Invalid YouTube trailer URL.");
    }

    // build embed url with autoplay
    openTrailer(`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center text-gray-300 mt-20 text-lg">
        <Loading />
      </div>
    );
  }

  // Not found
  if (notFound || !show) {
    return (
      <div className="flex flex-col items-center justify-center mt-40 mb-40 text-center px-10 py-12 bg-transparent rounded-2xl shadow-lg max-w-md mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-amber-800/90 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        </svg>
        <h2 className="text-2xl font-bold text-white mb-2">Sorry!</h2>
        <p className="text-gray-300 text-lg">Movie not found. Please check the link or try again later.</p>
      </div>
    );
  }

  const movie = show.movie;
  const posterSrc = getPosterSrc(movie.poster_path);
  const isFavorite = !!favoriteMovies?.find((fav) => fav._id === id);

  return (
    <div className="relative w-full overflow-y-hidden px-4 max-lg:px-6 pt-10 max-lg:pt-20 overflow-x-hidden bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Movie details content */}
      <div className="flex flex-col mt-5 lg:mt-25 max-lg:flex-col lg:flex-row gap-6 max-w-6xl mx-auto w-full">
        {/* Poster */}
        <img
          src={posterSrc.startsWith("http") ? posterSrc : image_base_url + posterSrc}
          alt={movie.title}
          className="mx-auto max-lg:mt-10 rounded-xl w-full max-w-[320px] h-auto object-cover"
        />

        {/* Details */}
        <div className="relative lg:mt-10 flex flex-col gap-3 flex-1 min-w-0 overflow-hidden">
          <div className="relative mt-4 z-20">
            <div className="flex justify-between items-center">
              <p className="text-primary-dull/78 uppercase underline">{movie.language?.toUpperCase()}</p>
              <p className="text-primary-dull bg-primary uppercase border py-1 px-5 border-amber-50/50 rounded">{movie.type || "2D"}</p>
            </div>

            <h1 className="text-4xl font-semibold max-w-96 text-balance mt-2">{movie.title}</h1>

            <div className="flex items-center gap-2 text-gray-300 mt-1">
              <StarIcon className="w-5 h-5 text-primary fill-primary-dull" />
              {movie.vote_average?.toFixed(1) || "N/A"} User Rating
            </div>

            <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl italic">{movie.overview}</p>

            <p className="text-gray-300 text-sm mt-2">
              {TimeFormat(movie.runtime)} · {movie.genres?.map((g) => g.name).join(", ") || "No genres"} · {movie.release_date?.split("-")[0]}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <button onClick={handlePlayTrailer} className="flex items-center justify-center w-full sm:w-auto gap-2 px-7 py-3 text-sm bg-gray-900 rounded-md font-medium active:scale-95" aria-label="Watch trailer">
                <PlayCircleIcon className="w-5 h-5" />
                Watch Trailer
              </button>

              <a href="#dateSelect" className="w-full sm:w-auto px-10 py-3 text-sm bg-primary-dull/85 text-black/95 hover:bg-primary hover:text-amber-50 rounded-md font-medium text-center">
                Buy Tickets
              </a>

              <button onClick={handleFavorite} className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95" aria-label="Toggle favorite">
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-400" : "text-gray-400"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cast List */}
      {movie.casts && movie.casts.length > 0 && (
        <div className="relative mt-18 w-full overflow-x-auto no-scrollbar">
          <div className="flex gap-6 px-6 justify-start items-center xl:flex-wrap xl:justify-center">
            {movie.casts.slice(0, 10).map((cast, index) => {
              const imgSrc = getCastSrc(cast.profile_path);
              return (
                <div key={index} className="flex flex-col items-center text-center flex-shrink-0">
                  <img src={imgSrc.startsWith("http") ? imgSrc : image_base_url + imgSrc} alt={cast.name || "Actor"} className="rounded-full h-28 w-28 object-cover border-2 border-primary-dull shadow-lg shadow-black/40" />
                  <p className="font-medium text-xs mt-3">{cast.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Selection */}
      <div id="dateSelect" className="mt-5 lg:px-15 py-5 xl:px-75">
        <DateSelect dateTime={show.dateTime} id={id} />
      </div>

      {/* Responsive approximate full-screen trailer player */}
      {trailerOpen && trailerEmbedUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeTrailer} // click backdrop to close
        >
          <div
            className="relative w-full h-full sm:w-[92%] sm:h-[92%] max-w-[1400px] bg-neutral-900 rounded-none sm:rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside player
          >
            {/* Close button top-right */}
            <button
              onClick={closeTrailer}
              className="absolute top-3 right-3 z-40 rounded-full bg-black/40 hover:bg-black/60 p-2"
              aria-label="Close trailer"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Iframe fills container and remains responsive */}
            <div className="w-full h-full">
              <iframe
                title="Trailer"
                src={trailerEmbedUrl}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
