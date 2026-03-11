import React, { useState } from 'react';
import { FaFolderPlus, FaImage, FaImages, FaExclamationTriangle, FaTrashAlt, FaCloudUploadAlt } from 'react-icons/fa';
import api from '../../api'; // Assuming you have your axios api instance setup
import { toast } from 'react-toastify'; // Optional: for nice notifications

export default function CreatePortfolio() {
    // Form State
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
    });
    
    // File State
    const [bannerFile, setBannerFile] = useState(null);
    const [projectImages, setProjectImages] = useState([]);
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fileWarnings, setFileWarnings] = useState({ banner: '', images: '' });

    const categories = ["Restaurant", "Food", "Events"];
    const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB

    // Handle Text Inputs
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ==========================================
    // File Validation & Handling
    // ==========================================
    
    // Handle Single Banner Upload
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        setFileWarnings({ ...fileWarnings, banner: '' }); // Clear previous warning

        if (file) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setFileWarnings({ ...fileWarnings, banner: 'Banner image exceeds 1MB limit. Please choose a smaller file.' });
                setBannerFile(null); // Reset file state
                e.target.value = null; // Clear input element
                return;
            }
            setBannerFile(file);
        }
    };

    // Handle Multiple Images Upload
    const handleImagesChange = (e) => {
        const chosenFiles = Array.from(e.target.files);
        setFileWarnings({ ...fileWarnings, images: '' }); // Clear previous warning
        
        let validFiles = [];
        let hasError = false;

        chosenFiles.forEach(file => {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                hasError = true;
            } else {
                validFiles.push(file);
            }
        });

        if (hasError) {
            setFileWarnings({ ...fileWarnings, images: 'One or more project images exceed the 1MB limit and were removed.' });
        }

        setProjectImages(validFiles); // Replacing for simplicity
    };

    // ==========================================
    // Form Submission (Using FormData)
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Basic Client-side validation
        if (!formData.category || !formData.title || !bannerFile) {
            setError('Category, Title, and Banner image are required.');
            setLoading(false);
            return;
        }

        // Create FormData object for multipart/form-data submission
        const data = new FormData();
        data.append('category', formData.category);
        data.append('title', formData.title);
        data.append('description', formData.description);
        
        // Append Single File
        data.append('banner', bannerFile);

        // Append Multiple Files (loop through array)
        projectImages.forEach((image) => {
            data.append('images', image); 
        });

        try {
            // Send POST request
            const response = await api.post('/portfolio/create', data, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Required for file uploads
                }
            });

            if (response.data.status) {
                setSuccess('Gallery item created successfully!');
                // Reset Form
                setFormData({ category: '', title: '', description: '' });
                setBannerFile(null);
                setProjectImages([]);
                // Clear file inputs on page
                document.getElementById('bannerInput').value = null;
                document.getElementById('imagesInput').value = null;
                if(window.toast) toast.success("Success!");
            } else {
                setError(response.data.message || 'Failed to create gallery item.');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'An error occurred during submission.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Main Wrapper - Dark Background (#0D0D0D)
        <div className="bg-[#0D0D0D] min-h-screen pb-20 pt-10 px-6 font-sans text-[#E0E0E0]">
            {/* Card Container - Dark Gray (#1E1E1E) with border (#2A2A2A) */}
            <div className="max-w-5xl mx-auto bg-[#1E1E1E] rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#2A2A2A] overflow-hidden">
                
                {/* Header */}
                <div className="bg-[#1A1A1A] p-8 text-center border-b border-[#2A2A2A]">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0D0D0D] border border-[#2A2A2A] mb-4 text-[#C59D5F] shadow-[0_0_10px_rgba(197,157,95,0.2)]">
                        <FaFolderPlus size={30} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-['Barlow_Condensed'] font-bold text-[#E0E0E0] uppercase tracking-widest">
                        Create New <span className="text-[#C59D5F]">Gallery </span>
                    </h1>
                    <p className="text-[#A0A0A0] text-sm mt-2 max-w-xl mx-auto">Add showcase items, past events, or new culinary creations to your website's gallery.</p>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8" encType="multipart/form-data">
                    
                    {/* Status Messages - Adjusted for Dark Mode */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
                            <FaExclamationTriangle className="shrink-0" />
                            <p className="font-medium text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-900/20 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center gap-3">
                            <FaCloudUploadAlt className="shrink-0" />
                            <p className="font-medium text-sm">{success}</p>
                        </div>
                    )}

                    {/* Standard Text Fields */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Category Dropdown */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider ml-1">Category</label>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleInputChange} 
                                className="w-full px-5 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E0E0E0] focus:ring-2 focus:ring-[#007BFF]/30 focus:border-[#007BFF] transition-all outline-none"
                                required
                            >
                                <option value="" disabled className="text-[#A0A0A0]">Select a Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider ml-1">Title</label>
                            <input 
                                type="text" 
                                name="title" 
                                value={formData.title} 
                                onChange={handleInputChange} 
                                placeholder="E.g., Corporate Gala Night 2024" 
                                className="w-full px-5 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E0E0E0] placeholder-[#666666] focus:ring-2 focus:ring-[#007BFF]/30 focus:border-[#007BFF] transition-all outline-none"
                                required 
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider ml-1">Description (Optional)</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleInputChange} 
                            placeholder="Provide details about the event, dish, or project..." 
                            rows="5" 
                            className="w-full px-5 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E0E0E0] placeholder-[#666666] focus:ring-2 focus:ring-[#007BFF]/30 focus:border-[#007BFF] transition-all outline-none"
                        ></textarea>
                    </div>

                    {/* File Uploads Section */}
                    <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-[#2A2A2A]">
                        {/* Banner Image Upload (Single) */}
                        <div className="space-y-4 bg-[#1A1A1A] p-6 rounded-xl border border-[#2A2A2A]">
                            <div className="flex items-center gap-3">
                                <FaImage className="text-[#007BFF]" />
                                <h3 className="text-lg font-bold text-[#E0E0E0]">Main Banner Image</h3>
                            </div>
                            <p className="text-xs text-[#A0A0A0]">Primary image shown in gallery listings. Must be under <span className="font-bold text-[#C59D5F]">1MB</span>.</p>
                            
                            <input 
                                id="bannerInput"
                                type="file" 
                                accept="image/*" 
                                onChange={handleBannerChange} 
                                className="w-full text-sm text-[#A0A0A0] file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-[#2A2A2A] file:text-[#007BFF] hover:file:bg-[#333333] cursor-pointer outline-none"
                                required
                            />
                            
                            {/* Banner File Validation Warning */}
                            {fileWarnings.banner && (
                                <div className="text-xs text-red-400 font-medium flex items-center gap-2 bg-red-900/20 border border-red-500/20 p-2 rounded-lg">
                                    <FaExclamationTriangle /> {fileWarnings.banner}
                                </div>
                            )}
                        </div>

                        {/* Project Images Upload (Multiple) */}
                        <div className="space-y-4 bg-[#1A1A1A] p-6 rounded-xl border border-[#2A2A2A]">
                            <div className="flex items-center gap-3">
                                <FaImages className="text-[#007BFF]" />
                                <h3 className="text-lg font-bold text-[#E0E0E0]">Gallery Images</h3>
                            </div>
                            <p className="text-xs text-[#A0A0A0]">Upload multiple images. Each must be under <span className="font-bold text-[#C59D5F]">1MB</span>.</p>
                            
                            <input 
                                id="imagesInput"
                                type="file" 
                                accept="image/*" 
                                multiple 
                                onChange={handleImagesChange} 
                                className="w-full text-sm text-[#A0A0A0] file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-[#2A2A2A] file:text-[#007BFF] hover:file:bg-[#333333] cursor-pointer outline-none"
                            />

                            {/* Images File Validation Warning */}
                            {fileWarnings.images && (
                                <div className="text-xs text-red-400 font-medium flex items-center gap-2 bg-red-900/20 border border-red-500/20 p-2 rounded-lg">
                                    <FaExclamationTriangle /> {fileWarnings.images}
                                </div>
                            )}
                            
                            {/* Preview Selected Images Count */}
                            {projectImages.length > 0 && (
                                <div className="text-xs font-medium text-[#007BFF] px-3 py-1 bg-[#007BFF]/10 border border-[#007BFF]/30 inline-block rounded-full">
                                    {projectImages.length} images selected.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-8 border-t border-[#2A2A2A] text-right">
                        <button 
                            type="submit" 
                            disabled={loading || fileWarnings.banner} 
                            className="inline-flex items-center gap-3 px-8 py-3 bg-[#007BFF] text-white font-bold uppercase tracking-widest rounded transition-all hover:bg-[#0066e6] shadow-[0_0_10px_rgba(0,123,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group font-['Barlow_Condensed'] text-lg border border-[#007BFF]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <FaCloudUploadAlt className="text-xl group-hover:-translate-y-1 transition-transform" />
                                    Publish to Gallery
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}