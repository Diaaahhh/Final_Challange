import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUtensils, FaList, FaEye, FaFilter, FaCamera, FaCloudUploadAlt, FaCheck, FaTimes, FaTag } from "react-icons/fa";
import api from "../../api";
import { IMAGE_BASE_URL } from "../../config";

export default function MenuList() {
  const [menuItems, setMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Edit Discount Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

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
        api.get("/menu/categories")
      ]);

      setMenuItems(Array.isArray(menuRes.data) ? menuRes.data : []);
      const branchPayload = branchRes.data?.branches || branchRes.data;
      setBranches(Array.isArray(branchPayload) ? branchPayload : []);

      if (Array.isArray(catRes.data)) {
        const catMap = {};
        catRes.data.forEach(cat => { catMap[cat.id] = cat.menu_name; });
        setCategories(catMap);
      }
    } catch (err) {
      setError("Failed to load external data.");
    } finally {
      setLoading(false);
    }
  };

  // --- ADDED MISSING FUNCTION HERE ---
  const getBranchName = (branchId) => {
    if (!branchId || branchId === "All") return "Unknown Branch";
    const branch = branches.find((b) => String(b.branch_id) === String(branchId));
    return branch ? branch.branch_name : `Branch ${branchId}`;
  };

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

  // Safely parse JSON from the DB discount column
  const getDiscountForBranch = (item, branchId) => {
    try {
        const d = item.discount ? JSON.parse(item.discount) : {};
        return Number(d[branchId]) || 0;
    } catch {
        return 0;
    }
  };

  const openViewModal = (item) => {
    setCurrentItem(item);
    setOpenModal(true);
  };

  // Require a branch to be selected before editing
  const openEditModal = (item) => {
    if (selectedBranch === "All") {
        alert("Please select a specific branch from the top-right filter before setting a discount.");
        return;
    }
    setEditItem(item);
    setDiscountAmount(getDiscountForBranch(item, selectedBranch)); 
    setEditModalOpen(true);
  };

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Now sending BOTH branch_id and discount
      await api.put(`/menu/update-discount/${editItem.id}`, { 
          branch_id: selectedBranch, 
          discount: discountAmount 
      });
      setEditModalOpen(false);
      fetchInitialData(); 
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update discount percentage.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredMenuItems = selectedBranch === "All"
    ? menuItems
    : menuItems.filter(item => {
        if (!item.m_branch_id) return false;
        const availableBranches = String(item.m_branch_id).split('-');
        return availableBranches.includes(String(selectedBranch));
      });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto max-w-7xl">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#1E1E1E] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-white">
              Food<span className="text-[#007BFF]">Menu</span>
            </h1>
          </div>

          <div className="flex gap-3 mt-6 md:mt-0 items-center">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-xs" />
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-white pl-9 pr-4 py-2 rounded-lg text-sm font-bold focus:border-[#007BFF] focus:outline-none appearance-none cursor-pointer min-w-[150px] hover:border-[#007BFF] transition-colors"
              >
                <option value="All" className="bg-[#1A1A1A]">All Branches</option>
                {Array.isArray(branches) && branches.map((branch) => (
                  <option key={branch.id} value={branch.branch_id} className="bg-[#1A1A1A]">{branch.branch_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-3">
            <FaList /> {error}
          </div>
        )}

        {/* DATA TABLE CONTAINER */}
        <div className="bg-[#111111] rounded-xl border border-[#1E1E1E] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0A0A0A] text-[#A0A0A0] text-xs uppercase tracking-wider font-['Barlow_Condensed'] border-b border-[#1E1E1E]">
                  <th className="p-4 w-12 text-center ">SL</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Ingredients</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 w-[200px]">Image</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1A1A1A]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-[#007BFF] font-bold tracking-widest">Loading Data...</td>
                  </tr>
                ) : filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item, index) => {
                    const activeDiscount = selectedBranch !== "All" ? getDiscountForBranch(item, selectedBranch) : 0;
                    
                    return (
                    <tr key={item.id} className="hover:bg-[#1A1A1A] transition-colors group">
                      <td className="p-4 text-center font-bold text-[#007BFF] text-sm">{index + 1}</td>
                      <td className="p-4">
                        <span className="text-[#E0E0E0] text-xs font-mono bg-[#1A1A1A] px-2 py-1 rounded border border-[#2A2A2A]">
                          {item.m_menu_sl}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white font-['Barlow_Condensed'] text-lg tracking-wide">{item.m_menu_name}</div>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[10px] bg-[#007BFF]/10 text-[#007BFF] px-1.5 py-0.5 rounded border border-[#007BFF]/20">
                              Cat: {categories[item.category_id] || item.category_id || "Global"}
                           </span>
                        </div>
                      </td>
                      <td className="p-4 text-[#A0A0A0] text-sm truncate max-w-[200px]" title={formatIngredients(item.m_ingredient)}>
                        {formatIngredients(item.m_ingredient)}
                      </td>
                      <td className="p-4 font-mono text-white">
                        <div className="flex flex-col items-start">
                          <div>
                            <span className="text-[#C59D5F] mr-1 font-bold">BDT</span>
                            {Number(item.m_price).toFixed(2)}
                          </div>
                          {activeDiscount > 0 && (
                            <div className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded inline-flex items-center gap-1 mt-1 border border-green-400/20">
                                <FaTag size={8} /> {activeDiscount}% OFF
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                          <ImageUploadCell item={item} backendUrl={IMAGE_BASE_URL} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openEditModal(item)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#C59D5F] hover:text-white border border-[#C59D5F]/30 hover:bg-[#C59D5F] transition-all rounded-lg" title="Set Discount">
                            <FaTag size={12}/> Discount
                          </button>
                          <button onClick={() => openViewModal(item)} className="p-2 text-[#555] hover:text-[#007BFF] transition-colors rounded-lg hover:bg-[#007BFF]/10">
                            <FaEye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#555]">
                      <FaUtensils className="mx-auto text-4xl mb-3 opacity-20" />
                      <p className="text-[#A0A0A0]">No menu items found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {openModal && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#2A2A2A] relative overflow-hidden">
            <div className="bg-[#0A0A0A] p-6 border-b border-[#1E1E1E] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">Item Details</h3>
              <button onClick={() => setOpenModal(false)} className="text-[#555] hover:text-[#007BFF] transition-colors text-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {currentItem.m_image && (
                 <div className="w-full h-48 bg-[#0A0A0A] rounded-lg mb-4 overflow-hidden border border-[#1E1E1E]">
                    <img src={`${IMAGE_BASE_URL}${currentItem.m_image}`} alt="Menu" className="w-full h-full object-cover" />
                 </div>
              )}
              <div>
                <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider">Name</label>
                <p className="text-2xl font-['Barlow_Condensed'] text-white mt-1">{currentItem.m_menu_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#1E1E1E]">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider">Price</label>
                  <p className="text-xl text-[#C59D5F] font-mono font-bold mt-1">BDT {Number(currentItem.m_price).toFixed(2)}</p>
                </div>
                <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#1E1E1E]">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider">Category</label>
                  <p className="text-white font-mono mt-1">{categories[currentItem.category_id] || "Global"}</p>
                </div>
              </div>
              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                <label className="text-xs text-[#A0A0A0] uppercase font-bold block mb-2 tracking-wider">Ingredients</label>
                <p className="text-[#C0C0C0] text-sm leading-relaxed">{formatIngredients(currentItem.m_ingredient)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DISCOUNT PERCENTAGE MODAL */}
      {editModalOpen && editItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111111] w-full max-w-sm rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#2A2A2A] relative overflow-hidden">
                <div className="bg-[#0A0A0A] p-5 border-b border-[#1E1E1E] flex justify-between items-center">
                    <h3 className="text-lg font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FaTag className="text-[#C59D5F]"/> Set Discount
                    </h3>
                    <button onClick={() => setEditModalOpen(false)} className="text-[#555] hover:text-[#007BFF] transition-colors text-lg">✕</button>
                </div>

                <form onSubmit={handleUpdateDiscount} className="p-6 space-y-5">
                    <div>
                        <label className="text-[10px] text-[#A0A0A0] uppercase font-bold tracking-widest">Item Name</label>
                        <p className="text-xl font-['Barlow_Condensed'] text-white mt-1">{editItem.m_menu_name}</p>
                    </div>
                    
                    <div className="flex justify-between items-center bg-[#0A0A0A] p-3 rounded-lg border border-[#1E1E1E]">
                        <div>
                            <label className="text-[10px] text-[#A0A0A0] uppercase font-bold tracking-widest">Base Price</label>
                            <p className="text-lg text-[#C59D5F] font-mono font-bold mt-1">BDT {Number(editItem.m_price).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <label className="text-[10px] text-[#A0A0A0] uppercase font-bold tracking-widest">Branch</label>
                            <p className="text-sm text-[#007BFF] font-bold mt-1">{getBranchName(selectedBranch)}</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-[#E0E0E0] font-bold mb-2 flex items-center justify-between">
                            <span>Discount Percentage (%)</span>
                            <span className="text-green-400 font-mono text-[10px] bg-green-400/10 px-2 py-0.5 rounded">
                                Pays: BDT {(editItem.m_price - (editItem.m_price * (discountAmount / 100))).toFixed(2)}
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg py-3 px-4 text-white font-mono text-lg focus:outline-none focus:border-[#007BFF] transition-all text-right pr-10"
                                required
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <span className="text-[#555] font-bold text-lg">%</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full bg-[#007BFF] hover:bg-[#0056b3] text-white font-bold tracking-widest text-sm py-3 rounded-lg transition-all disabled:opacity-50 mt-4 uppercase"
                    >
                        {isUpdating ? "Saving..." : "Save Discount"}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

// Sub-component remains unchanged
const ImageUploadCell = ({ item, backendUrl }) => {
  const [preview, setPreview] = useState(item.m_image ? `${backendUrl}${item.m_image}` : null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle");

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      const MAX_SIZE = 200 * 1024;
      if (file) {
          if (file.size > MAX_SIZE) {
              alert(`File is too large (${(file.size / 1024).toFixed(1)} KB). Please upload an image under 200 KB.`);
              e.target.value = ""; return;
          }
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
          await axios.post(`${backendUrl}/api/menu/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
          setUploadStatus("success");
          setTimeout(() => setUploadStatus("idle"), 3000);
      } catch (err) {
          setUploadStatus("error");
      }
  };

  return (
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] overflow-hidden flex-shrink-0 relative">
                  {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[#555]"><FaCamera /></div>}
              </div>
              <div className="flex flex-col gap-1">
                  <label className="cursor-pointer bg-[#1A1A1A] hover:bg-[#2A2A2A] px-2 py-1 rounded text-[13px] text-[#E0E0E0] transition-colors text-center border border-[#2A2A2A] hover:border-[#007BFF]">
                      Choose
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                  {!selectedFile && <span className="text-[10px] text-[#666] text-center leading-tight">Max 200KB</span>}
                  {selectedFile && (
                      <button onClick={handleUpload} disabled={uploadStatus === "uploading" || uploadStatus === "success"} className={`px-2 py-1 rounded text-[13px] flex items-center justify-center gap-1 transition-all font-bold ${uploadStatus === "success" ? "bg-green-600 text-white" : "bg-[#007BFF] text-white hover:bg-[#0066e6]"}`}>
                          {uploadStatus === "uploading" ? "..." : uploadStatus === "success" ? <FaCheck /> : <><FaCloudUploadAlt /> Upload</>}
                      </button>
                  )}
              </div>
          </div>
          {uploadStatus === "success" && <span className="text-[10px] text-[#007BFF] font-bold">Saved!</span>}
      </div>
  );
};