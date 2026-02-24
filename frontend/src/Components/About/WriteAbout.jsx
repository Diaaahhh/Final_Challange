import React, { useState } from "react";
import { FaPen, FaImage, FaCloudUploadAlt, FaCheckCircle } from "react-icons/fa";
import api from '../../api';

export default function WriteAbout() {
  const [heading, setHeading] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle Image Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData();
    formData.append("heading", heading);
    formData.append("text", text);
    if (file) {
      formData.append("image", file);
    }

    try {
      await api.post("/about/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      alert("Content updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-6 font-['Inter']">
      <div className="max-w-4xl w-full bg-[#111111] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#1E1E1E] overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Visual/Preview */}
        <div className="bg-[#0A0A0A] md:w-2/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border-r border-[#1E1E1E]">
           {/* Neon glow decoration */}
           <div className="absolute top-0 right-0 w-40 h-40 bg-[#007BFF] rounded-full opacity-5 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C59D5F] rounded-full opacity-5 blur-3xl"></div>
           
           <h2 className="text-3xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider mb-2 z-10">
             About <span className="text-[#007BFF]">Us</span>
           </h2>
           <p className="text-[#A0A0A0] text-sm mb-8 z-10 font-medium tracking-wide">Update the story of your restaurant.</p>

           <div className="w-full aspect-square bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] border-dashed flex items-center justify-center relative overflow-hidden group shadow-inner">
             {preview ? (
               <img src={preview} alt="Preview" className="w-full h-full object-cover" />
             ) : (
               <div className="text-[#444] flex flex-col items-center">
                   <FaImage className="text-4xl mb-2 text-[#333]"/>
                   <span className="text-xs uppercase font-bold tracking-wider text-[#555]">Image Preview</span>
               </div>
             )}
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-3/5 p-8">
            <h3 className="text-2xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[#1E1E1E] pb-4">
                <FaPen className="text-[#007BFF]"/> Edit Content
            </h3>

            {success && (
                <div className="mb-6 bg-[#007BFF]/10 border border-[#007BFF]/30 text-[#007BFF] px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                    <FaCheckCircle/> Saved successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Heading Input */}
                <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase block mb-2 tracking-wider">Heading</label>
                    <input 
                        type="text"
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] p-3 rounded-lg outline-none text-white text-sm font-medium focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444]" 
                        placeholder="e.g. Our Culinary Journey"
                        value={heading}
                        onChange={(e) => setHeading(e.target.value)}
                        required
                    />
                </div>

                {/* Text Area */}
                <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase block mb-2 tracking-wider">Write Something</label>
                    <textarea 
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] p-3 rounded-lg outline-none text-white text-sm focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444] h-32 leading-relaxed" 
                        placeholder="Tell your story here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                    ></textarea>
                </div>

                {/* File Upload */}
                <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase block mb-2 tracking-wider">Upload Image</label>
                    <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2 hover:border-[#007BFF] transition-colors group">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-[#A0A0A0] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:uppercase file:bg-[#007BFF] file:text-white hover:file:bg-[#C59D5F] file:transition-colors cursor-pointer"
                        />
                        <FaCloudUploadAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] text-xl pointer-events-none group-hover:text-[#007BFF] transition-colors"/>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-2 bg-[#007BFF] hover:bg-[#0066e6] text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest font-['Barlow_Condensed'] shadow-[0_0_20px_rgba(0,123,255,0.3)] hover:shadow-[0_0_30px_rgba(0,123,255,0.5)] disabled:opacity-50 text-base"
                >
                    {loading ? "Saving..." : "Update Content"}
                </button>

            </form>
        </div>

      </div>
    </div>
  );
}