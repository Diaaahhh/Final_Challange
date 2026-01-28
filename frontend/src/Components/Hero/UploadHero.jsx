import React, { useState } from "react";
import axios from "axios";
import { FaCloudUploadAlt, FaHeading } from "react-icons/fa";

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
      const res = await axios.post("http://localhost:8081/api/upload-hero", formData, {
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
    <section className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        
        {/* Header */}
        <div className="bg-gray-900 p-6 text-center border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white font-serif">Upload Hero Content</h2>
          <p className="text-gray-400 text-sm mt-1">Add a new main banner to your website</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* 1. Name Input */}
          <div className="space-y-2">
            <label className="text-amber-500 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <FaHeading /> Hero Title / Name
            </label>
            <input 
              type="text" 
              placeholder="Ex: The Flavor of Tradition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* 2. Image Upload */}
          <div className="space-y-2">
            <label className="text-amber-500 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <FaCloudUploadAlt /> Hero Image
            </label>
            
            <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center hover:border-amber-500 transition-colors cursor-pointer bg-gray-900 group">
              <input 
                type="file" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
              
              {preview ? (
                <div className="relative w-full h-48 rounded-md overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="text-center">
                  <FaCloudUploadAlt className="mx-auto text-4xl text-gray-500 group-hover:text-amber-500 transition-colors mb-2" />
                  <p className="text-gray-400 text-sm">Click to upload or drag and drop</p>
                  <p className="text-gray-600 text-xs mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`p-3 rounded text-center text-sm font-bold ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-all shadow-lg shadow-amber-900/20"
          >
            Upload Hero
          </button>

        </form>
      </div>
    </section>
  );
}