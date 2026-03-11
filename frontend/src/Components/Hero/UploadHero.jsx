import React, { useState } from "react";
import { FaCloudUploadAlt, FaHeading, FaCheckCircle } from "react-icons/fa";
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

      setMessage({ type: "success", text: "Home section updated successfully!" });
      
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
    <section className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-lg bg-[#111111] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden border border-[#1E1E1E]">
        
        {/* Header */}
        <div className="bg-[#0A0A0A] p-8 text-center border-b border-[#1E1E1E] relative overflow-hidden">
          {/* Neon blue glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-[#007BFF] opacity-5 blur-3xl rounded-full pointer-events-none"></div>
          <h2 className="text-3xl font-bold text-white font-['Barlow_Condensed'] uppercase tracking-wider relative z-10">
            Upload <span className="text-[#007BFF]">Home</span> Content
          </h2>
          <p className="text-[#A0A0A0] text-sm mt-2 font-medium tracking-wide relative z-10">
            Add a new main banner to your website
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* 1. Name Input */}
          <div className="space-y-2">
            <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-widest flex items-center gap-2">
              <FaHeading className="text-[#007BFF]" /> Title / Name
            </label>
            <input 
              type="text" 
              placeholder="Ex: The Flavor of Tradition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white border border-[#2A2A2A] rounded-lg p-3 focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444] font-medium text-sm"
            />
          </div>

          {/* 2. Image Upload */}
          <div className="space-y-2">
            <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-widest flex items-center gap-2">
              <FaCloudUploadAlt className="text-[#007BFF]" /> Image
            </label>
            
            <div className="relative border-2 border-dashed border-[#2A2A2A] rounded-xl p-6 flex flex-col items-center justify-center hover:border-[#007BFF] transition-all duration-300 cursor-pointer bg-[#1A1A1A] group hover:shadow-[0_0_20px_rgba(0,123,255,0.1)]">
              <input 
                type="file" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
              
              {preview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-sm border border-[#2A2A2A]">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  {/* Neon overlay hint */}
                  <div className="absolute inset-0 bg-[#007BFF] opacity-0 group-hover:opacity-5 transition-opacity"></div>
                </div>
              ) : (
                <div className="text-center">
                  <FaCloudUploadAlt className="mx-auto text-5xl text-[#333] group-hover:text-[#007BFF] transition-colors mb-3" />
                  <p className="text-[#A0A0A0] text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-[#555] text-xs mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`p-3 rounded-lg text-center text-sm font-bold border flex items-center justify-center gap-2 ${
              message.type === 'success' 
                ? 'bg-[#007BFF]/10 text-[#007BFF] border-[#007BFF]/30' 
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              {message.type === 'success' && <FaCheckCircle />}
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-[#007BFF] hover:bg-[#0066e6] text-white font-bold py-4 rounded-xl uppercase tracking-widest text-sm font-['Barlow_Condensed'] transition-all duration-300 shadow-[0_0_20px_rgba(0,123,255,0.3)] hover:shadow-[0_0_35px_rgba(0,123,255,0.5)] transform active:scale-95"
          >
            Upload Banner
          </button>

        </form>
      </div>
    </section>
  );
}