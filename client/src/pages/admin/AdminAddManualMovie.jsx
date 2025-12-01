import React, { useState } from "react";
import axios from "axios";
import { Film, Users, Calendar, Ticket, Plus } from "lucide-react";

const AdminAddManualMovie = () => {
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [runtime, setRuntime] = useState(120);
  const [releaseDate, setReleaseDate] = useState("");
  const [genres, setGenres] = useState("");
  const [type, setType] = useState("2D");
  const [poster, setPoster] = useState(null);
  const [backdrop, setBackdrop] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [casts, setCasts] = useState([{ name: "", image: null }]);
  const [shows, setShows] = useState([{ hall: "", date: "", times: [""] }]);
  const [price, setPrice] = useState({ regular: 50, vip: 100 });
  const [loading, setLoading] = useState(false);

  // Preview helpers (optional)
  const [posterPreview, setPosterPreview] = useState(null);
  const [backdropPreview, setBackdropPreview] = useState(null);

  const handleCastChange = (index, field, value) => {
    const newCasts = [...casts];
    newCasts[index][field] = value;
    setCasts(newCasts);
  };

  const addCast = () => setCasts([...casts, { name: "", image: null }]);
  const addShow = () => setShows([...shows, { hall: "", date: "", times: [""] }]);
  const addShowTime = (showIndex) => {
    const newShows = [...shows];
    newShows[showIndex].times.push("");
    setShows(newShows);
  };

  // Ensure runtime and prices are numbers on change
  const handleRuntimeChange = (val) => setRuntime(Number(val || 0));
  const handlePriceChange = (field, val) => setPrice(prev => ({ ...prev, [field]: Number(val || 0) }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!title.trim()) return alert("Title is required.");
    if (!poster || !backdrop) return alert("Poster and Backdrop are required.");
    if (shows.some(s => !s.hall.trim() || !s.date)) return alert("Fill hall & date for each show.");
    // ensure each show has at least one time filled
    for (const s of shows) {
      if (!s.times.some(t => t && t.trim())) return alert("Each show must have at least one time.");
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("overview", overview);
      formData.append("runtime", Number(runtime)); // ensure number
      formData.append("release_date", releaseDate);
      formData.append("genres", JSON.stringify(genres.split(",").map(g => g.trim()).filter(Boolean)));
      formData.append("type", type);

      // Files (use keys that backend expects)
      formData.append("poster", poster, poster.name);
      formData.append("backdrop", backdrop, backdrop.name);
      if (trailer) formData.append("trailer", trailer, trailer.name);

      // Casts: names JSON + append images as multiple files under same key
      const castsPayload = casts.map(c => ({ name: c.name }));
      formData.append("casts", JSON.stringify(castsPayload));
      casts.forEach((c) => {
        if (c.image) formData.append("castsImages", c.image, c.image.name);
      });

      // Shows and price
      formData.append("shows", JSON.stringify(shows));
      formData.append("price", JSON.stringify({ regular: Number(price.regular), vip: Number(price.vip) }));

      // Debug: log keys and file types (can't print file content)
      console.group("FormData entries");
      for (let pair of formData.entries()) {
        const [k, v] = pair;
        console.log(k, v instanceof File ? `${v.name} (${v.type}, ${v.size} bytes)` : v);
      }
      console.groupEnd();

      // IMPORTANT: do NOT set Content-Type header manually (browser will add boundary)
      const resp = await axios.post("/api/shows/manual-add", formData /* no headers here */);

      console.log("Server response:", resp.status, resp.data);
      alert(resp.data?.message || "Movie added successfully");
      setLoading(false);
    } catch (err) {
      // Helpful detailed error logging
      console.error("Full error object:", err);
      if (err.response) {
        console.error("Server responded with:", err.response.status, err.response.data);
        alert(`Server error: ${err.response.data?.message || JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        console.error("No response received (network?):", err.request);
        alert("No response from server. Check server is running and CORS is allowed.");
      } else {
        console.error("Error building request:", err.message);
        alert("Request error: " + err.message);
      }
      setLoading(false);
    }
  };

  // File input handlers with previews
  const onPosterChange = (f) => {
    setPoster(f);
    setPosterPreview(f ? URL.createObjectURL(f) : null);
  };
  const onBackdropChange = (f) => {
    setBackdrop(f);
    setBackdropPreview(f ? URL.createObjectURL(f) : null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl">
      <h2 className="text-4xl font-extrabold mb-8 text-amber-400 border-b border-amber-500 pb-3 flex items-center gap-3">
        <Film size={36} /> Add Manual Movie & Shows
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Movie Info */}
        <section className="bg-gray-800 p-6 rounded-xl shadow-inner space-y-5">
          <h3 className="text-2xl font-semibold text-amber-300 flex items-center gap-2"><Film size={24} /> Movie Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Title" className="input rounded-lg p-3 text-black" value={title} onChange={e => setTitle(e.target.value)} required />
            <input type="date" className="input rounded-lg p-3 text-black" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
            <input placeholder="Genres (comma separated)" className="input rounded-lg p-3 text-black" value={genres} onChange={e => setGenres(e.target.value)} />
            <input type="number" placeholder="Runtime (min)" className="input rounded-lg p-3 text-black" value={runtime} onChange={e => handleRuntimeChange(e.target.value)} />
            <select className="input rounded-lg p-3 text-black" value={type} onChange={e => setType(e.target.value)}>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </select>

            <div>
              <label className="block text-xs mb-1">Poster</label>
              <input type="file" accept="image/*" onChange={e => onPosterChange(e.target.files[0])} />
              {posterPreview && <img src={posterPreview} alt="poster" className="mt-2 w-24 h-36 object-cover rounded" />}
            </div>

            <div>
              <label className="block text-xs mb-1">Backdrop</label>
              <input type="file" accept="image/*" onChange={e => onBackdropChange(e.target.files[0])} />
              {backdropPreview && <img src={backdropPreview} alt="backdrop" className="mt-2 w-40 h-24 object-cover rounded" />}
            </div>

            <div>
              <label className="block text-xs mb-1">Trailer (optional)</label>
              <input type="file" accept="video/*" onChange={e => setTrailer(e.target.files[0])} />
            </div>
          </div>

          <textarea className="w-full p-3 rounded-lg text-black" placeholder="Overview" value={overview} onChange={e => setOverview(e.target.value)} rows={4} />
        </section>

        {/* Casts */}
        <section className="bg-gray-800 p-6 rounded-xl shadow-inner space-y-5">
          <h3 className="text-2xl font-semibold text-amber-300 flex items-center gap-2"><Users size={24} /> Casts</h3>
          {casts.map((c, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-3 items-center">
              <input placeholder="Name" className="input rounded-lg p-3 text-black flex-1" value={c.name} onChange={e => handleCastChange(idx, "name", e.target.value)} />
              <input type="file" accept="image/*" onChange={e => handleCastChange(idx, "image", e.target.files[0])} />
            </div>
          ))}
          <button type="button" onClick={addCast} className="bg-amber-400 text-black px-4 py-2 rounded-lg"> <Plus size={16} /> Add Cast</button>
        </section>

        {/* Shows */}
        <section className="bg-gray-800 p-6 rounded-xl shadow-inner space-y-5">
          <h3 className="text-2xl font-semibold text-amber-300 flex items-center gap-2"><Calendar size={24} /> Shows</h3>
          {shows.map((s, si) => (
            <div key={si} className="bg-gray-700 p-4 rounded-lg space-y-3">
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <input placeholder="Hall" className="input rounded-lg p-3 text-black flex-1" value={s.hall} onChange={e => { const newShows = [...shows]; newShows[si].hall = e.target.value; setShows(newShows); }} />
                <input type="date" className="input rounded-lg p-3 text-black" value={s.date} onChange={e => { const newShows = [...shows]; newShows[si].date = e.target.value; setShows(newShows); }} />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {s.times.map((t, ti) => (
                  <input key={ti} type="time" className="input rounded-lg p-3 text-black" value={t} onChange={e => { const newShows = [...shows]; newShows[si].times[ti] = e.target.value; setShows(newShows); }} />
                ))}
                <button type="button" onClick={() => addShowTime(si)} className="bg-amber-400 text-black px-3 py-1 rounded-lg"> <Plus size={14} /> Add Time</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addShow} className="bg-amber-400 text-black px-4 py-2 rounded-lg"> <Plus size={16} /> Add Show</button>
        </section>

        {/* Price */}
        <section className="bg-gray-800 p-6 rounded-xl shadow-inner space-y-5">
          <h3 className="text-2xl font-semibold text-amber-300 flex items-center gap-2"><Ticket size={24} /> Price</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" className="input rounded-lg p-3 text-black" value={price.regular} onChange={e => handlePriceChange("regular", e.target.value)} placeholder="Regular Price" />
            <input type="number" className="input rounded-lg p-3 text-black" value={price.vip} onChange={e => handlePriceChange("vip", e.target.value)} placeholder="VIP Price" />
          </div>
        </section>

        <button type="submit" disabled={loading} className="w-full bg-amber-400 text-black font-bold py-3 rounded-xl">{loading ? "Adding..." : "Add Movie & Shows"}</button>
      </form>
    </div>
  );
};

export default AdminAddManualMovie;
