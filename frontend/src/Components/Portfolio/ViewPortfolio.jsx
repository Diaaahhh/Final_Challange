import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus, FaImage, FaTimes } from "react-icons/fa";
import api from "../../api";
import { IMAGE_BASE_URL } from "../../config";

export default function ViewPortfolio() {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editData, setEditData] = useState({ id: null, category: "", title: "", description: "" });
  const [editBanner, setEditBanner] = useState(null);
  const [editImages, setEditImages] = useState(null);

  // Fetch portfolio items on load
  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await api.get("/portfolio");
      setPortfolioItems(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching gallery items:", err);
      setError("Failed to load gallery items.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DELETE HANDLER
  // ==========================================
  const handleDelete = async (id) => {
    // 1. Ask the user to confirm before deleting
    const confirmDelete = window.confirm("Are you sure you want to delete this gallery item?");
    if (!confirmDelete) return;

    try {
      // 2. Send DELETE request to the backend route we just made
      await api.delete(`/portfolio/${id}`);
      
      // 3. Update the UI instantly by filtering out the deleted ID
      setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
      
      alert("Item deleted successfully!");
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item. Please try again.");
    }
  };

  // ==========================================
  // EDIT HANDLERS
  // ==========================================
  const openEditModal = (item) => {
    setEditData({
      id: item.id,
      category: item.category || "",
      title: item.title || "",
      description: item.description || ""
    });
    setEditBanner(null);
    setEditImages(null);
    setIsEditModalOpen(true);
    document.body.style.overflow = 'hidden'; // Stop background scrolling
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const formData = new FormData();
    formData.append("category", editData.category);
    formData.append("title", editData.title);
    formData.append("description", editData.description);
    
    // Append files if they selected new ones
    if (editBanner) {
      formData.append("banner", editBanner);
    }
    if (editImages) {
      Array.from(editImages).forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      await api.put(`/portfolio/${editData.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Gallery item updated successfully!");
      closeEditModal();
      fetchPortfolio(); // Refresh the table to show new data
    } catch (err) {
      console.error("Error updating gallery:", err);
      alert("Failed to update item. Please check the console.");
    } finally {
      setUpdating(false);
    }
  };

  // Helper to get image URL
  const getImageUrl = (filename) => {
    if (!filename) return "https://via.placeholder.com/150?text=No+Image";
    return `${IMAGE_BASE_URL}/uploads/portfolio/${filename}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C59D5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-6 lg:p-10 text-[#E0E0E0] font-sans relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">
              Manage Gallery
            </h1>
            <p className="text-[#A0A0A0] text-sm mt-1">
              View, edit, or delete your existing gallery items.
            </p>
          </div>
          <Link
            to="/admin/create_portfolio"
            className="flex items-center gap-2 px-6 py-3 bg-[#007BFF] hover:bg-[#0056b3] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(0,123,255,0.4)] transition-all"
          >
            <FaPlus /> Add New Item
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Table Section */}
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden shadow-lg overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2A2A2A] text-white text-sm  tracking-wider">
                <th className="p-4 font-semibold border-b border-[#333333]">Banner</th>
                <th className="p-4 font-semibold border-b border-[#333333]">Details</th>
                <th className="p-4 font-semibold border-b border-[#333333]">Description</th>
                <th className="p-4 font-semibold border-b border-[#333333]">Gallery</th>
                <th className="p-4 font-semibold border-b border-[#333333] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {portfolioItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#A0A0A0]">
                    No gallery items found. Click "Add New Item" to create one.
                  </td>
                </tr>
              ) : (
                portfolioItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#222222] transition-colors">
                    
                    {/* Banner Image */}
                    <td className="p-4 w-32">
                      <div className="w-24 h-16 rounded-md overflow-hidden bg-black border border-[#333333]">
                        <img
                          src={getImageUrl(item.banner)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Title & Category */}
                    <td className="p-4">
                      <p className="text-white font-bold text-lg mb-1">{item.title}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#333333] text-[#C59D5F]">
                        {item.category}
                      </span>
                    </td>

                    {/* Description (Truncated) */}
                    <td className="p-4 max-w-xs text-sm text-[#A0A0A0]">
                      <div className="line-clamp-2">
                        {item.description || "No description provided."}
                      </div>
                    </td>

                    {/* Images Count */}
                    <td className="p-4 text-sm text-[#A0A0A0]">
                      <div className="flex items-center gap-2">
                        <FaImage className="text-[#007BFF]" />
                        {item.images ? item.images.length : 0} extra images
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* Edit Button - Opens Modal */}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 bg-[#2A2A2A] hover:bg-[#007BFF] text-white rounded transition-colors tooltip"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-[#2A2A2A] hover:bg-red-600 text-white rounded transition-colors tooltip"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          EDIT MODAL
          ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            <button 
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-[#A0A0A0] hover:text-white bg-[#2A2A2A] p-2 rounded-full transition-colors"
            >
              <FaTimes />
            </button>

            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6 font-['Playfair_Display'] border-b border-[#2A2A2A] pb-4">
                Edit Gallery Item
              </h2>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                
                {/* Category & Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Category</label>
                    <input
                      type="text"
                      required
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="w-full bg-[#0D0D0D] border border-[#333333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#007BFF] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Title</label>
                    <input
                      type="text"
                      required
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full bg-[#0D0D0D] border border-[#333333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#007BFF] transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Description</label>
                  <textarea
                    rows="4"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full bg-[#0D0D0D] border border-[#333333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#007BFF] transition-colors"
                  ></textarea>
                </div>

                {/* File Uploads */}
                <div className="bg-[#0D0D0D] p-5 rounded-lg border border-[#333333] space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#C59D5F] mb-1">Update Banner Image (Optional)</label>
                    <p className="text-xs text-[#A0A0A0] mb-2">Leave blank to keep existing banner.</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditBanner(e.target.files[0])}
                      className="w-full text-sm text-[#A0A0A0] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2A2A2A] file:text-white hover:file:bg-[#333333] cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-[#2A2A2A] pt-4">
                    <label className="block text-sm font-medium text-[#C59D5F] mb-1">Update Gallery Images (Optional)</label>
                    <p className="text-xs text-[#A0A0A0] mb-2">Leave blank to keep existing gallery. Uploading new files will REPLACE the old gallery.</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setEditImages(e.target.files)}
                      className="w-full text-sm text-[#A0A0A0] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2A2A2A] file:text-white hover:file:bg-[#333333] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-3 rounded-lg text-white bg-[#2A2A2A] hover:bg-[#333333] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-3 bg-[#007BFF] hover:bg-[#0056b3] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(0,123,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updating ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}