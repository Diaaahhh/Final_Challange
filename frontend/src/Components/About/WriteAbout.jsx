import React, { useState } from "react";
import axios from "axios";
import { FaPen, FaImage, FaCloudUploadAlt, FaCheckCircle } from "react-icons/fa";

export default function WriteAbout() {
  const [heading, setHeading] = useState(""); // Added Heading State
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
    formData.append("heading", heading); // Append Heading
    formData.append("text", text);
    if (file) {
      formData.append("image", file);
    }

    try {
      await axios.post("http://localhost:8081/api/about/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      alert("Content updated successfully!");
      
      // REMOVED: setText(""), setHeading(""), etc.
      // The form will now remain filled.

    } catch (err) {
      console.error(err);
      alert("Failed to upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        
        {/* Left Side: Visual/Preview */}
        <div className="bg-gray-900 md:w-2/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full opacity-10 blur-3xl"></div>
           
           <h2 className="text-2xl font-bold text-amber-500 mb-4 z-10">About Us Content</h2>
           <p className="text-gray-400 text-sm mb-8 z-10">Update the story of your restaurant.</p>

           <div className="w-full aspect-square bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center relative overflow-hidden group">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                    <FaImage className="text-4xl mb-2 text-gray-600"/>
                    <span className="text-xs">Image Preview</span>
                </div>
              )}
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-3/5 p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaPen className="text-amber-600"/> Edit Content
            </h3>

            {success && (
                <div className="mb-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <FaCheckCircle/> Saved successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Heading Input (New) */}
                <div className="form-control">
                    <label className="label text-xs font-bold text-gray-500 uppercase mb-2">Heading</label>
                    <input 
                        type="text"
                        className="input input-bordered w-full focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white-700 px-4 py-2 border rounded-lg" 
                        placeholder="e.g. Our Culinary Journey"
                        value={heading}
                        onChange={(e) => setHeading(e.target.value)}
                        required
                    />
                </div>

                {/* Text Area */}
                <div className="form-control">
                    <label className="label text-xs font-bold text-gray-500 uppercase mb-2">Write Something</label>
                    <textarea 
                        className="textarea textarea-bordered h-32 w-full focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white-700 p-3 border rounded-lg" 
                        placeholder="Tell your story here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                    ></textarea>
                </div>

                {/* File Upload */}
                <div className="form-control">
                    <label className="label text-xs font-bold text-gray-500 uppercase mb-2">Upload Image</label>
                    <div className="relative border border-gray-300 rounded-lg p-2 bg-gray-50 hover:bg-white transition-colors">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input file-input-ghost w-full file-input-sm text-sm text-gray-600"
                        />
                        <FaCloudUploadAlt className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="btn w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg shadow-md transition-all"
                >
                    {loading ? "Saving..." : "Update Content"}
                </button>

            </form>
        </div>

      </div>
    </div>
  );
}