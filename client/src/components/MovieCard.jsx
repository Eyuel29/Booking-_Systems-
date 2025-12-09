import { StarIcon } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TimeForamt from '../lib/TimeForamt';
import { useAppContext } from '../context/AppContext';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { image_base_url } = useAppContext();

  // Compute poster with fallback
  const posterSrc =
    (typeof movie.poster_path === "string" && movie.poster_path) ||
    (movie.poster_path?.url) ||
    (movie.poster_path?.secure_url) ||
    '/images/default-poster.jpg';

  return (
    <div className="group flex flex-col justify-between bg-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-yellow-500/20 hover:-translate-y-1 transition-transform duration-300 w-64">
      {/* Image Section */}
      <div className="relative w-full h-80 overflow-hidden">
        <img
          onClick={() => {
            navigate(`/movie/${movie._id}`);
            window.scrollTo(0, 0);
          }}
          src={posterSrc.startsWith("http") ? posterSrc : image_base_url + posterSrc}
          alt={movie.title || 'Movie Poster'}
          className="w-full h-full object-cover object-center rounded-t-2xl transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
        />

        {/* Soft yellow ring glow */}
        <div className="absolute inset-0 ring-1 ring-yellow-500/30 group-hover:ring-yellow-400/60 rounded-t-2xl transition duration-300"></div>
      </div>

      {/* Movie Info */}
      <div className="p-4 flex flex-col flex-grow">
        <p className="font-semibold text-lg text-white truncate">{movie.title}</p>
        <p className="text-sm text-gray-400 mt-1">
          {new Date(movie.release_date).getFullYear()} •{' '}
          {movie.genres?.slice(0, 2).map((genre) => genre.name).join(' | ')} •{' '}
          {TimeForamt(movie.runtime)}
        </p>

        {/* Bottom section */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => {
              navigate(`/movie/${movie._id}`);
              window.scrollTo(0, 0);
            }}
            className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-full hover:bg-primary hover:text-amber-50 transition duration-300"
          >
            Buy Ticket
          </button>

          <div className="flex items-center gap-1 text-sm text-gray-300">
            <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {movie.vote_average?.toFixed(1) || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
