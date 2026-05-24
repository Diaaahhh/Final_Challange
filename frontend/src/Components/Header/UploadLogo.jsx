import React, { useState, useEffect } from "react";
import { FaCloudUploadAlt, FaImage, FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api"; // Adjust this path if necessary
import { IMAGE_BASE_URL } from "../../config"; // Adjust this path if necessary

export default function UploadLogo() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch the current logo when the page loads
  useEffect(() => {
    fetchCurrentLogo();
  }, []);

  const fetchCurrentLogo = async () => {
    try {
      const res = await api.get("/navbar/logo");
      if (res.data.success && res.data.logo) {
        setCurrentLogo(res.data.logo);
      }
    } catch (error) {
      console.error("Failed to fetch current logo", error);
    }
  };

  // Handle file selection and generate a preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Handle the actual upload to the backend
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("logo", selectedFile);

    try {
      const res = await api.post("/settings/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Logo uploaded successfully!");
        setCurrentLogo(res.data.logo); // Update current logo with the new one
        setSelectedFile(null); // Clear selection
        setPreview(null); // Clear preview
        
        // Optional: Force a page reload to update the sidebar logo immediately
        window.location.reload(); 
      } else {
        toast.error(res.data.message || "Upload failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-8 font-['Inter']">
      <div className="max-w-2xl mx-auto bg-[#111111] border border-[#1E1E1E] rounded-xl p-8 shadow-2xl">
        <h2 className="text-3xl font-['Barlow_Condensed'] font-bold mb-6 border-b border-[#1E1E1E] pb-4 flex items-center gap-3">
          <FaImage className="text-[#007BFF]" /> Upload Website Logo
        </h2>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Current Logo Display */}
          {/* <div className="flex-1 bg-[#0A0A0A] p-6 rounded-lg border border-[#1E1E1E] flex flex-col items-center justify-center">
            <p className="text-gray-400 text-sm mb-4">Current Logo</p>
            <div className="w-[150px] h-[150px] p-4 bg-[#111111] rounded border border-[#2A2A2A] flex items-center justify-center">
              {currentLogo ? (
                <img
                  src={`${IMAGE_BASE_URL}/uploads/logo${currentLogo}`}
                  alt="Current Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-500 text-sm">No logo uploaded</span>
              )}
            </div>
          </div> */}

          {/* New Logo Preview */}
          <div className="flex-1 bg-[#0A0A0A] p-6 rounded-lg border border-[#1E1E1E] flex flex-col items-center justify-center">
            <p className="text-gray-400 text-sm mb-4">New Logo Preview</p>
            <div className="w-[150px] h-[150px] p-4 bg-[#111111] rounded border border-dashed border-[#007BFF] flex items-center justify-center">
              {preview ? (
                <img
                  src={preview}
                  alt="New Logo Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-500 text-sm">Select an image</span>
              )}
            </div>
          </div>
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input file-input-bordered file-input-info w-full bg-[#1A1A1A] text-white border-[#2A2A2A]"
          />

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="btn bg-[#007BFF] hover:bg-[#0056b3] text-white border-none w-full text-lg font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <FaCloudUploadAlt size={24} />
            )}
            {isUploading ? "Uploading..." : "Upload & Save Logo"}
          </button>
        </div>
      </div>
    </div>
  );
}