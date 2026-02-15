import React, { useState } from "react";
import { FaCloudUploadAlt, FaHeading } from "react-icons/fa";
import api from "../../api";

export default function UploadHero() {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState(null);

  // Handle File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Create a preview URL for the image
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !file) {
      setMessage({ type: "error", text: "Please provide both a name and an image." });
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", file);

    try {
      const res = await api.post("/upload-hero", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Hero section updated successfully!" });
      
      // Reset Form
      setName("");
      setFile(null);
      setPreview(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Upload failed. Please try again." });
    }
  };

  return (
    <section className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E2E8F0]">
        
        {/* Header */}
        <div className="bg-[#F1F5F9] p-8 text-center border-b border-[#E2E8F0]">
          <h2 className="text-3xl font-bold text-[#1E293B] font-['Barlow_Condensed'] uppercase tracking-wider">
            Upload Hero Content
          </h2>
          <p className="text-[#64748B] text-sm mt-2 font-medium tracking-wide">
            Add a new main banner to your website
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* 1. Name Input */}
          <div className="space-y-2">
            <label className="text-xs text-[#64748B] uppercase font-bold tracking-wide flex items-center gap-2">
              <FaHeading className="text-[#C59D5F]" /> Hero Title / Name
            </label>
            <input 
              type="text" 
              placeholder="Ex: The Flavor of Tradition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] rounded-lg p-3 focus:outline-none focus:border-[#C59D5F] transition-colors placeholder-gray-400 font-medium"
            />
          </div>

          {/* 2. Image Upload */}
          <div className="space-y-2">
            <label className="text-xs text-[#64748B] uppercase font-bold tracking-wide flex items-center gap-2">
              <FaCloudUploadAlt className="text-[#C59D5F]" /> Hero Image
            </label>
            
            <div className="relative border-2 border-dashed border-[#CBD5E1] rounded-xl p-6 flex flex-col items-center justify-center hover:border-[#C59D5F] transition-colors cursor-pointer bg-[#F8FAFC] group">
              <input 
                type="file" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
              
              {preview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-sm border border-[#E2E8F0]">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="text-center">
                  <FaCloudUploadAlt className="mx-auto text-4xl text-[#94A3B8] group-hover:text-[#C59D5F] transition-colors mb-3" />
                  <p className="text-[#64748B] text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-[#94A3B8] text-xs mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`p-3 rounded-lg text-center text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-[#1E293B] hover:bg-[#C59D5F] text-white font-bold py-4 rounded-xl uppercase tracking-widest text-sm font-['Barlow_Condensed'] transition-all duration-300 shadow-md"
          >
            Upload Hero
          </button>

        </form>
      </div>
    </section>
  );
}