import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assets, dummyDateTimeData, dummyShowsData } from "../assets/assets";
import Loading from "../components/Loading";
import { ClockIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import toast from "react-hot-toast";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";

const currency = import.meta.env.VITE_CURENCY || "ETB";
const rowLetter = (index) => String.fromCharCode(65 + index);

const generateSeats = (rows, cols, startCol = 1, customRows = {}, reverse = false) => {
  const seats = [];
  for (let r = 0; r < rows; r++) {
    const row = rowLetter(r);
    for (let c = 0; c < cols; c++) {
      const col = reverse ? startCol + (cols - 1 - c) : startCol + c;
      if (customRows && customRows[row] && !customRows[row].includes(col)) continue;
      seats.push(`${row}${col}`);
    }
  }
  return seats;
};

const layouts = {
  hall1: {
    regular: {
      left: { rows: 9, cols: 6, startCol: 1 },
      middle: { rows: 9, cols: 11, startCol: 7 },
      right: { rows: 9, cols: 6, startCol: 18 },
    },
    vip: {
      left: { rows: 4, cols: 7, startCol: 1 },
      middle: { rows: 5, cols: 8, startCol: 8 },
      right: { rows: 4, cols: 9, startCol: 16, disabledSeats: ["B24"] },
    },
  },
  hall2: {
    regular: {
      left: { rows: 12, cols: 6, startCol: 1, customRows: { L: [1, 2, 3] } },
      right: { rows: 12, cols: 6, startCol: 7 },
    },
    vip: {
      left: { rows: 5, cols: 4, startCol: 1, customRows: { E: [1, 2, 3] } },
      right: { rows: 5, cols: 8, startCol: 5, disabledSeats: ["E5"] },
    },
  },
  hall3: {
    regular: {
      left: { rows: 12, cols: 6, startCol: 7, reverse: true },
      right: {
        rows: 12,
        cols: 6,
        startCol: 1,
        reverse: true,
        disabledSeats: ["L4", "L5", "L6"],
        customRows: { L: [1, 2, 3, 4, 5, 6] },
      },
    },
    vip: {
      left: { rows: 5, cols: 4, startCol: 9, customRows: { E: [10, 11, 12] }, reverse: true },
      right: { rows: 5, cols: 8, startCol: 1, customRows: { E: [1, 2, 3, 4, 5, 6, 7, 8] }, disabledSeats: ["E8"], reverse: true },
    },
  },
};

const hallMap = { C1: "hall1", C2: "hall2", C3: "hall3" };
const screenWidths = {
  hall1: "w-[360px] sm:w-[420px] md:w-[480px]",
  hall2: "w-[420px] sm:w-[500px] md:w-[580px]",
  hall3: "w-[360px] sm:w-[420px] md:w-[480px]",
};

const MAX_SELECTION = 8;

// ----------------- Helpers -----------------
const getFirst = (obj, keys) => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (typeof obj[k] !== "undefined" && obj[k] !== null) return obj[k];
  }
  return undefined;
};

const normalizeTimeItem = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const time = getFirst(raw, ["time", "startTime", "start_time", "datetime", "dateTime", "show_time", "t"]);
  const type = getFirst(raw, ["type", "showType", "format", "kind"]);
  const Hall = getFirst(raw, ["Hall", "hall", "hall_name", "hallName"]);
  const showId = getFirst(raw, ["showId", "show_id", "id", "_id"]);
  const regular = raw.showPrice?.regular ?? getFirst(raw, ["regular", "regular_price", "regularPrice", "price", "seatPrice"]);
  const Vip = raw.showPrice?.vip ?? getFirst(raw, ["Vip", "vip", "vip_price", "vipPrice"]);
  return { ...raw, time, type, Hall, showId, regular, Vip };
};

