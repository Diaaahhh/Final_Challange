import React, { useEffect, useState } from "react";
import { FaUtensils, FaDollarSign, FaList, FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';

// Mock data to simulate database - replace this with your actual axios.get() call
const MOCK_DATA = [
  { id: 1, name: "Classic Cheese Burger", category: "burgers", price: 12.99, description: "Juicy beef patty with cheddar cheese.", image: "https://via.placeholder.com/150" },
  { id: 2, name: "Pepperoni Pizza", category: "pizza", price: 15.50, description: "Crispy crust loaded with pepperoni.", image: "https://via.placeholder.com/150" },
  { id: 3, name: "Iced Lemon Tea", category: "drinks", price: 4.99, description: "Refreshing tea with a hint of lemon.", image: "https://via.placeholder.com/150" },
];

export default function MenuList() {
  const [menuItems, setMenuItems] = useState([]);
  
  // Selection State
  const [checkedItems, setCheckedItems] = useState([]);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 1. Fetch Data on Load
  useEffect(() => {
    // In real app: const res = await axios.get("http://localhost:8081/api/get-menu");
    // setMenuItems(res.data);
    setMenuItems(MOCK_DATA);
  }, []);

  // 2. Handle "Select All"
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = menuItems.map((item) => item.id);
      setCheckedItems(allIds);
    } else {
      setCheckedItems([]);
    }
  };

  // 3. Handle Single Selection
  const handleSelectOne = (id) => {
    if (checkedItems.includes(id)) {
      setCheckedItems(checkedItems.filter((itemId) => itemId !== id));
    } else {
      setCheckedItems([...checkedItems, id]);
    }
  };

  // 4. Handle View/Edit (Opens Modal)
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setOpenModal(true);
  };

  // 5. Handle Delete (Bulk Action)
  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${checkedItems.length} items?`)) {
      setMenuItems(menuItems.filter(item => !checkedItems.includes(item.id)));
      setCheckedItems([]);
    }
  };

  return (
    <section className="space fadeinup">
      <div className="card w-full bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
                <h2 className="card-title text-2xl font-bold">
                    <span className="text-theme"><FaUtensils className="inline mr-2"/></span>
                    Menu List
                </h2>
                <p className="text-gray-500 text-sm mt-1">Manage your restaurant food items</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 md:mt-0">
                <button className="btn btn-ghost btn-circle">
                    <FaSearch />
                </button>
                {checkedItems.length > 0 && (
                    <button 
                        onClick={handleBulkDelete}
                        className="btn btn-error text-white btn-sm animate-pulse"
                    >
                        <FaTrash className="mr-2"/> Delete ({checkedItems.length})
                    </button>
                )}
            </div>
          </div>
          
          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              {/* Table Head */}
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
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody>
                {menuItems.length > 0 ? (
                  menuItems.map((item) => (
                    <tr key={item.id} className="hover">
                      {/* Checkbox */}
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
                      
                      {/* Image (Avatar Style) */}
                      <td>
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img src={item.image} alt={item.name} />
                          </div>
                        </div>
                      </td>
                      
                      {/* Name */}
                      <td className="font-bold">
                        {item.name}
                      </td>
                      
                      {/* Category */}
                      <td>
                        <div className="badge badge-outline badge-primary capitalize">
                            {item.category}
                        </div>
                      </td>
                      
                      {/* Price */}
                      <td className="font-mono text-success font-bold">
                        ${item.price.toFixed(2)}
                      </td>
                      
                      {/* Description (Truncated) */}
                      <td className="max-w-xs truncate text-gray-500 text-sm" title={item.description}>
                        {item.description}
                      </td>
                      
                      {/* Actions */}
                      <td>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleViewDetails(item)}
                                className="btn btn-square btn-ghost btn-sm text-info tooltip" 
                                data-tip="View Details"
                            >
                                <FaEye />
                            </button>
                            <button className="btn btn-square btn-ghost btn-sm text-warning tooltip" data-tip="Edit">
                                <FaEdit />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                        <div className="flex flex-col items-center">
                            <FaList className="text-4xl mb-2 opacity-20"/>
                            No menu items found. Add one to get started.
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL (Details View) */}
      <div className={`modal ${openModal ? "modal-open" : ""}`}>
        <div className="modal-box relative">
          <button 
            onClick={() => setOpenModal(false)}
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >✕</button>
          
          {selectedItem && (
            <>
                <h3 className="text-lg font-bold border-b pb-2 mb-4">Item Details</h3>
                
                <div className="flex flex-col gap-4">
                    <img 
                        src={selectedItem.image} 
                        alt={selectedItem.name} 
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs uppercase text-gray-400 font-bold">Item Name</span>
                            <p className="font-bold text-lg">{selectedItem.name}</p>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-gray-400 font-bold">Price</span>
                            <p className="font-bold text-success text-lg"><FaDollarSign className="inline mb-1"/>{selectedItem.price}</p>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-gray-400 font-bold">Category</span>
                            <p className="badge badge-primary mt-1">{selectedItem.category}</p>
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs uppercase text-gray-400 font-bold">Description</span>
                        <p className="text-gray-600 bg-base-200 p-3 rounded-md mt-1 text-sm">
                            {selectedItem.description}
                        </p>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={() => setOpenModal(false)}>Close</button>
                    <button className="btn btn-primary"><FaEdit className="mr-2"/> Edit Item</button>
                </div>
            </>
          )}
        </div>
        {/* Backdrop */}
        <div className="modal-backdrop" onClick={() => setOpenModal(false)}></div>
      </div>
    </section>
  );
}