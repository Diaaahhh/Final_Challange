import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUtensils, FaList, FaEye, FaFilter, FaCamera, FaCloudUploadAlt, FaCheck, FaTimes } from "react-icons/fa";
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

  const openViewModal = (item) => {
    setCurrentItem(item);
    setOpenModal(true);
  };

  const filteredMenuItems = selectedBranch === "All"
    ? menuItems
    : menuItems.filter(item => {
        if (!item.m_branch_id) return false;
        const availableBranches = String(item.m_branch_id).split('-');
        return availableBranches.includes(String(selectedBranch));
      });

  return (
    /* Background: Ghost White (#F8FAFC), Text: Dark Charcoal (#1E293B) */
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto max-w-7xl">
        
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#E2E8F0] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-[#1E293B]">
              Food<span className="text-[#C59D5F]">Menu</span>
            </h1>
          </div>

          <div className="flex gap-3 mt-6 md:mt-0 items-center">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-xs" />
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                /* Select UI: Light Gray Background, Silver Border */
                className="bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E293B] pl-9 pr-4 py-2 rounded-lg text-sm font-bold focus:border-[#C59D5F] focus:outline-none appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="All">All Branches</option>
                {Array.isArray(branches) && branches.map((branch) => (
                  <option key={branch.id} value={branch.branch_id}>{branch.branch_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert bg-red-50 border border-red-200 text-red-600 mb-6 flex items-center gap-3">
            <FaList /> {error}
          </div>
        )}

        {/* --- DATA TABLE CONTAINER --- */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F1F5F9] text-[#64748B] text-xs uppercase tracking-wider font-['Barlow_Condensed'] border-b border-[#E2E8F0]">
                  <th className="p-4">Code</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Ingredients</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 w-[200px]">Image</th> 
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-[#C59D5F]">Loading Data...</td>
                  </tr>
                ) : filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    /* Row Hover: Ghost White (#F8FAFC) */
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-4">
                        <span className="text-[#64748B] text-xs font-mono bg-[#F1F5F9] px-2 py-1 rounded border border-[#E2E8F0]">
                          {item.m_menu_sl}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#1E293B] font-['Barlow_Condensed'] text-lg tracking-wide">
                          {item.m_menu_name}
                        </div>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                              Cat: {categories[item.category_id] || item.category_id || "Global"}
                           </span>
                        </div>
                      </td>
                      <td className="p-4 text-[#64748B] text-xs truncate max-w-[200px]" title={formatIngredients(item.m_ingredient)}>
                        {formatIngredients(item.m_ingredient)}
                      </td>
                      <td className="p-4 font-mono text-[#1E293B]">
                        <span className="text-[#C59D5F] mr-1 font-bold">BDT</span>
                        {Number(item.m_price).toFixed(2)}
                      </td>
                      <td className="p-4">
                          <ImageUploadCell item={item} backendUrl={IMAGE_BASE_URL} />
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => openViewModal(item)} className="p-2 text-[#64748B] hover:text-[#C59D5F] transition-colors">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[#64748B]">
                      <FaUtensils className="mx-auto text-4xl mb-3 opacity-20" />
                      No menu items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL --- */}
      {openModal && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E2E8F0] relative overflow-hidden">
            <div className="bg-[#F1F5F9] p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-[#1E293B] uppercase tracking-wider">Item Details</h3>
              <button onClick={() => setOpenModal(false)} className="text-[#64748B] hover:text-[#1E293B]">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {currentItem.m_image && (
                 <div className="w-full h-48 bg-[#F1F5F9] rounded-lg mb-4 overflow-hidden border border-[#E2E8F0]">
                    <img src={`${IMAGE_BASE_URL}${currentItem.m_image}`} alt="Menu" className="w-full h-full object-cover" />
                 </div>
              )}
              <div>
                <label className="text-xs text-[#64748B] uppercase font-bold">Name</label>
                <p className="text-2xl font-['Barlow_Condensed'] text-[#1E293B]">{currentItem.m_menu_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#64748B] uppercase font-bold">Price</label>
                  <p className="text-xl text-[#C59D5F] font-mono font-bold">BDT {Number(currentItem.m_price).toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] uppercase font-bold">Category</label>
                  <p className="text-[#1E293B] font-mono">{categories[currentItem.category_id] || "Global"}</p>
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                <label className="text-xs text-[#64748B] uppercase font-bold block mb-2">Ingredients</label>
                <p className="text-[#475569] text-sm leading-relaxed">{formatIngredients(currentItem.m_ingredient)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
                <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] overflow-hidden flex-shrink-0 relative">
                    {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[#64748B]"><FaCamera /></div>}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="cursor-pointer bg-[#F8FAFC] hover:bg-[#F1F5F9] px-2 py-1 rounded text-[10px] text-[#475569] transition-colors text-center border border-[#E2E8F0]">
                        Choose
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                    {selectedFile && (
                        <button 
                            onClick={handleUpload}
                            disabled={uploadStatus === "uploading" || uploadStatus === "success"}
                            className={`px-2 py-1 rounded text-[10px] flex items-center justify-center gap-1 transition-all ${uploadStatus === "success" ? "bg-green-600 text-white" : "bg-[#C59D5F] text-white hover:bg-[#b08d55]"}`}
                        >
                            {uploadStatus === "uploading" ? "..." : uploadStatus === "success" ? <FaCheck /> : <><FaCloudUploadAlt /> Upload</>}
                        </button>
                    )}
                </div>
            </div>
            {uploadStatus === "success" && <span className="text-[10px] text-green-600 font-bold">Saved!</span>}
        </div>
    );
};