const normalizeShow = (rawShow) => {
  if (!rawShow || typeof rawShow !== "object") return rawShow;
  const show = { ...rawShow };
  let dt = show.dateTime ?? show.date_time ?? show.date_times ?? show.showTimes ?? null;
  if (Array.isArray(dt)) {
    const grouped = {};
    dt.forEach((it) => {
      const item = normalizeTimeItem(it);
      const d = getFirst(item, ["date", "showDate", "show_date", "dateOnly"]) ?? "unknown";
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(item);
    });
    show.dateTime = grouped;
  } else if (dt && typeof dt === "object") {
    const normalizedMap = {};
    Object.entries(dt).forEach(([dateKey, arr]) => {
      if (Array.isArray(arr)) normalizedMap[dateKey] = arr.map((it) => normalizeTimeItem(it));
      else if (typeof arr === "object") normalizedMap[dateKey] = [normalizeTimeItem(arr)];
      else normalizedMap[dateKey] = [];
    });
    show.dateTime = normalizedMap;
  } else {
    show.dateTime = show.dateTime ?? {};
  }
  show.Hall = show.Hall ?? show.hall ?? show.hallName;
  show.regular = show.regular ?? show.regular_price ?? show.price ?? show.regularPrice;
  show.Vip = show.Vip ?? show.vip ?? show.vip_price ?? show.vipPrice;
  return show;
};

const ItemCard = ({ item, activeCard, handleCardClick, quantities, updateQuantity, currency }) => {
  const qty = quantities[item._id] || 0;
  const showControls = activeCard === item._id || qty > 0;

  return (
    <div
      onClick={() => handleCardClick(item._id)}
      className={`rounded-2xl p-3 cursor-pointer transition duration-200 border ${
        activeCard === item._id ? "border-primary scale-105" : "border-gray-700 hover:border-primary/50"
      }`}
    >
      <img src={item.image?.url || item.image} alt={item.name} className="w-full h-28 object-contain mb-2 rounded-lg" />
      <h3 className="font-semibold text-md">{item.name}</h3>
      <p className="text-xs text-gray-400 line-clamp-2">{item.desc}</p>
      <p className="mt-2 font-bold text-primary text-sm">
        {currency} {item.price}
      </p>

      {showControls && (
        <div className="flex items-center justify-center mt-2 gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => updateQuantity(item._id, -1)}
            disabled={!qty}
            className={`px-3 py-1 rounded-full font-bold ${qty ? "bg-primary text-white" : "bg-gray-600 text-gray-300 cursor-not-allowed"}`}
          >
            -
          </button>
          <span className="min-w-[24px] text-sm">{qty}</span>
          <button onClick={() => updateQuantity(item._id, +1)} className="px-3 py-1 bg-primary text-white rounded-full font-bold">
            +
          </button>
        </div>
      )}
    </div>
  );
};

