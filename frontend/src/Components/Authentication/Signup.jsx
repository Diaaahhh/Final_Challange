import React, { useState } from 'react';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
  };

  return (
    /* BACKGROUND CONTAINER 
      - bg-gradient-to-br: Creates the diagonal gradient
      - from-indigo-500 via-purple-500 to-pink-500: The color palette
    */
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      
      {/* CARD CONTAINER
        - backdrop-blur-sm: Blurs the background behind the card slightly
        - bg-white/90: Uses white background with 90% opacity for the glass effect
        - shadow-2xl: Adds a deep shadow to make it pop
      */}
      <div className="card w-96 shadow-2xl bg-white/90 backdrop-blur-sm border border-white/20">
        <div className="card-body">
          
          {/* TITLE with Gradient Text */}
          <h2 className="card-title justify-center text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600">
            Create Account
          </h2>
          
          <form onSubmit={handleSubmit} className="form-control w-full gap-4">
            
            {/* Name Input */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Full Name</span>
              </label>
              <input 
                type="text" 
                name="name"
                placeholder="John Doe" 
                className="input input-bordered w-full bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                onChange={handleChange}
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Email</span>
              </label>
              <input 
                type="email" 
                name="email"
                placeholder="email@example.com" 
                className="input input-bordered w-full bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Password</span>
              </label>
              <input 
                type="password" 
                name="password"
                placeholder="********" 
                className="input input-bordered w-full bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                onChange={handleChange}
              />
            </div>

            {/* Submit Button with Gradient */}
            <div className="card-actions justify-end mt-6">
              <button className="btn w-full border-none text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-lg transform hover:scale-[1.02] transition-transform">
                Sign Up
              </button>
            </div>
            
            <div className="divider text-gray-500">OR</div>
            
            <p className="text-center text-sm text-gray-600">
              Already have an account? <a className="link link-hover font-bold text-indigo-600">Login</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}