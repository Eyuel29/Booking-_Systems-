import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import TimeForamt from "../lib/TimeForamt";
import { dateFormat } from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import { useUser } from "@clerk/clerk-react";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURENCY || "$";
  const { axios, getToken, user, image_base_url, initializePayment } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSnacks, setShowSnacks] = useState({}); // track snack visibility per booking
  const [paymentLoading, setPaymentLoading] = useState({}); // track payment loading per booking

  // Fetch bookings
  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/user/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const email = user?.primaryEmailAddress?.emailAddress || "N/A";

  useEffect(() => {
    if (user) getMyBookings();
  }, [user]);

  if (isLoading) return <Loading />;

  // Toggle snack display for a booking
  const toggleSnacks = (index) => {
    setShowSnacks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Handle payment initialization
  const handlePayNow = async (bookingId) => {
    if (!bookingId) {
      toast.error("Invalid booking ID");
      return;
    }

    setPaymentLoading((prev) => ({ ...prev, [bookingId]: true }));

    try {
      const response = await initializePayment(bookingId);

      if (response.success && response.data?.checkout_url) {
        // Redirect to Chapa checkout page
        window.location.href = response.data.checkout_url;
      } else {
        toast.error(response.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setPaymentLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  return (
    <div className="relative px-4 sm:px-8 md:px-16 lg:px-32 xl:px-40 pt-28 md:pt-36 min-h-[80vh] overflow-x-hidden overflow-y-auto">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-center font-bold mb-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white underline mt-10 bg-clip-text tracking-tight">
        My Bookings
      </h1>

      <div className="flex flex-col gap-6">
        {bookings.length === 0 ? (
          <p className="text-center text-gray-300">No bookings found.</p>
        ) : (
          bookings.map((item, index) => {
            const movie = item.show?.movie || {};

            // Robust poster logic
            const posterSrc =
              movie.poster_path && typeof movie.poster_path === "string"
                ? movie.poster_path.startsWith("http")
                  ? movie.poster_path
                  : image_base_url + movie.poster_path
                : movie.poster_path?.url ||
                  movie.poster_path?.secure_url ||
                  "/images/default-poster.jpg";

            // Calculate total payable (including snacks if shown)
            const snacksTotal = item.snacks?.reduce(
              (sum, s) => sum + s.price * s.quantity,
              0
            );
            const totalAmount =
              item.amount + (showSnacks[index] ? snacksTotal : 0);

            return (
              <div
                key={index}
                className="flex flex-col md:flex-row justify-between bg-primary/10 border border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 md:p-6 w-full max-w-4xl mx-auto"
              >
                {/* Left Section */}
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                  <img
                    src={posterSrc}
                    alt={movie.title || "Movie Poster"}
                    className="w-full sm:w-40 h-56 sm:h-auto object-cover rounded-lg border border-gray-700"
                  />
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-lg md:text-xl font-semibold">
                        {movie.title || "N/A"}
                      </p>
                      <p className="text-gray-400 text-sm md:text-base mt-1">
                        {TimeForamt(movie.runtime) || "N/A"}
                      </p>
                      <p className="text-gray-400 text-sm md:text-base mt-2">
                        {dateFormat(item.show?.showDateTime) || "N/A"}
                      </p>
                      <p className="text-gray-400 text-sm md:text-base mt-2">
                        <span className="text-gray-400">Type: </span>
                        {item.category || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex flex-col justify-between mt-4 md:mt-0 md:items-end md:text-right">
                  {/* Amount & Pay Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <p className="text-xl md:text-2xl font-semibold mb-2 sm:mb-0">
                      {currency}
                      {totalAmount || 0}
                    </p>
                    {!item.isPaid && (
                      <button 
                        onClick={() => handlePayNow(item._id)}
                        disabled={paymentLoading[item._id]}
                        className="bg-primary px-5 py-2 text-sm md:text-base rounded-full font-medium text-white hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {paymentLoading[item._id] ? "Processing..." : "Pay Now"}
                      </button>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="text-sm md:text-base text-gray-300 mt-3 text-left sm:text-right">
                    <p>
                      <span className="text-gray-400">Email: </span>
                      {email}
                    </p>
                    <p>
                      <span className="text-gray-400">Hall: </span>
                      {item.show?.hall || "N/A"}
                    </p>
                    <p>
                      <span className="text-gray-400">Type: </span>
                      {item.show?.type || "N/A"}
                    </p>
                    <p>
                      <span className="text-gray-400">Total Seats: </span>
                      {item.bookedSeats?.length || 0}
                    </p>
                    <p>
                      <span className="text-gray-400">Seat Numbers: </span>
                      {item.bookedSeats
                        ?.map((s) => String(s).trim().toUpperCase())
                        .join(", ") || "N/A"}
                    </p>

                    {/* Snacks Section */}
                    <div className="mt-2">
                      <span className="text-gray-400">Snacks: </span>
                      {item.snacks?.length > 0 ? (
                        <>
                          <button
                            onClick={() => toggleSnacks(index)}
                            className="ml-2 text-sm text-primary hover:underline"
                          >
                            {showSnacks[index] ? "Hide" : "Show"}
                          </button>
                          {showSnacks[index] && (
                            <ul className="list-none ml-0 mt-1 space-y-1">
                              {item.snacks.map((snack, i) => (
                                <li
                                  key={i}
                                  className="flex justify-between text-sm text-gray-200"
                                >
                                  <span>
                                    {snack.name} × {snack.quantity}
                                  </span>
                                  <span>
                                    {snack.price * snack.quantity} {currency}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        "No snacks"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBookings;