const SeatLayout = () => {
  const { id, date } = useParams();
  const [show, setShow] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]); // array of uppercased seat ids for the selected category
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastApiResponse, setLastApiResponse] = useState(null);

  const [wantSnacks, setWantSnacks] = useState(false);
  const [snacksData, setSnacksData] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [activeCard, setActiveCard] = useState(null);

  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();
  const seatsContainerRef = useRef(null);

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedSeats([]);
    setTimeout(() => {
      if (seatsContainerRef?.current && typeof seatsContainerRef.current.scrollIntoView === "function") {
        seatsContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const el = document.querySelector(".seat-layout-anchor");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  const parsePrice = useCallback((p) => {
    if (typeof p === "number") return p;
    if (!p && p !== 0) return 0;
    const cleaned = String(p).replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const buildConfig = useCallback(
    async (extra = {}) => {
      try {
        if (typeof getToken === "function") {
          const token = await getToken();
          if (token) return { headers: { Authorization: `Bearer ${token}` }, ...extra };
        }
      } catch (err) {
        console.warn("SeatLayout: getToken failed", err);
      }
      return extra;
    },
    [getToken]
  );

  const findShowInObject = (obj, depth = 0) => {
    if (!obj || typeof obj !== "object" || depth > 4) return null;
    if (obj.dateTime || obj.movie || obj.title || obj._id || obj.showId || obj.Hall) return obj;
    for (const k of Object.keys(obj)) {
      try {
        const candidate = obj[k];
        if (candidate && typeof candidate === "object") {
          const found = findShowInObject(candidate, depth + 1);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  };

  const getShow = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastApiResponse(null);

    if (!axios) {
      console.warn("SeatLayout: axios missing; using dummy fallback");
      const fallback = dummyShowsData.find((s) => String(s._id) === String(id));
      if (fallback) {
        setShow(normalizeShow({ movie: fallback, dateTime: dummyDateTimeData }));
      } else {
        setShow(null);
        setError("No axios and no dummy found");
      }
      setLoading(false);
      return;
    }

    try {
      const config = await buildConfig();
      const res = await axios.get(`/api/show/${id}`, config);
      const raw = res?.data ?? res;
      setLastApiResponse(raw);
      const possible = raw?.show || raw?.data || raw?.result || raw?.payload || raw;
      if (possible && (possible.dateTime || possible.movie || possible.title || possible._id)) {
        const normalized = normalizeShow(possible);
        setShow(normalized);
        setLoading(false);
        return;
      }
      const found = findShowInObject(raw);
      if (found) {
        const normalized = normalizeShow(found);
        setShow(normalized);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("SeatLayout: fetch error:", err);
      setLastApiResponse({ error: String(err) });
    }

    const fallback = dummyShowsData.find((s) => String(s._id) === String(id));
    if (fallback) {
      setShow(normalizeShow({ movie: fallback, dateTime: dummyDateTimeData }));
      setLoading(false);
      return;
    }

    setShow(null);
    setError("Show not found");
    setLoading(false);
  }, [axios, id, buildConfig]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No show id provided");
      return;
    }
    getShow();
  }, [getShow, id]);

  // helper: try to fetch the current user's bookings (several common endpoints, returns array of bookings)
  const fetchMyBookings = useCallback(
    async (config) => {
      if (!axios || !user) return [];
      const tries = ["/api/booking/my", "/api/booking/my-bookings", "/api/booking/user", "/api/booking/bookings/my", "/api/booking"]; // some servers use different routes
      for (const ep of tries) {
        try {
          // for some endpoints we may want to pass showId as query — we filter client-side anyway
          const resp = await axios.get(ep, config);
          const data = resp?.data ?? resp;
          // if response is an object with bookings array
          if (Array.isArray(data?.bookings)) return data.bookings;
          // if response is an array directly
          if (Array.isArray(data)) return data;
          // some endpoints return { result: [...] }
          if (Array.isArray(data?.result)) return data.result;
        } catch (e) {
          // ignore and continue
        }
      }
      return [];
    },
    [axios, user]
  );

  const getOccupiedSeats = useCallback(async () => {
    const showId = selectedTime ? getFirst(selectedTime, ["showId", "show_id", "id", "_id"]) : null;
    if (!showId) {
      setOccupiedSeats([]);
      return;
    }

    if (!selectedCategory) {
      setOccupiedSeats([]);
      return;
    }

    const cat = selectedCategory.toLowerCase(); // "regular" or "vip"

    try {
      const config = await buildConfig();

      // 1) fetch global occupied seats (server endpoint you already have)
      let mainOccupied = [];
      try {
        const { data } = await axios.get(`/api/booking/seats/${showId}`, config);
        const raw = data ?? {};
        // If server returns structured occupiedSeats object
        if (raw?.success && raw.occupiedSeats && typeof raw.occupiedSeats === "object") {
          mainOccupied = Array.isArray(raw.occupiedSeats[cat]) ? raw.occupiedSeats[cat] : [];
        } else if (raw && typeof raw.occupiedSeats === "object") {
          mainOccupied = Array.isArray(raw.occupiedSeats[cat]) ? raw.occupiedSeats[cat] : [];
        } else if (Array.isArray(raw?.occupiedSeats)) {
          // fallback: server returned flat array
          mainOccupied = raw.occupiedSeats;
        } else if (Array.isArray(data)) {
          // sometimes the API returns array directly
          mainOccupied = data;
        }
      } catch (err) {
        // still continue — we'll try to merge user bookings
        console.warn("SeatLayout: fetching global occupied seats failed", err);
      }

      // 2) fetch current user's bookings (so we also mark our own seats as occupied)
      let myBookedSeats = [];
      try {
        const myBookings = await fetchMyBookings(config);
        if (Array.isArray(myBookings) && myBookings.length > 0) {
          // bookings shape may vary; try to extract seat lists
          const seats = [];
          myBookings.forEach((b) => {
            // b.show or b.showId may hold the show id; sometimes it's nested object
            const bShowId = getFirst(b, ["show", "showId", "show_id", "id", "_id"]);
            // accept either plain id match or object match
            if (String(bShowId) === String(showId) || String(b?.show) === String(showId) || String(b?.show?._id) === String(showId)) {
              // some bookings store category, ensure we only include matching category
              const bcat = (getFirst(b, ["category"]) || "").toLowerCase();
              if (!bcat || bcat === cat) {
                // extract bookedSeats or bookedSeats array
                const bs = getFirst(b, ["bookedSeats", "selectedSeats", "seats", "booked_seats"]) || [];
                if (Array.isArray(bs)) seats.push(...bs);
                else if (typeof bs === "string") seats.push(bs);
              }
            }
          });
          myBookedSeats = seats;
        }
      } catch (err) {
        console.warn("SeatLayout: fetching user bookings failed", err);
      }

      // combine both sources, uppercase & dedupe
      const combined = Array.from(
        new Set(
          [...(mainOccupied || []), ...(myBookedSeats || [])]
            .filter(Boolean)
            .map((s) => String(s).trim().toUpperCase())
        )
      );

      setOccupiedSeats(combined);
    } catch (err) {
      console.error("SeatLayout: error loading occupied seats:", err);
      toast.error("Error loading occupied seats");
      setOccupiedSeats([]);
    }
  }, [axios, selectedTime, selectedCategory, buildConfig, fetchMyBookings]);

  // re-fetch when time OR category changes
  useEffect(() => {
    if (selectedTime) getOccupiedSeats();
    else setOccupiedSeats([]);
  }, [selectedTime, selectedCategory, getOccupiedSeats]);

  const hallKey = useMemo(() => hallMap[selectedTime?.Hall] || hallMap[getFirst(selectedTime, ["Hall", "hall"])] || "hall1", [selectedTime]);

  const hallLayout = useMemo(() => {
    if (!selectedCategory) return null;
    return layouts[hallKey]?.[selectedCategory.toLowerCase()] ?? null;
  }, [hallKey, selectedCategory]);

  const screenWidthClass = useMemo(() => screenWidths[hallKey] ?? screenWidths.hall1, [hallKey]);

  const seatsBySection = useMemo(() => {
    if (!hallLayout) return {};
    return Object.fromEntries(
      Object.entries(hallLayout).map(([section, opts]) => [
        section,
        generateSeats(opts.rows, opts.cols, opts.startCol, opts.customRows, opts.reverse),
      ])
    );
  }, [hallLayout]);

  // Set of disabled seats coming from layout.disabledSeats + occupied seats
  const occupiedSet = useMemo(() => new Set((occupiedSeats || []).map((s) => String(s).trim().toUpperCase())), [occupiedSeats]);

  const disabledSeatSet = useMemo(() => {
    const set = new Set();
    if (!hallLayout) return set;
    Object.values(hallLayout).forEach((opts) => {
      (opts.disabledSeats || []).forEach((s) => set.add(String(s).trim().toUpperCase()));
    });
    // Note: do not blindly mix layout disabled + occupied for click prevention in UI logic;
    // we'll check isOccupied separately when toggling.
    (occupiedSeats || []).forEach((s) => set.add(String(s).trim().toUpperCase()));
    return set;
  }, [hallLayout, occupiedSeats]);

  const toggleSeat = (seatIdRaw) => {
    if (!user) {
      toast.error("Please login first to select seats.");
      return;
    }
    const seatId = String(seatIdRaw).trim().toUpperCase();
    if (!selectedTime) return toast.error("Please select a time first");
    if (!selectedCategory) return toast.error("Please choose Regular or VIP first");
    if (occupiedSet.has(seatId)) return toast.error("Seat is already booked");
    if (disabledSeatSet.has(seatId) && !occupiedSet.has(seatId)) return toast.error("Seat is not available");
    setSelectedSeats((prev) => {
      const present = prev.map((s) => s.toUpperCase()).includes(seatId);
      if (present) return prev.filter((s) => s.toUpperCase() !== seatId);
      if (prev.length >= MAX_SELECTION) {
        toast.error(`Maximum ${MAX_SELECTION} seats allowed`);
        return prev;
      }
      return [...prev, seatId];
    });
  };

  useEffect(() => {
    setSelectedSeats([]);
  }, [selectedCategory]);

  // --- Snacks handling (lazy fetch when dropdown opens) ---
  useEffect(() => {
    if (!wantSnacks) return;
    let cancelled = false;
    const fetchSnacks = async () => {
      if (!axios) return;
      try {
        const { data } = await axios.get("/api/snacks/all");
        if (!cancelled) setSnacksData(data.snacks || []);
      } catch (err) {
        console.error("Failed to load snacks", err);
        toast.error("Failed to load snacks 😔");
      }
    };
    fetchSnacks();
    return () => {
      cancelled = true;
    };
  }, [wantSnacks, axios]);

  const updateQuantity = (id, delta) => {
    if (!id) return;
    setQuantities((prev) => {
      const newQty = Math.max((prev[id] || 0) + delta, 0);
      return { ...prev, [id]: newQty };
    });
  };

  const handleSnackCardClick = (id) => {
    setActiveCard((prev) => (prev === id ? null : id));
  };

  const totalSnacksPrice = snacksData.reduce((sum, item) => {
    const qty = quantities[item._id] || 0;
    return sum + qty * item.price;
  }, 0);

  const pricePerSeat = parsePrice(
    getFirst(
      selectedTime,
      selectedCategory === "vip"
        ? ["Vip", "vip", "vip_price", "vipPrice"]
        : ["regular", "price", "regular_price", "regularPrice", "seatPrice"]
    )
  );

  const handlePayNow = async () => {
    if (!user) return toast.error("Please login first");
    if (!selectedTime || selectedSeats.length === 0) return toast.error("Please select time and seats");
    if (!selectedCategory) return toast.error("Please select a category");

    try {
      const token = await getToken();
// Calculate payable totals
const seatsTotal = pricePerSeat * selectedSeats.length;
const totalAmount = seatsTotal + totalSnacksPrice;

// Build properly structured snack data
const formattedSnacks = wantSnacks
  ? selectedSnackItems.map((snack) => ({
      name: snack.name,
      price: snack.price,
      quantity: quantities[snack._id] || 0,
    }))
  : [];

// Send full booking info to backend
const { data } = await axios.post(
  "/api/booking/create",
  {
    showId: selectedTime.showId,
    selectedSeats,
    category: selectedCategory,
    wantSnacks,
    snacks: formattedSnacks, // ✅ full snack info
    totalAmount, // ✅ send full payable amount (seats + snacks)
  },
  { headers: { Authorization: `Bearer ${token}` } }
);


      if (data.success) {
        toast.success(data.message);
        navigate("/my-bookings");
      } else {
        toast.error(data.message || "Something went wrong. Please try again.");
        // refresh occupied seats because server might have changed them
        await getOccupiedSeats();
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      await getOccupiedSeats();
    }
  };

  if (loading) return <Loading />;

  if (!show) {
    return (
      <div className="min-h-screen flex items-start justify-center p-8">
        <div className="max-w-4xl w-full text-left text-gray-300">
          <h2 className="text-2xl font-semibold text-amber-400 mb-2">Show not available</h2>
          <p className="mb-2">{error ?? "We couldn't find that show."}</p>

          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Last API response (raw):</p>
            <pre className="text-xs bg-gray-900/50 p-3 rounded overflow-auto max-h-56">{JSON.stringify(lastApiResponse, null, 2)}</pre>
          </div>

          <div className="mb-4 text-sm text-gray-400">
            <p>Tips:</p>
            <ul className="list-disc ml-5">
              <li>Check the Network tab for <code>GET /api/show/{id}</code>.</li>
              <li>If the API returns the show under a different key (e.g. <code>data</code>, <code>result</code>), this page attempts to find it automatically.</li>
              <li>If auth is required, ensure <code>getToken()</code> returns a token and your axios instance uses it.</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 rounded bg-primary" onClick={() => getShow()}>
              Retry
            </button>
            <button className="px-4 py-2 rounded border" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const snacks = snacksData.filter((item) => item.type === "Snack");
  const drinks = snacksData.filter((item) => item.type === "Drink");
  const waterItems = snacksData.filter((item) => item.type === "Water");
  const selectedSnackItems = snacksData.filter((s) => (quantities[s._id] || 0) > 0);

  return (
    <div className="min-h-screen w-full mt-10 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row px-4 xs:px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-12 md:py-16 lg:pt-20 text-white relative">
        <BlurCircle bottom="-20px" right="-20px" />

        <div className="w-full lg:w-80 xl:w-96 mt-4 lg:mt-6 bg-primary/8 border border-primary/20 rounded-lg py-6 lg:py-8 h-max lg:sticky lg:top-28 mb-6 lg:mb-0 lg:mr-8">
          <div className="px-6">
            <p className="text-lg font-semibold text-amber-400">Available Timings</p>
          </div>

          <div className="mt-4 flex flex-col gap-3 px-3">
            {show?.dateTime?.[date] ? (
              show.dateTime[date].map((item, idx) => {
                const normalizedItem = normalizeTimeItem(item);
                return (
                  <div
                    key={normalizedItem.showId ?? normalizedItem.time ?? idx}
                    onClick={() => {
                      setSelectedTime(normalizedItem);
                      setSelectedCategory(null);
                      setSelectedSeats([]);
                    }}
                    className={`border rounded-lg mx-1 px-3 py-2 cursor-pointer transition-all duration-200 ${
                      selectedTime?.time === normalizedItem.time ? "bg-primary text-amber-300 border-amber-400" : "hover:bg-primary/12 border-transparent"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <ClockIcon className="w-4 h-4" />
                        <p className="text-sm font-medium">{isoTimeFormat(normalizedItem.time)}</p>
                      </div>
                      <p className="text-sm text-gray-300 text-center md:text-left">{normalizedItem.type}</p>
                      <p className="text-sm font-semibold text-amber-400 text-center md:text-right">{normalizedItem.Hall}</p>
                    </div>

                    {selectedTime?.time === normalizedItem.time && (
                      <div className="flex flex-col xs:flex-row justify-around mt-3 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCategory("regular");
                          }}
                          className={`px-3 py-1 text-sm rounded-md border transition ${
                            selectedCategory === "regular" ? "bg-amber-400/20 border-amber-400 text-amber-300" : "border-amber-400 hover:bg-amber-400/10"
                          }`}
                        >
                          Regular –{" "}
                          <span className="text-amber-300">
                            {currency} {parsePrice(getFirst(normalizedItem, ["regular", "price", "regular_price", "regularPrice", "seatPrice"]))?.toLocaleString()}
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCategory("vip");
                          }}
                          className={`px-3 py-1 text-sm rounded-md border transition ${
                            selectedCategory === "vip" ? "bg-amber-400/20 border-amber-400 text-amber-300" : "border-amber-400 hover:bg-amber-400/10"
                          }`}
                        >
                          VIP –{" "}
                          <span className="text-amber-300">
                            {currency} {parsePrice(getFirst(normalizedItem, ["Vip", "vip", "vip_price", "vipPrice"]))?.toLocaleString()}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                );
              })
            ) : (
              <p className="text-gray-400 text-center italic">No timings available for this date.</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-20">
               <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <span className="text-xs text-gray-300">Reserved, already booked so choose other seat </span>
            </div>
        </div>

        <div className="flex-1 flex flex-col mt-4 items-center w-full">
          <h1 className="text-xl xs:text-2xl font-semibold mb-4 text-amber-400 text-center">Select Your Seats</h1>
          {selectedTime && (
            <h2 className="text-sm text-gray-400 mb-6 text-center">
              Hall: <span className="text-amber-300">{selectedTime.Hall}</span> • {selectedTime.type} •{" "}
              <span>{selectedCategory ? selectedCategory.toUpperCase() : "No category chosen"}</span>
            </h2>
          )}

          <img src={assets.screenImage} alt="screen" className={`${screenWidthClass} mb-1 max-w-full`} />
          <p className="text-gray-400 text-sm mb-6">Screen side</p>

          {selectedCategory && hallLayout ? (
            <div ref={seatsContainerRef} className="bg-transparent rounded-xl p-3 xs:p-4 sm:p-6 w-full max-w-6xl flex flex-col items-center gap-4 xs:gap-6 seat-layout-anchor">
              <div className="flex gap-4 overflow-x-auto w-full pb-4 lg:hidden">
                {Object.entries(hallLayout).map(([section, opts]) => {
                  const seats = seatsBySection[section] || [];
                  return (
                    <div key={section} className="flex flex-col items-center gap-3 flex-shrink-0 bg-gray-800/20 rounded-lg p-3" style={{ minWidth: `${Math.max((opts.cols || 6) * 36, 280)}px` }}>
                      <h3 className="text-lg font-medium text-amber-400 capitalize">{section} Side</h3>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opts.cols}, minmax(28px, 1fr))` }}>
                        {seats.map((seat) => {
                          const seatNorm = String(seat).toUpperCase();
                          const isSelected = selectedSeats.map((s) => s.toUpperCase()).includes(seatNorm);
                          const isOccupied = occupiedSet.has(seatNorm);
                          const disabled = disabledSeatSet.has(seatNorm);
                          return (
                            <button
                              key={seat}
                              onClick={() => !isOccupied && toggleSeat(seat)}
                              disabled={isOccupied || (disabled && !isSelected)}
                              aria-label={`Seat ${seat}`}
                              className={`w-7 h-7 rounded-md border text-[10px] font-medium transition-all duration-200 ${
                                isSelected ? "bg-amber-400 text-black border-amber-400 scale-105"
                                  : isOccupied ? "bg-blue-500 text-white border-blue-600 cursor-not-allowed"
                                  : disabled ? "bg-gray-700/50 text-gray-400 border-gray-600 cursor-not-allowed" : "bg-gray-700 border-gray-600 hover:bg-amber-500/80 hover:scale-105 text-white"
                              }`}
                            >
                              {!isOccupied ? seat : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden lg:flex gap-4 md:gap-6 xl:gap-8 2xl:gap-12 justify-center w-full mt-4">
                {Object.entries(hallLayout).map(([section, opts]) => {
                  const seats = seatsBySection[section] || [];
                  return (
                    <div key={section} className="flex flex-col items-center gap-3 bg-gray-800/10 p-4 rounded-xl shadow-lg">
                      <h3 className="text-lg font-semibold text-amber-400 capitalize">{section} Side</h3>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opts.cols}, minmax(32px, 1fr))` }}>
                        {seats.map((seat) => {
                          const seatNorm = String(seat).toUpperCase();
                          const isSelected = selectedSeats.map((s) => s.toUpperCase()).includes(seatNorm);
                          const isOccupied = occupiedSet.has(seatNorm);
                          const disabled = disabledSeatSet.has(seatNorm);

                          return (
                            <button
                              key={seat}
                              onClick={() => !isOccupied && toggleSeat(seat)}
                              disabled={isOccupied || (disabled && !isSelected)}
                              aria-label={`Seat ${seat}`}
                              className={`w-8 h-8 md:w-9 md:h-9 rounded-md border text-xs md:text-sm font-medium transition-all duration-200
                                ${isSelected ? "bg-amber-400 text-black border-amber-400 scale-105"
                                  : isOccupied ? "bg-blue-500 text-white border-blue-600 cursor-not-allowed"
                                  : disabled ? "bg-gray-700/50 text-gray-400 border-gray-600 cursor-not-allowed" : "bg-gray-700 border-gray-600 hover:bg-amber-500/80 hover:scale-105 text-white"}`}
                            >
                              {!isOccupied ? seat : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedSeats.length > 0 && (
  <div className="mt-4 xs:mt-6 w-full">
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-800/30 rounded-lg p-4 xs:p-6">
      {/* LEFT: totals & seat info */}
      <div className="flex-1 min-w-0">
        <p className="text-base sm:text-lg font-semibold text-amber-400 whitespace-nowrap">
          Total:
        </p>

        <div className="mt-2">
          <p className="text-white font-semibold text-lg sm:text-xl md:text-2xl">
            {currency} {(pricePerSeat * selectedSeats.length).toLocaleString()}
          </p>

          <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""}:
            <span className="ml-2 inline-block max-w-full">
              {/* allow horizontal scroll on very small devices */}
              <span className="inline-block whitespace-nowrap overflow-x-auto scrollbar-hide">
                {selectedSeats.join(", ") || "—"}
              </span>
            </span>
          </p>

          {/* Snacks summary */}
          {selectedSnackItems.length > 0 && (
            <div className="mt-3 text-sm text-gray-200">
              <p className="text-xs text-amber-300 mb-1">Snacks / Water</p>

              <ul className="list-none space-y-1 max-w-full">
                {selectedSnackItems.map((it) => (
                  <li key={it._id} className="text-sm flex justify-between items-center">
                    <span className="truncate mr-3">{it.name} × {quantities[it._id]}</span>
                    <span className="text-gray-300 whitespace-nowrap">
                      {currency} {(it.price * (quantities[it._id] || 0)).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-sm text-gray-300">
                Snacks total:
                <span className="text-white font-semibold ml-2">{currency} {totalSnacksPrice.toLocaleString()}</span>
              </p>

              <p className="mt-2 text-sm text-amber-300">
                Payable:
                <span className="text-white font-semibold ml-2">
                  {currency} {(pricePerSeat * selectedSeats.length + totalSnacksPrice).toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: snack toggle + pay */}
      <div className="flex flex-col sm:flex-row items-center gap-3 relative w-full md:w-auto">
        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setWantSnacks((v) => !v)}
            aria-expanded={wantSnacks}
            aria-controls="snack-panel"
            className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 justify-center"
          >
            {wantSnacks ? "Hide snacks" : "Do you want snacks?"}
          </button>

          {wantSnacks && (
            <div
              id="snack-panel"
              className={`
                /* full-width, stacked panel on small screens; absolute dropdown on md+ */
                mt-2 w-full md:w-[420px] 
                ${/* absolute for md+ */ ""} 
                md:absolute left-0 md:top-full md:right-0
                max-h-[60vh] md:max-h-[360px] overflow-auto
                bg-gray-900/95 border border-primary/30 p-3 rounded-lg shadow-xl z-50
              `}
              role="dialog"
              aria-modal="false"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">Choose snacks</h4>
                <button
                  onClick={() => setWantSnacks(false)}
                  className="text-xs text-gray-400 hover:text-white"
                  aria-label="Close snacks panel"
                >
                  Close
                </button>
              </div>

              {/* no-snacks state */}
              {(!snacksData || snacksData.length === 0) ? (
                <p className="text-sm text-gray-400">No snacks available right now.</p>
              ) : (
                <div className="space-y-2">
                  {snacksData.map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-3 p-2 bg-gray-800/30 rounded">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image?.url || item.image}
                          alt={item.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                          <p className="text-xs text-amber-300">{currency} {item.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item._id, -1)}
                          disabled={!(quantities[item._id] > 0)}
                          className={`px-2 py-1 rounded-full font-bold ${quantities[item._id] > 0 ? "bg-primary text-white" : "bg-gray-600 text-gray-300 cursor-not-allowed"}`}
                        >
                          -
                        </button>

                        <span className="w-6 text-center text-sm">{quantities[item._id] || 0}</span>

                        <button
                          onClick={() => updateQuantity(item._id, +1)}
                          className="px-2 py-1 bg-primary text-white rounded-full font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-300">Snacks total:</p>
                    <p className="text-sm font-semibold text-white">{currency} {totalSnacksPrice.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pay button: full width on small screens, auto on md+ */}
        <div className="w-full md:w-auto">
          <button
            onClick={handlePayNow}
            className="w-full md:w-auto bg-primary hover:bg-primary-dull text-black font-semibold px-4 xs:px-6 py-2 xs:py-3 rounded-full transition-all active:scale-95 text-sm xs:text-base"
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  </div>
)}

            </div>
          ) : (
            <div className="w-full flex justify-center py-8">
              <p className="text-gray-400 italic text-center">
                {selectedTime ? "Please select a category to view seats." : "Please select a time to view available seats."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;
