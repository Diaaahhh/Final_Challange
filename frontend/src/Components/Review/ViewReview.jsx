import React, { useEffect, useState } from "react";
import { FaStar, FaTimes, FaEye, FaQuoteLeft } from "react-icons/fa";
import api from "../../api";

export default function ViewReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get("/view-reviews");
        setReviews(res.data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < rating ? "text-[#C59D5F]" : "text-[#333]"}
            size={14}
          />
        ))}
      </div>
    );
  };

  const truncateText = (text, limit = 50) => {
    if (!text) return "";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  const formatDateDDMMYY = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto max-w-7xl">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#1E1E1E] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold  text-white">
              Customer<span className="text-[#007BFF]">Reviews</span>
            </h1>
            <p className="text-[#A0A0A0] text-sm mt-2 font-medium tracking-wide">
              What our customers are saying
            </p>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0 items-center">
             <div className="bg-[#111111] border border-[#2A2A2A] px-4 py-2 rounded-lg shadow-sm text-sm font-bold">
                <span className="text-[#A0A0A0] mr-2">Total:</span>
                <span className="text-[#007BFF]">{reviews.length}</span>
             </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-[#111111] rounded-xl border border-[#1E1E1E] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0A0A0A] text-[#A0A0A0] text-xs  tracking-wider font-['Barlow_Condensed'] border-b border-[#1E1E1E]">
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 w-1/3">Review Preview</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#007BFF] font-bold tracking-widest">
                      Loading Reviews...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#555]">
                      <div className="flex flex-col items-center">
                         <FaQuoteLeft className="text-4xl mb-3 opacity-20" /> 
                         <span className="text-[#A0A0A0]">No reviews yet. Be the first to write one!</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-[#1A1A1A] transition-colors group">
                      {/* Date */}
                      <td className="p-4 text-sm text-[#A0A0A0] font-mono whitespace-nowrap align-middle">
                        {formatDateDDMMYY(review.created_at)}
                      </td>
                      
                      {/* Name */}
                      <td className="p-4 align-middle">
                        <div className="font-bold text-white font-['Barlow_Condensed'] text-lg tracking-wide ">
                          {review.name || "Anonymous"}
                        </div>
                      </td>
                      
                      {/* Rating */}
                      <td className="p-4 align-middle">
                        {renderStars(review.rating)}
                      </td>
                      
                      {/* Review Text Truncated */}
                      <td className="p-4 text-[#A0A0A0] text-xs italic align-middle">
                        "{truncateText(review.review_text, 60)}"
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-right align-middle">
                        <div className="flex justify-end">
                          <button 
                            onClick={() => setSelectedReview(review)}
                            className="p-2 text-[#555] hover:text-[#007BFF] transition-colors rounded hover:bg-[#007BFF]/10"
                            title="View Full Review"
                          >
                            <FaEye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL POPUP */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-[#2A2A2A] relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#0A0A0A] p-6 border-b border-[#1E1E1E] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white  tracking-wider">
                Review Details
              </h3>
              <button onClick={() => setSelectedReview(null)} className="text-[#555] hover:text-[#007BFF] transition-colors text-lg">
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-xs text-[#A0A0A0]  font-bold tracking-wider">Reviewer Name</label>
                  <p className="text-3xl font-['Barlow_Condensed'] text-white font-bold mt-1">
                    {selectedReview.name || "Anonymous"}
                  </p>
                </div>
                <div className="text-right">
                  <label className="text-xs text-[#A0A0A0]  font-bold tracking-wider">Date</label>
                  <p className="text-sm text-[#C59D5F] font-mono font-bold mt-1">
                    {formatDateDDMMYY(selectedReview.created_at)}
                  </p>
                </div>
              </div>

              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                 <label className="text-xs text-[#A0A0A0]  font-bold block mb-3 tracking-wider">Rating</label>
                 <div className="flex items-center gap-3">
                    {renderStars(selectedReview.rating)}
                    <span className="text-sm font-bold text-white ml-2">({selectedReview.rating}/5)</span>
                 </div>
              </div>

              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                <label className="text-xs text-[#A0A0A0]  font-bold block mb-3 tracking-wider">
                   Customer Feedback
                </label>
                <div className="max-h-[200px] overflow-y-auto pr-2">
                  <p className="text-[#C0C0C0] text-base leading-relaxed italic break-words flex gap-2">
                     <FaQuoteLeft className="text-[#007BFF] opacity-50 flex-shrink-0 mt-1" size={12} />
                     {selectedReview.review_text}
                  </p>
                </div>
              </div>
              
              {/* Modal Footer */}
              <button 
                onClick={() => setSelectedReview(null)}
                className="w-full bg-[#007BFF] hover:bg-[#0066e6] text-black font-bold py-3 rounded-xl transition-all  tracking-widest text-sm font-['Barlow_Condensed'] shadow-[0_0_20px_rgba(0,123,255,0.3)]"
              >
                Close View
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}