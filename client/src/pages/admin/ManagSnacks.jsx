import React, { useState, useEffect } from "react";
import { TrashIcon, PencilIcon } from "@heroicons/react/16/solid";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import Title from "./Title";

const ManageSnacks = () => {
    const currency = import.meta.env.VITE_CURENCY;
  const [snacks, setSnacks] = useState([]);
  const [newSnack, setNewSnack] = useState({
    name: "",
    desc: "",
    price: "",
    type: "Snack",
    image: null,
  });

  // edit state per snack
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ desc: "", price: "", imageFile: null });

  const { axios, getToken } = useAppContext();
  const base = "/api/snacks";

  // fetch
  const fetchSnacks = async () => {
    try {
      const { data } = await axios.get(`${base}/all`);
      setSnacks(data.snacks || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch snacks");
    }
  };

  useEffect(() => {
    fetchSnacks();
  }, []);

  // add
  const handleAddSnack = async () => {
    if (!newSnack.name || !newSnack.desc || !newSnack.price || !newSnack.image) {
      toast.error("Please fill all fields and add an image!");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", newSnack.name);
      fd.append("desc", newSnack.desc);
      fd.append("price", newSnack.price);
      fd.append("type", newSnack.type);
      fd.append("image", newSnack.image);

      const { data } = await axios.post(`${base}/add`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      setSnacks((p) => [...p, data.snack]);
      setNewSnack({ name: "", desc: "", price: "", type: "Snack", image: null });
      toast.success("Snack added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add snack");
    }
  };

  // start edit (only desc, price, image editable)
  const startEdit = (snack) => {
    setEditingId(snack._id);
    setEditValues({ desc: snack.desc || "", price: snack.price ?? "", imageFile: null });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ desc: "", price: "", imageFile: null });
  };

  // save edit (sends name & type too to avoid backend overwriting)
  const saveEdit = async (id) => {
    try {
      const snack = snacks.find((s) => s._id === id);
      if (!snack) return;

      // if imageFile provided, use FormData
      if (editValues.imageFile) {
        const fd = new FormData();
        fd.append("name", snack.name); // preserve
        fd.append("type", snack.type); // preserve
        fd.append("desc", editValues.desc);
        fd.append("price", editValues.price);
        fd.append("image", editValues.imageFile);

        const { data } = await axios.put(`${base}/update/${id}`, fd, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${await getToken()}`,
          },
        });

        setSnacks((prev) => prev.map((s) => (s._id === id ? data.snack : s)));
        toast.success("Snack updated!");
      } else {
        // no image, send JSON but include name/type to avoid overwrite
        const body = {
          name: snack.name,
          type: snack.type,
          desc: editValues.desc,
          price: editValues.price,
        };

        const { data } = await axios.put(`${base}/update/${id}`, body, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });

        setSnacks((prev) => prev.map((s) => (s._id === id ? data.snack : s)));
        toast.success("Snack updated!");
      }

      cancelEdit();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update snack");
    }
  };

  // delete
  const handleRemoveSnack = async (id) => {
    try {
      await axios.delete(`${base}/delete/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setSnacks((prev) => prev.filter((s) => s._id !== id));
      toast.success("Snack removed!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete snack");
    }
  };

  return (
    <div className="p-4">
      <Title text1="Manage" text2="Snacks" />
            {/* List */}
      <div className="mt-10 space-y-4">
        {snacks.map((snack) => (
          <div
            key={snack._id}
            className="flex flex-wrap items-center gap-4 border p-3 rounded-lg"
          >
            <div className="flex-1 flex items-start gap-3">
              {snack.image && (
                <img
                  src={snack.image.url || snack.image}
                  alt={snack.name}
                  className="w-20 h-20 object-cover rounded aspect-video"
                />
              )}

              <div className="flex-1">
                <p className="font-semibold">{snack.name}</p>
                {editingId === snack._id ? (
                  <>
                    <textarea
                      value={editValues.desc}
                      onChange={(e) => setEditValues((v) => ({ ...v, desc: e.target.value }))}
                      className="w-full border rounded px-2 py-1 mb-2 text-sm"
                    />
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">{snack.desc}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-gray-400">{snack.type}</p>

              {editingId === snack._id ? (
                <>
                  <input
                    type="number"
                    min={0}
                    value={editValues.price}
                    onChange={(e) => setEditValues((v) => ({ ...v, price: e.target.value }))}
                    className="border border-gray-500 rounded-md px-2 py-1 w-24 text-sm outline-none"
                  />
                  <span className="ml-1">{currency}</span>

                  <label className="cursor-pointer">
                    <PencilIcon className="w-5 h-5 text-blue-500 hover:text-blue-700" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setEditValues((v) => ({ ...v, imageFile: e.target.files[0] }))
                      }
                    />
                  </label>

                  <button
                    onClick={() => saveEdit(snack._id)}
                    className="bg-primary/80 text-white px-3 py-1 rounded text-sm"
                  >
                    Save
                  </button>
                  <button onClick={cancelEdit} className="border px-3 py-1 rounded text-sm">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p className="font-medium">{snack.price}</p>

                  <PencilIcon
                    className="w-5 h-5 text-blue-500 cursor-pointer"
                    onClick={() => startEdit(snack)}
                  />

                  <TrashIcon
                    className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                    onClick={() => handleRemoveSnack(snack._id)}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="mt-6 border p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Add New Snack/Drink</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Name"
            value={newSnack.name}
            onChange={(e) => setNewSnack({ ...newSnack, name: e.target.value })}
            className="border border-gray-500 rounded-md px-3 py-2 outline-none text-sm flex-1"
          />
          <input
            type="text"
            placeholder="Description"
            value={newSnack.desc}
            onChange={(e) => setNewSnack({ ...newSnack, desc: e.target.value })}
            className="border border-gray-500 rounded-md px-3 py-2 outline-none text-sm flex-1"
          />
          <input
            type="number"
            min={0}
            placeholder={`Price (${currency})`}
            value={newSnack.price}
            onChange={(e) => setNewSnack({ ...newSnack, price: e.target.value })}
            className="border border-gray-500 rounded-md px-3 py-2 outline-none text-sm w-24"
          />
          <select
            value={newSnack.type}
            onChange={(e) => setNewSnack({ ...newSnack, type: e.target.value })}
            className="border border-gray-500 rounded-md px-3 py-2 outline-none text-sm"
          >
            <option value="Snack">Snack</option>
            <option value="Drink">Drink</option>
            <option value="Water">Water</option>
          </select>

          <label className="cursor-pointer border border-gray-800 rounded-md px-3 py-2 text-s bg-primary-dull text-primary over:bg-gray-100">
            {newSnack.image ? "Change Image" : "Add Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setNewSnack({ ...newSnack, image: e.target.files[0] })}
            />
          </label>

          <button
            onClick={handleAddSnack}
            className="bg-primary/80 text-white px-3 py-2 rounded-lg hover:bg-primary text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageSnacks;
