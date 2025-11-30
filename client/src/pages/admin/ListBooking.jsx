import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import Title from '../admin/Title';
import { useAppContext } from '../../context/AppContext';
import { dateFormat } from '../../lib/dateFormat';
import { Search } from 'lucide-react'; // ✅ optional: for icon

const ListBooking = () => {
  const currency = import.meta.env.VITE_CURENCY || 'ETB';
  const { axios, getToken, user } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all or filtered bookings
  const getAllBookings = async (email = '') => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('/api/admin/all-bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
        params: email ? { email } : {}, // ✅ search by email if provided
      });
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) getAllBookings();
  }, [user]);

  const handleSearch = () => {
    if (searchEmail.trim() !== '') {
      setIsSearching(true);
      getAllBookings(searchEmail);
    }
  };

  const clearSearch = () => {
    setSearchEmail('');
    setIsSearching(false);
    getAllBookings();
  };

  if (isLoading) return <Loading />;

  return (
    <div className="px-4 md:px-8">
      <Title text1="List" text2="Bookings" />

      {/* 🔍 Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
        <div className="flex items-center w-full sm:w-96 bg-gray-800 rounded-lg px-3 py-2 focus-within:ring-2 ring-primary">
          <Search className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter email to search..."
            className="bg-transparent outline-none text-sm text-gray-200 w-full"
          />
        </div>

        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={handleSearch}
            disabled={!searchEmail.trim()}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
              searchEmail.trim()
                ? 'bg-amber-500 hover:bg-amber-600 text-black'
                : 'bg-gray-600 cursor-not-allowed text-gray-300'
            }`}
          >
            Search
          </button>

          {isSearching && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 📋 Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border border-gray-700 rounded-lg overflow-hidden shadow-md bg-gray-900 text-gray-100">
          <thead>
            <tr className="bg-gray-800 text-left text-sm uppercase tracking-wide text-gray-300">
              <th className="p-3 pl-5 font-semibold">User Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Movie</th>
              <th className="p-3 font-semibold">Show Time</th>
              <th className="p-3 font-semibold">Category</th>
              <th className="p-3 font-semibold">Seats</th>
              <th className="p-3 font-semibold">Snacks</th>
              <th className="p-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>

          <tbody className="text-sm divide-y divide-gray-800">
            {bookings.length > 0 ? (
              bookings.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-800/60 transition-colors duration-150"
                >
                  <td className="p-3 pl-5">{item.user?.name || '—'}</td>
                  <td className="p-3">{item.user?.email || '—'}</td>
                  <td className="p-3 font-medium text-amber-400">
                    {item.show?.movie?.title || '—'}
                  </td>
                  <td className="p-3 text-gray-300">
                    {item.show?.showDateTime
                      ? dateFormat(item.show.showDateTime)
                      : '—'}
                  </td>
                  <td className="p-3 capitalize">{item.category || '—'}</td>
                  <td className="p-3">
                    {item.bookedSeats
                      ? Object.values(item.bookedSeats).join(', ')
                      : '—'}
                  </td>
                  <td className="p-3">
                    {item.snacks && item.snacks.length > 0 ? (
                      <ul className="space-y-1">
                        {item.snacks.map((snack, i) => (
                          <li
                            key={i}
                            className="flex justify-between text-gray-400"
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
                    ) : (
                      <span className="text-gray-500 italic">No snacks</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-semibold text-green-400">
                    {currency} {item.amount}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="p-6 text-center text-gray-400 italic"
                >
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListBooking;
