import React, { useState } from 'react';
import { FaUtensils, FaDollarSign, FaList, FaEdit, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function CreateMenu() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Form Data State
  const [singleForm, setSingleForm] = useState({ 
    name: '', category: '', price: '', description: '', image: null 
  });

  // --- Handlers ---

  const handleSingleChange = (e) => {
    const { name, value, files } = e.target;
    setSingleForm(prev => ({
      ...prev,
      [name]: name === 'image' ? files[0] : value
    }));
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStatus({ type: 'success', message: 'Menu item added successfully!' });
      // Reset Form
      setSingleForm({ name: '', category: '', price: '', description: '', image: null });
    }, 1500);
  };

  return (
    <section className="space fadeinup">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            
            {/* Main Card */}
            <div className="card w-full bg-base-100 shadow-xl border border-base-200">
              <div className="card-body p-6 md:p-10">
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
                        Add New Menu Item
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Fill in the details below to update your menu</p>
                </div>

                {/* Status Alert */}
                {status.message && (
                    <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'} mb-6 shadow-md`}>
                        {status.type === 'success' ? <FaCheckCircle className="text-white"/> : <FaExclamationTriangle className="text-white"/>}
                        <span className="text-white font-medium">{status.message}</span>
                        <button className="btn btn-xs btn-ghost text-white" onClick={() => setStatus({type:'', message:''})}>✕</button>
                    </div>
                )}

                {/* === SINGLE ITEM FORM === */}
                <form onSubmit={handleSingleSubmit} className="flex flex-col gap-5">
                    
                    {/* 1. Item Name */}
                    <div className="form-control w-full">
                        <label className="label pt-0">
                            <span className="label-text font-bold text-gray-500 uppercase text-xs">Item Name</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="name"
                                value={singleForm.name}
                                onChange={handleSingleChange}
                                placeholder="e.g. Double Cheese Burger" 
                                className="input input-bordered w-full pl-10 focus:input-primary"
                                required 
                            />
                            <span className="absolute left-3 top-3.5 text-gray-400"><FaUtensils /></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* 2. Category */}
                        <div className="form-control w-full">
                            <label className="label pt-0">
                                <span className="label-text font-bold text-gray-500 uppercase text-xs">Category</span>
                            </label>
                            <div className="relative">
                                <select 
                                    name="category"
                                    value={singleForm.category}
                                    onChange={handleSingleChange}
                                    className="select select-bordered w-full pl-10 focus:select-primary appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select Category</option>
                                    <option value="burgers">Burgers</option>
                                    <option value="pizza">Pizza</option>
                                    <option value="drinks">Drinks</option>
                                    <option value="dessert">Dessert</option>
                                </select>
                                <span className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"><FaList /></span>
                            </div>
                        </div>

                        {/* 3. Price */}
                        <div className="form-control w-full">
                            <label className="label pt-0">
                                <span className="label-text font-bold text-gray-500 uppercase text-xs">Price</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    name="price"
                                    value={singleForm.price}
                                    onChange={handleSingleChange}
                                    placeholder="0.00" 
                                    className="input input-bordered w-full pl-10 focus:input-primary"
                                    required 
                                />
                                <span className="absolute left-3 top-3.5 text-gray-400"><FaDollarSign /></span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Description */}
                    <div className="form-control w-full">
                        <label className="label pt-0">
                            <span className="label-text font-bold text-gray-500 uppercase text-xs">Description</span>
                        </label>
                        <div className="relative">
                            <textarea 
                                name="description"
                                value={singleForm.description}
                                onChange={handleSingleChange}
                                className="textarea textarea-bordered w-full pl-10 pt-3 h-24 focus:textarea-primary"
                                placeholder="Short description of the item..."
                            ></textarea>
                            <span className="absolute left-3 top-3.5 text-gray-400"><FaEdit /></span>
                        </div>
                    </div>

                    {/* 5. Image Upload */}
                    <div className="form-control w-full">
                        <label className="label pt-0">
                            <span className="label-text font-bold text-gray-500 uppercase text-xs">Item Image</span>
                        </label>
                        <input 
                            type="file" 
                            name="image"
                            onChange={handleSingleChange}
                            className="file-input file-input-bordered file-input-primary w-full" 
                        />
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className={`btn btn-primary w-full mt-2 text-white uppercase tracking-wider font-bold ${loading ? 'loading' : ''}`}
                    >
                        {loading ? 'Saving Item...' : 'Add Item Now'}
                    </button>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}