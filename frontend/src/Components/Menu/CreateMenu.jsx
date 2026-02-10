import React, { useState, useEffect } from 'react';
import { FaUtensils, FaList, FaEdit, FaCheckCircle, FaExclamationTriangle, FaPlus, FaSave } from 'react-icons/fa';
import api from '../../api';

export default function CreateMenu() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // 1. Dynamic Category State
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Form Data State
  const [singleForm, setSingleForm] = useState({ 
    name: '', categoryCode: '', price: '', description: '', image: null 
  });

  // --- 1. Fetch Categories on Load ---
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  // --- Handlers ---
  const handleSingleChange = (e) => {
    const { name, value, files } = e.target;
    setSingleForm(prev => ({
      ...prev,
      [name]: name === 'image' ? files[0] : value
    }));
  };

  // --- 2. Add New Category (API) ---
  const handleAddCategory = async (e) => {
    e.preventDefault(); 
    if (newCategoryName.trim() === "") return;

    try {
      const res = await api.post('/categories/add', {
        name: newCategoryName
      });

      // Update list with new category from backend response
      const newCat = { 
        id: res.data.id, 
        name: res.data.name, 
        code: res.data.code 
      };

      setCategories([...categories, newCat]);
      
      // Auto-select the new category
      setSingleForm(prev => ({ ...prev, categoryCode: res.data.code }));
      
      setStatus({ type: 'success', message: `Category "${newCategoryName}" added!` });
      setNewCategoryName("");

    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to add category. Name might be duplicate.' });
    }
  };

  // --- 3. Submit Menu Item (API) ---
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const payload = {
        name: singleForm.name,
        category_code: singleForm.categoryCode,
        price: singleForm.price,
        description: singleForm.description
      };

      if(!payload.category_code) throw new Error("Please select a category first.");

      await api.post('/menu/add', payload);

      setStatus({ type: 'success', message: 'Menu item added successfully!' });
      setSingleForm({ name: '', categoryCode: '', price: '', description: '', image: null });

    } catch (err) {
      console.error("Full Error:", err);
      const serverError = err.response?.data?.error || err.message;
      setStatus({ type: 'error', message: `Failed: ${serverError}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space fadeinup py-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          {/* Compact Column Size */}
          <div className="w-full max-w-lg">
            
            {/* Main Card */}
            <div className="card w-full bg-base-100 shadow-xl border border-base-200">
              <div className="card-body p-6">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-base-content uppercase tracking-wide">
                        Add New Menu Item
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Create a new dish for your restaurant</p>
                </div>

                {/* Status Alert */}
                {status.message && (
                    <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'} mb-4 py-2 shadow-sm text-sm flex justify-between`}>
                        <div className="flex items-center gap-2">
                            {status.type === 'success' ? <FaCheckCircle className="text-white"/> : <FaExclamationTriangle className="text-white"/>}
                            <span className="text-white font-medium">{status.message}</span>
                        </div>
                        <button className="btn btn-xs btn-ghost text-white" onClick={() => setStatus({type:'', message:''})}>✕</button>
                    </div>
                )}

                {/* === FORM === */}
                <form onSubmit={handleSingleSubmit} className="flex flex-col gap-4">
                    
                    {/* 1. Item Name */}
                    <div className="form-control w-full">
                        <label className="label pt-0 pb-1">
                            <span className="label-text font-bold text-gray-500 uppercase text-xs">Item Name</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="name"
                                value={singleForm.name}
                                onChange={handleSingleChange}
                                placeholder="e.g. Classic Burger" 
                                className="input input-sm input-bordered w-full pl-9 focus:input-primary"
                                required 
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm"><FaUtensils /></span>
                        </div>
                    </div>

                    {/* 2. Category Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        
                        {/* Select Category */}
                        <div className="form-control w-full">
                            <label className="label pt-0 pb-1">
                                <span className="label-text font-bold text-gray-500 uppercase text-xs">Category</span>
                            </label>
                            <div className="relative">
                                <select 
                                    name="categoryCode"
                                    value={singleForm.categoryCode}
                                    onChange={handleSingleChange}
                                    onClick={fetchCategories} 
                                    className="select select-sm select-bordered w-full pl-9 focus:select-primary appearance-none capitalize"
                                    required
                                >
                                    <option value="" disabled>Select...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.code}>
                                            {cat.name} (Code: {cat.code})
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute left-3 top-2.5 text-gray-400 pointer-events-none text-sm"><FaList /></span>
                            </div>
                        </div>

                        {/* Add New Category */}
                        <div className="form-control w-full">
                            <label className="label pt-0 pb-1">
                                <span className="label-text font-bold text-primary uppercase text-xs">Or Add New</span>
                            </label>
                            <div className="input-group flex">
                                <input 
                                    type="text" 
                                    placeholder="New Category" 
                                    className="input input-sm input-bordered w-full focus:input-primary"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="btn btn-sm btn-square btn-primary text-white"
                                    title="Add Category"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Price (BDT) */}
                    <div className="form-control w-full">
                        <label className="label pt-0 pb-1">
                            <span className="label-text font-bold text-gray-500 uppercase text-xs">Price</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="number" 
                                name="price"
                                value={singleForm.price}
                                onChange={handleSingleChange}
                                placeholder="0.00" 
                                className="input input-sm input-bordered w-full pl-12 focus:input-primary"
                                required 
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold tracking-wider">BDT</span>
                        </div>
                    </div>

                    {/* 4. Description */}
                    <div className="form-control w-full">
                        <label className="label pt-0 pb-1">
                            <span className="label-text font-bold text-gray-500 uppercase text-xs">Description</span>
                        </label>
                        <div className="relative">
                            <textarea 
                                name="description"
                                value={singleForm.description}
                                onChange={handleSingleChange}
                                className="textarea textarea-bordered w-full pl-9 pt-2 h-20 focus:textarea-primary text-sm leading-tight"
                                placeholder="Short description..."
                            ></textarea>
                            <span className="absolute left-3 top-3 text-gray-400 text-sm"><FaEdit /></span>
                        </div>
                    </div>

                    {/* --- FIXED SUBMIT BUTTON --- */}
                    <div className="mt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn btn-primary btn-sm w-full text-black uppercase tracking-wider font-bold h-10 min-h-[2.5rem]"
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="mr-2" /> Save Item
                                </>
                            )}
                        </button>
                    </div>

                </form>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}