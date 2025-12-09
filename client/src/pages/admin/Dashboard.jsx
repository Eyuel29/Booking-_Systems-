import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UserIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import Title from './Title';
import BlurCircle from '../../components/BlurCircle';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { dateFormat } from '../../lib/dateFormat';

const Dashboard = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURENCY;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalUser: 0,
    activeShows: [],
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setDashboardData(data.dashboardData || data.DashboardData || {});
      } else {
        toast.error(data.message || "Failed to load dashboard data");
      }
    } catch (error) {
      toast.error("Error fetching dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const dashboardCards = [
    { title: 'Total Bookings', value: dashboardData.totalBookings || 0, icon: ChartLineIcon },
    { title: 'Total Revenue', value: `${currency} ${dashboardData.totalRevenue || 0}`, icon: CircleDollarSignIcon },
    { title: 'Active Shows', value: dashboardData.activeShows?.length || 0, icon: PlayCircleIcon },
    { title: 'Total Users', value: dashboardData.totalUser || 0, icon: UserIcon }
  ];

  if (loading) return <Loading />;

  return (
    <>
      <Title text1="Admin" text2="Century Cinema" />

      {/* Dashboard Cards */}
      <div className="relative flex flex-wrap gap-6 mt-6">
        <BlurCircle top="-100px" left="0" />
        {dashboardCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between w-full sm:w-60 px-5 py-4 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <h1 className="text-sm text-gray-300">{card.title}</h1>
                <p className="text-2xl font-bold mt-1 text-white">{card.value}</p>
              </div>
              <Icon className="w-8 h-8 text-primary/80" />
            </div>
          );
        })}
      </div>

      {/* Active Shows */}
      <p className="mt-10 text-lg font-medium text-white">Active Shows</p>

      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />
        {dashboardData.activeShows?.length > 0 ? (
          dashboardData.activeShows.map((show) => {
            const movie = show.movie || {};

            // Compute poster src with proper fallback
            const posterSrc =
              (typeof movie.poster_path === "string" && movie.poster_path) ||
              (movie.poster_path?.url) ||
              (movie.poster_path?.secure_url) ||
              "/images/default-poster.jpg"; // fallback if nothing

            return (
              <div
                key={show._id}
                className="w-56 rounded-xl overflow-hidden bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/30 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Poster */}
                <div className="relative">
                  <img
                    src={posterSrc.startsWith("http") ? posterSrc : image_base_url + posterSrc}
                    alt={movie.title || "Movie Poster"}
                    className="h-64 w-full object-cover rounded-t-xl"
                  />
                  <div className="absolute top-2 left-2 bg-primary/70 px-2 py-1 rounded text-xs font-semibold text-white">
                    {show.type || "Standard"}
                  </div>
                </div>

                {/* Movie title */}
                <p className="font-bold text-lg p-2 truncate text-white">{movie.title || "Untitled"}</p>

                {/* Details */}
                <div className="px-3 pb-3 text-sm text-gray-300 space-y-1">
                  <p>
                    <span className="font-medium text-gray-200">Hall:</span> {show?.hall ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-200">Regular Price:</span> {currency} {show.showPrice?.regular || 0}
                  </p>
                  <p>
                    <span className="font-medium text-gray-200">VIP Price:</span> {currency} {show.showPrice?.vip || 0}
                  </p>
                </div>

                {/* Rating & Date */}
                <div className="items-center justify-between px-3 pb-3">
                  <p className="flex items-center gap-1 text-sm text-yellow-400 mt-1">
                    <StarIcon className="w-4 h-4 fill-yellow-500" />
                    {movie.vote_average?.toFixed(1) || "0.0"}
                  </p>
                  <p className="text-xs ml-6 text-gray-400">
                    {show.showDateTime ? dateFormat(show.showDateTime) : ""}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400">No active shows available</p>
        )}
      </div>
    </>
  );
};

export default Dashboard;
