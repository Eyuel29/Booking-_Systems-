import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

// Reusable card for snacks & drinks
const ItemCard = ({ item, activeCard, handleCardClick, quantities, updateQuantity, currency }) => {
  const qty = quantities[item._id] || 0;
  const showControls = activeCard === item._id || qty > 0;

  return (
    <div
      onClick={() => handleCardClick(item._id)}
      className={`rounded-2xl p-3 cursor-pointer transition duration-200 border ${
        activeCard === item._id
          ? "border-primary scale-105"
          : "border-gray-700 hover:border-primary/50"
      }`}
    >
      <img
        src={item.image?.url || item.image}
        alt={item.name}
        className="w-full h-32 object-contain mb-2 rounded-lg"
      />
      <h3 className="font-semibold text-lg">{item.name}</h3>
      <p className="text-sm text-gray-400">{item.desc}</p>
      <p className="mt-2 font-bold text-primary">
        {currency} {item.price}
      </p>

      {showControls && (
        <div
          className="flex items-center justify-center mt-2 gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => updateQuantity(item._id, -1)}
            disabled={!qty}
            className={`px-3 py-1 rounded-full font-bold ${
              qty ? "bg-primary text-white" : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            -
          </button>
          <span className="min-w-[24px]">{qty}</span>
          <button
            onClick={() => updateQuantity(item._id, +1)}
            className="px-3 py-1 bg-primary text-white rounded-full font-bold"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

const OrderSnacks = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURENCY ;
  

  const location = useLocation();
  const navigate = useNavigate();
  const { id, date } = useParams();
  const { selectedSeats = [], category, hall, pricePerSeat, prevTime } = location.state || {};

  const [snacksData, setSnacksData] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [activeCard, setActiveCard] = useState(null);

 const seatPrice = Number(String(pricePerSeat)?.replace(/\D/g, "")) || 0;


  // Fetch snacks from backend
  useEffect(() => {
    const fetchSnacks = async () => {
      try {
        const { data } = await axios.get("/api/snacks/all");
        setSnacksData(data.snacks || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load snacks 😔");
      }
    };
    fetchSnacks();
  }, []);

  const updateQuantity = (id, delta) => {
    if (!id) return;
    setQuantities((prev) => {
      const newQty = Math.max((prev[id] || 0) + delta, 0);
      return { ...prev, [id]: newQty };
    });
  };

  const handleCardClick = (id) => {
    setActiveCard((prev) => (prev === id ? null : id));
  };

  const bookTickets = async () => {
      try{
        if(!user) return toast.error('Please first login Please')
  
          if(!selectedTime || !selectedSeats.length) return toast.error('please select a time and seats')
      
              const {data} = await axios.post('/api/booking/create', {showId: selectedTime.showId, selectedSeats}, {headers: { Authorization: `Bearer ${await getToken()}` }} )
              if(data.success){
                toast.success(data.message)
                navigate('/my-booking')
              }else {
                toast.error(data.message)
              }
              
            } catch (error) {
        toast.error(error.message)
      }
    }

  // Calculate totals
  const totalSnacksPrice = snacksData.reduce((sum, item) => {
    const qty = quantities[item._id] || 0;
    return sum + qty * item.price;
  }, 0);

  const totalPrice = seatPrice * selectedSeats.length + totalSnacksPrice;

  // Group snacks
  const snacks = snacksData.filter((item) => item.type === "Snack");
  const drinks = snacksData.filter((item) => item.type === "Drink");
  const waterItems = snacksData.filter((item) => item.type === "Water");


const handleBackToSeats = () => {
  navigate(-1);
};





  return (
    <div className="p-6 pt-50 text-center text-white max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center cursor-pointer" onClick={handleBackToSeats}>
          <ArrowLeftIcon className="w-10 h-10 animate-bounce text-primary mr-2" />
        </div>

        <button
          onClick={bookTickets}
          className="bg-primary text-white px-6 py-3 rounded-2xl text-lg font-semibold"
        >
          Confirm Order — {currency} {totalPrice.toLocaleString()}
        </button>
      </div>

      {/* Header */}
      <h2 className="text-2xl font-bold mb-2 text-primary">
        🎟️ {hall || "Hall"} — {category?.toUpperCase() || ""}
      </h2>

      {/* Selected Seats */}
      {selectedSeats.length > 0 ? (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2 ">
          <span className="text-lg font-medium text-white">
            {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""}:{" "}
            {selectedSeats.join(", ")}
      
          </span>
          
          <span className="text-primary-dull underline text-4xl">
           
            {currency} {totalPrice.toLocaleString()}
          </span>
        </div>
      ) : (
        <p className="text-gray-400 mb-4 italic">No seats selected yet</p>
      )}

      {/* 🍽️ Snacks Section */}
      {snacks.length > 0 && (
        <>
          <h2 className="text-2xl font-bold underline mb-4 text-primary"> Snacks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-8">
            {snacks.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                activeCard={activeCard}
                handleCardClick={handleCardClick}
                quantities={quantities}
                updateQuantity={updateQuantity}
                currency={currency}
              />
            ))}
          </div>
        </>
      )}

      {/* 💧 Drinks Section */}
      {(drinks.length > 0 || waterItems.length > 0) && (
        <>
          <h2 className="text-2xl underline font-bold mb-4 text-primary">Soft Drinks & Water</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-8">
            {[...drinks, ...waterItems].map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                activeCard={activeCard}
                handleCardClick={handleCardClick}
                quantities={quantities}
                updateQuantity={updateQuantity}
                currency={currency}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderSnacks;


