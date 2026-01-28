import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaTimes, FaEye } from "react-icons/fa";

export default function ViewReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the Modal
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get("http://localhost:8081/api/view-reviews");
        setReviews(res.data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Helper to render stars
  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < rating ? "text-amber-500" : "text-gray-600"}
            size={14}
          />
        ))}
      </div>
    );
  };

  // Helper to truncate text
  const truncateText = (text, limit = 50) => {
    if (!text) return "";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-gray-900">
        <span className="loading loading-dots loading-lg text-amber-500"></span>
      </div>
    );
  }

  return (
    <section className="bg-gray-900 py-16 px-6 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <p className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-2">
            Testimonials
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white">
            What Our Customers Say
          </h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* --- TABLE VIEW --- */}
        <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-800 text-amber-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-4 border-b border-gray-700">Date</th>
                <th className="p-4 border-b border-gray-700">Name</th>
                <th className="p-4 border-b border-gray-700">Rating</th>
                <th className="p-4 border-b border-gray-700 w-1/3">Review</th>
                <th className="p-4 border-b border-gray-700 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 text-gray-300 divide-y divide-gray-800">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    No reviews yet. Be the first to write one!
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-800/50 transition-colors duration-200">
                    {/* Date */}
                    <td className="p-4 text-sm font-mono text-gray-500 whitespace-nowrap align-middle">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    
                    {/* Name */}
                    <td className="p-4 font-bold text-white align-middle">
                      {review.name || "Anonymous"}
                    </td>
                    
                    {/* Rating */}
                    <td className="p-4 align-middle">
                      {renderStars(review.rating)}
                    </td>
                    
                    {/* Review Text (Truncated) */}
                    <td className="p-4 text-gray-400 italic align-middle">
                      "{truncateText(review.review_text, 50)}"
                    </td>

                    {/* Action Button */}
                    <td className="p-4 text-center align-middle">
                      <button 
                        onClick={() => setSelectedReview(review)}
                        className="bg-gray-800 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-500/30 p-2 rounded-full transition-all duration-300"
                        title="View Full Review"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL POPUP --- */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedReview(null)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-gray-800 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100">
            
            {/* Modal Header */}
            <div className="bg-gray-900/50 p-6 flex justify-between items-start border-b border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {selectedReview.name || "Anonymous"}
                </h3>
                <p className="text-sm text-gray-500 font-mono">
                  {new Date(selectedReview.created_at).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="mb-4">
                {renderStars(selectedReview.rating)}
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-gray-300 text-lg leading-relaxed italic">
                  "{selectedReview.review_text}"
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-900 p-4 flex justify-end">
              <button 
                onClick={() => setSelectedReview(null)}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold uppercase rounded transition-colors"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}
    </section>
  );
}