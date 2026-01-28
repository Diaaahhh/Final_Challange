import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUtensils, FaDollarSign, FaList, FaEdit, FaTrash, FaEye, FaSearch, FaSave, FaTimes } from 'react-icons/fa';

export default function MenuList() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]); // For Edit Dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Selection State
  const [checkedItems, setCheckedItems] = useState([]);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'view' or 'edit'
  
  // Editing State
  const [currentItem, setCurrentItem] = useState(null); // The original item data
  const [editFormData, setEditFormData] = useState({
    name: "",
    categoryCode: "",
    price: "",
    description: ""
  });

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        axios.get("http://localhost:8081/api/menu/list"),
        axios.get("http://localhost:8081/api/categories")
      ]);
      setMenuItems(menuRes.data);
      setCategories(catRes.data);
      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load menu data.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setCheckedItems(menuItems.map((item) => item.id));
    } else {
      setCheckedItems([]);
    }
  };

  const handleSelectOne = (id) => {
    if (checkedItems.includes(id)) {
      setCheckedItems(checkedItems.filter((itemId) => itemId !== id));
    } else {
      setCheckedItems([...checkedItems, id]);
    }
  };

  // 3. Modal Handlers
  const openViewModal = (item) => {
    setCurrentItem(item);
    setModalMode("view");
    setOpenModal(true);
  };

  // Inside MenuList.jsx

  const openEditModal = (item) => {
    setCurrentItem(item);
    
    // SAFETY CHECK: 
    // If the item's category_id doesn't match any loaded category, 
    // default to the first available category in the list.
    const isValidCategory = categories.some(cat => cat.code === item.category_id);
    const defaultCategory = categories.length > 0 ? categories[0].code : "";
    
    setEditFormData({
      name: item.name,
      // If valid, use it. If not, use the first one in the list.
      categoryCode: isValidCategory ? item.category_id : defaultCategory, 
      price: item.price,
      description: item.description
    });
    
    setModalMode("edit");
    setOpenModal(true);
  };

  // 4. Update Functionality
  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

 // Inside MenuList.jsx

  const handleUpdate = async () => {
    try {
      // Create a clean payload object
      const payload = {
        name: editFormData.name,
        category_code: editFormData.categoryCode, // Ensure this matches backend expected key
        price: editFormData.price,
        description: editFormData.description
      };

      console.log("Sending Update Payload:", payload); // Debug log in Browser Console (F12)

      await axios.put(`http://localhost:8081/api/menu/update/${currentItem.id}`, payload);
      
      alert("Item updated successfully!");
      setOpenModal(false);
      fetchData(); // Refresh the list to show changes
    } catch (err) {
      console.error("Update Failed:", err); // See full error in console
      alert(`Failed to update item: ${err.response?.data?.error || err.message}`);
    }
  };

  // 5. Delete Functionality
  const handleDelete = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} items?`)) return;

    try {
      await axios.post("http://localhost:8081/api/menu/delete", { ids: ids });
      setMenuItems(menuItems.filter(item => !ids.includes(item.id)));
      setCheckedItems(checkedItems.filter(id => !ids.includes(id))); // Clear deleted from selection
    } catch (err) {
      alert("Failed to delete items.");
    }
  };

  return (
    <section className="space fadeinup">
      <div className="card w-full bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
                <h2 className="card-title text-2xl font-bold">
                    <span className="text-theme"><FaUtensils className="inline mr-2"/></span>
                    Menu List
                </h2>
                <p className="text-gray-500 text-sm mt-1">Manage your restaurant food items</p>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
                <button className="btn btn-ghost btn-circle">
                    <FaSearch />
                </button>
                {checkedItems.length > 0 && (
                    <button 
                        onClick={() => handleDelete(checkedItems)}
                        className="btn btn-error text-white btn-sm animate-pulse"
                    >
                        <FaTrash className="mr-2"/> Delete ({checkedItems.length})
                    </button>
                )}
            </div>
          </div>

          {error && <div className="alert alert-error text-white mb-4">{error}</div>}
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200 uppercase text-xs">
                <tr>
                  <th className="w-12">
                    <label>
                      <input 
                        type="checkbox" 
                        className="checkbox checkbox-primary checkbox-sm"
                        onChange={handleSelectAll}
                        checked={menuItems.length > 0 && checkedItems.length === menuItems.length}
                      />
                    </label>
                  </th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              
              <tbody>
                {loading ? (
                    <tr><td colSpan="6" className="text-center py-10">Loading Data...</td></tr>
                ) : menuItems.length > 0 ? (
                  menuItems.map((item) => (
                    <tr key={item.id} className="hover">
                      <th>
                        <label>
                          <input 
                            type="checkbox" 
                            className="checkbox checkbox-primary checkbox-sm"
                            onChange={() => handleSelectOne(item.id)}
                            checked={checkedItems.includes(item.id)}
                          />
                        </label>
                      </th>
                      
                      <td className="font-bold">
                        {item.name}
                        <div className="text-xs text-gray-400 font-normal md:hidden truncate max-w-[100px]">
                            {item.description}
                        </div>
                      </td>
                      
                      <td>
                        <div className="badge badge-outline badge-primary capitalize">
                            {item.category_name || "Uncategorized"}
                        </div>
                      </td>
                      
                      <td className="font-mono text-success font-bold">
                        ${Number(item.price).toFixed(2)}
                      </td>

                      <td>
                        <span className="badge badge-ghost text-xs">{item.code}</span>
                      </td>
                      
                      <td>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => openViewModal(item)}
                                className="btn btn-square btn-ghost btn-sm text-info tooltip" 
                                data-tip="View Details"
                            >
                                <FaEye />
                            </button>
                            <button 
                                onClick={() => openEditModal(item)}
                                className="btn btn-square btn-ghost btn-sm text-warning tooltip" 
                                data-tip="Edit"
                            >
                                <FaEdit />
                            </button>
                            <button 
                                onClick={() => handleDelete([item.id])}
                                className="btn btn-square btn-ghost btn-sm text-error tooltip" 
                                data-tip="Delete"
                            >
                                <FaTrash />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                        <div className="flex flex-col items-center">
                            <FaList className="text-4xl mb-2 opacity-20"/>
                            No menu items found.
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* UNIVERSAL MODAL (Handles View & Edit) */}
      <div className={`modal ${openModal ? "modal-open" : ""}`}>
        <div className="modal-box relative">
          <button 
            onClick={() => setOpenModal(false)}
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >✕</button>
          
          {currentItem && (
            <>
                <h3 className="text-lg font-bold border-b pb-2 mb-4">
                    {modalMode === 'view' ? 'Item Details' : 'Edit Item'} 
                    <span className="text-gray-400 text-sm font-normal ml-2">#{currentItem.code}</span>
                </h3>
                
                {/* VIEW MODE */}
                {modalMode === 'view' ? (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs uppercase text-gray-400 font-bold">Item Name</span>
                                <p className="font-bold text-lg">{currentItem.name}</p>
                            </div>
                            <div>
                                <span className="text-xs uppercase text-gray-400 font-bold">Price</span>
                                <p className="font-bold text-success text-lg">
                                    <FaDollarSign className="inline mb-1"/>
                                    {Number(currentItem.price).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs uppercase text-gray-400 font-bold">Category</span>
                                <p className="badge badge-primary mt-1">{currentItem.category_name}</p>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-gray-400 font-bold">Description</span>
                            <p className="text-gray-600 bg-base-200 p-3 rounded-md mt-1 text-sm">
                                {currentItem.description || "No description."}
                            </p>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setOpenModal(false)}>Close</button>
                            <button className="btn btn-primary" onClick={() => setModalMode('edit')}>
                                <FaEdit className="mr-2"/> Edit This Item
                            </button>
                        </div>
                    </div>
                ) : (
                    // EDIT MODE
                    <div className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Name</span></label>
                            <input 
                                type="text" 
                                name="name" 
                                value={editFormData.name} 
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">Category</span></label>
                                <select 
                                    name="categoryCode"
                                    value={editFormData.categoryCode}
                                    onChange={handleEditChange}
                                    className="select select-bordered w-full"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.code}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Price</span></label>
                                <input 
                                    type="number" 
                                    name="price" 
                                    value={editFormData.price} 
                                    onChange={handleEditChange}
                                    className="input input-bordered w-full"
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text">Description</span></label>
                            <textarea 
                                name="description"
                                value={editFormData.description}
                                onChange={handleEditChange}
                                className="textarea textarea-bordered h-24"
                            ></textarea>
                        </div>

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setModalMode('view')}>Back</button>
                            <button className="btn btn-success text-white" onClick={handleUpdate}>
                                <FaSave className="mr-2"/> Save Changes
                            </button>
                        </div>
                    </div>
                )}
            </>
          )}
        </div>
        <div className="modal-backdrop" onClick={() => setOpenModal(false)}></div>
      </div>
    </section>
  );
}