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
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex items-center justify-center p-6 font-['Inter']">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Visual/Preview - Styled to match the dark contrast of the Modal/Header theme */}
        <div className="bg-[#1E293B] md:w-2/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
           {/* Abstract decoration similar to the 'Gold' accent */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#C59D5F] rounded-full opacity-10 blur-3xl"></div>
           
           <h2 className="text-3xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider mb-2 z-10">
             About <span className="text-[#C59D5F]">Us</span>
           </h2>
           <p className="text-[#94A3B8] text-sm mb-8 z-10 font-medium tracking-wide">Update the story of your restaurant.</p>

           <div className="w-full aspect-square bg-[#0F172A] rounded-xl border border-[#334155] border-dashed flex items-center justify-center relative overflow-hidden group shadow-inner">
             {preview ? (
               <img src={preview} alt="Preview" className="w-full h-full object-cover" />
             ) : (
               <div className="text-[#64748B] flex flex-col items-center">
                   <FaImage className="text-4xl mb-2 text-[#475569]"/>
                   <span className="text-xs uppercase font-bold tracking-wider">Image Preview</span>
               </div>
             )}
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-3/5 p-8">
            <h3 className="text-2xl font-['Barlow_Condensed'] font-bold text-[#1E293B] uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[#E2E8F0] pb-4">
                <FaPen className="text-[#C59D5F]"/> Edit Content
            </h3>

            {success && (
                <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                    <FaCheckCircle/> Saved successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Heading Input */}
                <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">Heading</label>
                    <input 
                        type="text"
                        className="w-full bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-lg outline-none text-[#1E293B] font-bold focus:border-[#C59D5F] transition-colors placeholder-[#94A3B8]" 
                        placeholder="e.g. Our Culinary Journey"
                        value={heading}
                        onChange={(e) => setHeading(e.target.value)}
                        required
                    />
                </div>

                {/* Text Area */}
                <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">Write Something</label>
                    <textarea 
                        className="w-full bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-lg outline-none text-[#1E293B] text-sm focus:border-[#C59D5F] transition-colors placeholder-[#94A3B8] h-32 leading-relaxed" 
                        placeholder="Tell your story here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                    ></textarea>
                </div>

                {/* File Upload */}
                <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase block mb-1">Upload Image</label>
                    <div className="relative bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-2 hover:bg-[#E2E8F0] transition-colors group">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:uppercase file:bg-[#1E293B] file:text-white hover:file:bg-[#C59D5F] file:transition-colors cursor-pointer"
                        />
                        <FaCloudUploadAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xl pointer-events-none group-hover:text-[#C59D5F] transition-colors"/>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-2 bg-[#C59D5F] hover:bg-[#b08d55] text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest font-['Barlow_Condensed'] shadow-md hover:shadow-lg disabled:opacity-70"
                >
                    {loading ? "Saving..." : "Update Content"}
                </button>

            </form>
        </div>

      </div>
    </div>
  );
}