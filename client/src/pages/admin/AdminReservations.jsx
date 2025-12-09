import React, { useEffect, useState } from "react";
import axios from "axios";
import Loading from "../../components/Loading";
import { Toaster, toast } from "react-hot-toast";
import Title from "./Title";

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/reserve/get");
      if (data.success) setReservations(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch reservations ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/reserve/delete/${id}`);
      toast.success("Reservation deleted ✅");
      setReservations(reservations.filter((res) => res._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete ❌");
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(`/api/reserve/approve/${id}`);
      toast.success("Reservation approved ✅");
      setReservations(
        reservations.map((res) =>
          res._id === id ? { ...res, approved: true } : res
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve ❌");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen p-6 xl:p-10 bg-gray-900 text-white">
      <Toaster position="top-right" reverseOrder={false} />
      <Title text1="Add" text2="Upcoming" />

      <div className="overflow-x-auto bg-gray-800 rounded-xl mt-10 shadow-lg">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-700 sticky top-0">
            <tr>
              {[
                "Name",
                "Email",
                "Phone",
                "Event",
                "People",
                "Talk Via",
                "Date",
                "Start Time",
                "End Time",
                "Message",
                "Approved",
                "Actions",
                "Created At",
              ].map((head) => (
                <th
                  key={head}
                  className={`px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase ${
                    head === "Message" ? "w-96" : ""
                  }`}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center py-6">
                  No reservations found
                </td>
              </tr>
            ) : (
              reservations.map((res, idx) => (
                <tr
                  key={res._id}
                  className={`transition-all hover:bg-gray-700 ${
                    idx % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                  }`}
                >
                  <td className="px-4 py-2">{res.SenderName}</td>
                  <td className="px-4 py-2">{res.email}</td>
                  <td className="px-4 py-2">{res.phone}</td>
                  <td className="px-4 py-2">{res.events}</td>
                  <td className="px-4 py-2">{res.peopleAttend}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        res.Talk === "Phone"
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {res.Talk}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(res.ReservedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{res.eventStartTime}</td>
                  <td className="px-4 py-2">{res.eventEndTime}</td>

                  {/* Expanded Message */}
                  <td className="px-4 py-2 w-96 break-words whitespace-pre-line">
                    {res.message || "-"}
                  </td>

                  <td className="px-4 py-2">
                    {res.approved ? (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                        Approved
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleApprove(res._id)}
                      disabled={res.approved}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDelete(res._id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(res.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReservations;
