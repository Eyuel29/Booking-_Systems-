import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Film, Users, Plus, X } from "lucide-react";
import Title from "./Title";

const AdminAddManualMovie = () => {
  const backdropRef = useRef(null);
  const trailerRef = useRef(null);
  const castFileRefs = useRef({});

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState("English");
  const [genresText, setGenresText] = useState("");
  const [genresArray, setGenresArray] = useState([]);

  const [runtime, setRuntime] = useState("");
  const [voteAverage, setVoteAverage] = useState("");

  const [backdropPath, setBackdropPath] = useState(null);
  const [backdropPreview, setBackdropPreview] = useState(null);

  const [trailer, setTrailer] = useState(null);
  const [trailerPreview, setTrailerPreview] = useState(null);

  const [casts, setCasts] = useState([{ name: "", file: null, previewUrl: null }]);

  useEffect(() => {
    return () => {
      if (backdropPreview) URL.revokeObjectURL(backdropPreview);
      if (trailerPreview) URL.revokeObjectURL(trailerPreview);
      casts.forEach((c) => c.previewUrl && URL.revokeObjectURL(c.previewUrl));
    };
  }, [backdropPreview, trailerPreview, casts]);

  const parseGenres = () => {
    const arr = genresText.split(",").map((g) => g.trim()).filter(Boolean);
    setGenresArray(arr);
  };

  const handleBackdropChange = (e) => {
    const file = e.target.files?.[0] || null;
    setBackdropPath(file);
    setBackdropPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleTrailerChange = (e) => {
    const file = e.target.files?.[0] || null;
    setTrailer(file);
    setTrailerPreview(file ? URL.createObjectURL(file) : null);
  };

  const addCast = () =>
    setCasts((s) => [...s, { name: "", file: null, previewUrl: null }]);

  const removeCast = (idx) => {
    setCasts((prev) => {
      const arr = [...prev];
      if (arr[idx]?.previewUrl) URL.revokeObjectURL(arr[idx].previewUrl);
      arr.splice(idx, 1);
      return arr.length ? arr : [{ name: "", file: null, previewUrl: null }];
    });
  };

  const onCastNameChange = (idx, value) =>
    setCasts((s) => s.map((c, i) => (i === idx ? { ...c, name: value } : c)));

  const onCastFileChange = (idx, file) =>
    setCasts((s) =>
      s.map((c, i) =>
        i === idx
          ? {
              ...c,
              file,
              previewUrl: file ? URL.createObjectURL(file) : null,
            }
          : c
      )
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const parsedGenres =
      genresArray.length > 0
        ? genresArray
        : genresText.split(",").map((g) => g.trim()).filter(Boolean);

    if (parsedGenres.length === 0) {
      return setMessage("Please add at least one genre");
    }

    if (!title || !overview || !releaseDate || !runtime || voteAverage === "") {
      return setMessage("Please fill all required fields.");
    }

    if (!backdropPath) {
      return setMessage("Poster is required.");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("overview", overview);
    formData.append("release_date", releaseDate);
    formData.append("original_language", originalLanguage);
    formData.append("runtime", runtime);
    formData.append("vote_average", voteAverage);
    formData.append("genres", JSON.stringify(parsedGenres));
    formData.append("genres_text", parsedGenres.join(", "));
    formData.append("backdrop_path", backdropPath);
    if (trailer) formData.append("trailer", trailer);

    const validCasts = casts.filter((c) => c.name.trim() !== "");
    formData.append(
      "casts",
      JSON.stringify(validCasts.map((c) => ({ name: c.name })))
    );

    validCasts.forEach((c, idx) => {
      if (c.file) formData.append(`castsImage_${idx}`, c.file);
    });

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:3000/api/show/manual/movie/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data?.message || "Movie added successfully.");

      // Reset form
      setTitle("");
      setOverview("");
      setReleaseDate("");
      setOriginalLanguage("English");
      setGenresText("");
      setGenresArray([]);
      setRuntime("");
      setVoteAverage("");
      setBackdropPath(null);
      setBackdropPreview(null);
      setTrailer(null);
      setTrailerPreview(null);
      setCasts([{ name: "", file: null, previewUrl: null }]);
      if (backdropRef.current) backdropRef.current.value = "";
      if (trailerRef.current) trailerRef.current.value = "";
      Object.values(castFileRefs.current).forEach((r) => {
        if (r?.current) r.current.value = "";
      });
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };


  return (
     <div>
      <Title text1="Add" text2="Movie" />

      <div className="p-6 max-w-5xl mx-auto text-white">
        <p className="text-sm text-gray-400">Create a manual movie entry with poster, trailer and cast.</p>

        <div className="space-y-6 bg-gray-900/60 border border-gray-700 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* top grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="🎬 Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
           <input
  type="date"
  value={releaseDate}
  onChange={(e) => setReleaseDate(e.target.value)}
  max={new Date().toISOString().split("T")[0]} // ✅ today and past allowed, future disabled
  className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
/>

              <input
                placeholder="🌐 Original language"
                value={originalLanguage}
                onChange={(e) => setOriginalLanguage(e.target.value)}
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="⏱ Runtime (min)"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* overview */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">📝 Overview</label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* rating & genres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="⭐ Rating (0-10)"
                value={voteAverage}
                onChange={(e) => setVoteAverage(e.target.value)}
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div>
                <input
                  placeholder="🎭 Genres (comma separated)"
                  value={genresText}
                  onChange={(e) => setGenresText(e.target.value)}
                  onBlur={parseGenres}
                  className="p-3 rounded-lg bg-gray-800 border border-gray-700 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <small className="text-gray-400 block mt-1">
                  Parsed: <span className="text-blue-400">{genresArray.join(", ")}</span>
                </small>
              </div>
            </div>

            {/* poster & trailer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Poster / Backdrop *</label>
                <input
                  ref={backdropRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackdropChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dull hover:file:text-black cursor-pointer"
                />
                {backdropPreview && (
                  <img src={backdropPreview} alt="poster preview" className="mt-3 w-56 h-32 object-cover rounded-lg border border-gray-700" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Trailer (optional)</label>
                <input
                  ref={trailerRef}
                  type="file"
                  accept="video/*"
                  onChange={handleTrailerChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-dull file:text-black hover:file:bg-primary hover:file:text-white cursor-pointer"
                />
                {trailerPreview && <video src={trailerPreview} controls className="mt-3 w-full max-w-md rounded-lg border border-gray-700" />}
              </div>
            </div>

            {/* casts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-300" />
                  <h3 className="text-lg font-semibold text-gray-200">🎭 Cast</h3>
                </div>
                <button type="button" onClick={addCast} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Cast
                </button>
              </div>

              <div className="space-y-3">
                {casts.map((cast, idx) => (
                  <div key={idx} className="flex flex-wrap gap-3 items-center mb-0 bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <input
                      value={cast.name}
                      onChange={(e) => onCastNameChange(idx, e.target.value)}
                      placeholder="👤 Actor name"
                      className="p-2 rounded bg-gray-900 border border-gray-700 text-white flex-1 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onCastFileChange(idx, e.target.files?.[0] || null)}
                      ref={(el) => (castFileRefs.current[idx] = { current: el })}
                      className="text-sm text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dull hover:file:text-black cursor-pointer"
                    />
                    {cast.previewUrl && <img src={cast.previewUrl} alt="cast" className="w-12 h-12 object-cover rounded-full border border-gray-600" />}
                    <button type="button" onClick={() => removeCast(idx)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm inline-flex items-center gap-1">
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* submit */}
            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-amber-500 text-black hover:bg-amber-400 rounded-lg font-semibold tracking-wide transition-all disabled:opacity-60"
              >
                {loading ? "Uploading..." : " Add Movie"}
              </button>
              {message && <p className="mt-3 text-sm text-amber-300">{message}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAddManualMovie;
