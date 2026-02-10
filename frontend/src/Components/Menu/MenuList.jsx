import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUtensils, FaList, FaEye, FaFilter, FaCamera, FaCloudUploadAlt, FaCheck, FaTimes } from "react-icons/fa";
import api from "../../api";
import { IMAGE_BASE_URL } from "../../config"; // 1. Imported Config

export default function MenuList() {
  const [menuItems, setMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState({}); // Mapping object: { id: "Name" }
  const [selectedBranch, setSelectedBranch] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [menuRes, branchRes, catRes] = await Promise.all([
        api.get("/menu/list"),
        api.get("/menu/branches"),
        api.get("/menu/categories") // New endpoint
      ]);

      // Set Menu Items
      const menuPayload = menuRes.data;
      setMenuItems(Array.isArray(menuPayload) ? menuPayload : []);

      // Set Branches
      const branchPayload = branchRes.data?.branches || branchRes.data;
      setBranches(Array.isArray(branchPayload) ? branchPayload : []);

      // Create a mapping object for Categories: { 14: "Burger", 12: "test" }
      if (Array.isArray(catRes.data)) {
        const catMap = {};
        catRes.data.forEach(cat => {
          catMap[cat.id] = cat.menu_name;
        });
        setCategories(catMap);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setMenuItems([]);
      setBranches([]);
      setError("Failed to load external data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to strip brackets and format list
  const formatIngredients = (rawInput) => {
    if (!rawInput) return "No details";
    const strVal = String(rawInput);
    try {
      const parsed = JSON.parse(strVal);
      if (Array.isArray(parsed)) return parsed.join(", ");
      return strVal;
    } catch (e) {
      return strVal.replace(/[\[\]"]/g, "").replace(/,/g, ", ");
    }
  };

  // Modal Handler
  const openViewModal = (item) => {
    setCurrentItem(item);
    setOpenModal(true);
  };

  // --- FILTER LOGIC ---
const filteredMenuItems = selectedBranch === "All"
  ? menuItems
  : menuItems.filter(item => {
      if (!item.m_branch_id) return false; // Safety check

      // 1. Convert database value "1-2" into an array ["1", "2"]
      // 2. Handle cases where it might just be "1" (single value)
      const availableBranches = String(item.m_branch_id).split('-');

      // 3. Check if the selected branch exists in that list
      return availableBranches.includes(String(selectedBranch));
    });

  return (
    <div className="min-h-screen bg-[#0E1014] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto max-w-7xl">
        
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-white">
              Food<span className="text-[#C59D5F]">Menu</span>
            </h1>
          </div>

          <div className="flex gap-3 mt-6 md:mt-0 items-center">
            {/* BRANCH DROPDOWN */}
            <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <select 
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="bg-[#1A1C21] border border-white/10 text-white pl-9 pr-4 py-2 rounded-lg text-sm font-bold focus:border-[#C59D5F] focus:outline-none appearance-none cursor-pointer min-w-[150px]"
                >
                    <option value="All">All Branches</option>
                    
                    {Array.isArray(branches) && branches.map((branch) => (
                        <option key={branch.id} value={branch.branch_id}>
                            {branch.branch_name}
                        </option>
                    ))}
                </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert bg-red-900/20 border border-red-500 text-red-200 mb-6 flex items-center gap-3">
            <FaList /> {error}
          </div>
        )}

        {/* --- DATA TABLE --- */}
        <div className="bg-[#1A1C21] rounded-xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0E1014] text-gray-400 text-xs uppercase tracking-wider font-['Barlow_Condensed'] border-b border-white/5">
                  <th className="p-4">Code</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Ingredients</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 w-[200px]">Image</th> 
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-[#C59D5F]">
                      Loading Data...
                    </td>
                  </tr>
                ) : filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4">
                        <span className="text-gray-500 text-xs font-mono bg-black/30 px-2 py-1 rounded">
                          {item.m_menu_sl}
                        </span>
                      </td>
                      
                      <td className="p-4">
                        <div className="font-bold text-white font-['Barlow_Condensed'] text-lg tracking-wide">
                          {item.m_menu_name}
                        </div>
                        <div className="flex gap-2 mt-1">
                             {/* UPDATED: Displays Category Name from map or ID as fallback */}
                             <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/50">
                                Cat: {categories[item.category_id] || item.category_id || "Global"}
                            </span>
                            {item.m_branch_id ?''
                            : (
                                <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-900/50">
                                    Global
                                </span>
                            )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div
                          className="text-xs text-gray-500 truncate max-w-[200px]"
                          title={formatIngredients(item.m_ingredient)}
                        >
                          {formatIngredients(item.m_ingredient)}
                        </div>
                      </td>

                      <td className="p-4 font-mono text-white">
                        <span className="text-[#C59D5F] mr-1">BDT</span>
                        {Number(item.m_price).toFixed(2)}
                      </td>

                      <td className="p-4">
                          <ImageUploadCell 
                             item={item} 
                             backendUrl={IMAGE_BASE_URL} /* 2. Fixed Prop */
                          />
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => openViewModal(item)}
                          className="p-2 hover:text-[#C59D5F] transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      <FaUtensils className="mx-auto text-4xl mb-3 opacity-20" />
                      No menu items found {selectedBranch !== "All" && "for this branch"}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- VIEW ONLY MODAL --- */}
      {openModal && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1C21] w-full max-w-lg rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="bg-[#0E1014] p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">
                Item Details
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {currentItem.m_image && (
                 <div className="w-full h-48 bg-black/50 rounded-lg mb-4 overflow-hidden border border-white/10">
                    <img 
                        src={`${IMAGE_BASE_URL}${currentItem.m_image}`} /* 3. Fixed Image Source */
                        alt="Menu" 
                        className="w-full h-full object-cover"
                    />
                 </div>
              )}

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Name
                </label>
                <p className="text-2xl font-['Barlow_Condensed'] text-white">
                  {currentItem.m_menu_name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">
                    Price
                  </label>
                  <p className="text-xl text-[#C59D5F] font-mono">
                    BDT {Number(currentItem.m_price).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">
                    Category
                  </label>
                  <p className="text-white font-mono">
                    {categories[currentItem.category_id] || currentItem.category_id || "Global"}
                  </p>
                </div>
              </div>
              <div className="bg-[#0E1014] p-4 rounded-lg border border-white/5">
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">
                  Ingredients
                </label>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {formatIngredients(currentItem.m_ingredient)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: HANDLES UPLOAD LOGIC PER ROW ---
const ImageUploadCell = ({ item, backendUrl }) => {
    const [preview, setPreview] = useState(item.m_image ? `${backendUrl}${item.m_image}` : null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("idle"); 

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file)); 
            setUploadStatus("idle"); 
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploadStatus("uploading");
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("m_menu_sl", item.m_menu_sl); 

        try {
            await axios.post(`${backendUrl}/api/menu/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setUploadStatus("success");
            setTimeout(() => setUploadStatus("idle"), 3000); 
        } catch (err) {
            console.error(err);
            setUploadStatus("error");
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 relative">
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            <FaCamera />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300 transition-colors text-center border border-white/5">
                        Choose
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileSelect}
                        />
                    </label>

                    {selectedFile && (
                        <button 
                            onClick={handleUpload}
                            disabled={uploadStatus === "uploading" || uploadStatus === "success"}
                            className={`px-2 py-1 rounded text-[10px] flex items-center justify-center gap-1 transition-all ${
                                uploadStatus === "success" ? "bg-green-600 text-white" : "bg-[#C59D5F] text-black hover:bg-[#b08d55]"
                            }`}
                        >
                            {uploadStatus === "uploading" && "..."}
                            {uploadStatus === "success" && <FaCheck />}
                            {uploadStatus === "idle" && <><FaCloudUploadAlt /> Upload</>}
                            {uploadStatus === "error" && <><FaTimes /> Retry</>}
                        </button>
                    )}
                </div>
            </div>
            
            {uploadStatus === "success" && <span className="text-[10px] text-green-400">Saved!</span>}
            {uploadStatus === "error" && <span className="text-[10px] text-red-400">Failed</span>}
        </div>
    );
};