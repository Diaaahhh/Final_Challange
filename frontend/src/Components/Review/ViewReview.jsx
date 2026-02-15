import React, { useEffect, useState } from "react";
import { FaStar, FaTimes, FaEye, FaQuoteLeft } from "react-icons/fa";
import api from "../../api";

export default function ViewReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the Modal
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

  // Helper to render stars
  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < rating ? "text-[#C59D5F]" : "text-[#CBD5E1]"}
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto max-w-7xl">
        
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#E2E8F0] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-[#1E293B]">
              Customer<span className="text-[#C59D5F]">Reviews</span>
            </h1>
            <p className="text-[#64748B] text-sm mt-2 font-medium tracking-wide">
              What our customers are saying
            </p>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0 items-center">
             <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-lg shadow-sm text-sm font-bold">
                <span className="text-[#64748B] mr-2">Total:</span>
                <span className="text-[#C59D5F]">{reviews.length}</span>
             </div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F1F5F9] text-[#64748B] text-xs uppercase tracking-wider font-['Barlow_Condensed'] border-b border-[#E2E8F0]">
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 w-1/3">Review Preview</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#C59D5F] font-bold">
                      Loading Reviews...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#64748B]">
                      <div className="flex flex-col items-center">
                         <FaQuoteLeft className="text-4xl mb-3 opacity-20" /> 
                         <span>No reviews yet. Be the first to write one!</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      {/* Date */}
                      <td className="p-4 text-sm text-[#64748B] font-mono whitespace-nowrap align-middle">
                        {new Date(review.created_at).toLocaleDateString()}
                      </td>
                      
                      {/* Name */}
                      <td className="p-4 align-middle">
                        <div className="font-bold text-[#1E293B] font-['Barlow_Condensed'] text-lg tracking-wide uppercase">
                          {review.name || "Anonymous"}
                        </div>
                      </td>
                      
                      {/* Rating */}
                      <td className="p-4 align-middle">
                        {renderStars(review.rating)}
                      </td>
                      
                      {/* Review Text (Truncated) */}
                      <td className="p-4 text-[#64748B] text-xs italic align-middle">
                        "{truncateText(review.review_text, 60)}"
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-right align-middle">
                        <div className="flex justify-end">
                          <button 
                            onClick={() => setSelectedReview(review)}
                            className="p-2 text-[#64748B] hover:text-[#C59D5F] transition-colors"
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

      {/* --- MODAL POPUP --- */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E2E8F0] relative overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#F1F5F9] p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-[#1E293B] uppercase tracking-wider">
                Review Details
              </h3>
              <button onClick={() => setSelectedReview(null)} className="text-[#64748B] hover:text-[#1E293B]">
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-xs text-[#64748B] uppercase font-bold">Reviewer Name</label>
                  <p className="text-3xl font-['Barlow_Condensed'] text-[#1E293B] font-bold">
                    {selectedReview.name || "Anonymous"}
                  </p>
                </div>
                <div className="text-right">
                  <label className="text-xs text-[#64748B] uppercase font-bold">Date</label>
                  <p className="text-sm text-[#C59D5F] font-mono font-bold mt-1">
                    {new Date(selectedReview.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                 <label className="text-xs text-[#64748B] uppercase font-bold block mb-2">Rating</label>
                 <div className="flex items-center gap-2">
                    {renderStars(selectedReview.rating)}
                    <span className="text-sm font-bold text-[#1E293B] ml-2">({selectedReview.rating}/5)</span>
                 </div>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                <label className="text-xs text-[#64748B] uppercase font-bold block mb-2">
                   Customer Feedback
                </label>
                <div className="max-h-[200px] overflow-y-auto pr-2">
                  <p className="text-[#475569] text-base leading-relaxed italic break-words flex gap-2">
                     <FaQuoteLeft className="text-[#C59D5F] opacity-50 flex-shrink-0 mt-1" size={12} />
                     {selectedReview.review_text}
                  </p>
                </div>
              </div>
              
              {/* Modal Footer */}
              <button 
                onClick={() => setSelectedReview(null)}
                className="w-full bg-[#1E293B] text-white font-bold py-3 rounded-xl hover:bg-[#C59D5F] transition-colors uppercase tracking-widest text-sm font-['Barlow_Condensed']"
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