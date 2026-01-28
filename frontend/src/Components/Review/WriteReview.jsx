import React, { useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa"; 

export default function WriteReview() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setMessage({ type: "error", text: "Please select a star rating." });
      return;
    }

    try {
      await axios.post("http://localhost:8081/api/write-review", {
        name,
        review_text: reviewText,
        rating,
      });

      setMessage({ type: "success", text: "Thank you for your feedback!" });
      // Reset form
      setName("");
      setReviewText("");
      setRating(0);
      setHover(0);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong. Try again." });
    }
  };

  return (
    <section className="w-full bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden flex flex-col md:flex-row border border-gray-200">
        
        {/* --- LEFT SIDE: Title & Invitation --- */}
        <div className="w-full md:w-1/3 bg-gray-900 p-8 flex flex-col justify-center items-center text-center">
          <h3 className="text-3xl font-serif font-bold text-amber-500 mb-2">Rate Us</h3>
          <p className="text-gray-400 text-sm">
            We value your opinion. Tell us about your dining experience.
          </p>
          {/* Decorative Divider */}
          <div className="w-16 h-1 bg-amber-500 mt-4 rounded-full"></div>
        </div>

        {/* --- RIGHT SIDE: The Form --- */}
        <div className="w-full md:w-2/3 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field */}
            <div>
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                // Added text-gray-900 for dark text
                className="w-full border-b-2 border-gray-200 bg-transparent py-2 px-1 text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Star Rating System */}
            <div className="flex items-center gap-1 py-2">
              {/* Changed label text to dark gray (text-gray-900) */}
              <span className="text-gray-900 mr-4 text-sm font-semibold">Your Rating:</span>
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <label key={index} className="cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      className="hidden"
                      value={ratingValue}
                      onClick={() => setRating(ratingValue)}
                    />
                    <FaStar
                      className="transition-colors duration-200"
                      size={24}
                      color={ratingValue <= (hover || rating) ? "#fbbf24" : "#e5e7eb"} 
                      onMouseEnter={() => setHover(ratingValue)}
                      onMouseLeave={() => setHover(0)}
                    />
                  </label>
                );
              })}
            </div>

            {/* Review Text Area */}
            <div>
              <textarea
                rows="3"
                placeholder="Write your review here..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                // Added text-gray-900 for dark text
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
                required
              ></textarea>
            </div>

            {/* Submit Button & Message */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-gray-900 text-amber-500 px-6 py-2 rounded-md font-bold uppercase tracking-wider text-xs hover:bg-amber-500 hover:text-white transition-all duration-300"
              >
                Submit Review
              </button>

              {message && (
                <span className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message.text}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}