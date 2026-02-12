import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// CHANGE 1: Import IMAGE_BASE_URL
import { IMAGE_BASE_URL } from '../../config';

export default function Signup() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(!formData.name || !formData.email || !formData.password) {
        toast.warning("Please fill in all fields", { theme: "dark" });
        return;
    }

    try {
      // CHANGE 2: Use IMAGE_BASE_URL (Root) + /signup
      const res = await axios.post(`${IMAGE_BASE_URL}/signup`, formData);
      
      if(res.status === 200) {
        toast.success("Account created successfully!", {
            theme: "dark", 
            position: "top-center"
        });
        
        setTimeout(() => {
            navigate('/login');
        }, 2000);
      }
      
    } catch (err) {
      if (err.response && err.response.status === 409) {
        toast.error("Email already exists! Please login.", {
            theme: "dark",
            style: { border: "1px solid #ff4d4d" }
        });
      } else {
        console.log(err);
        toast.error("Something went wrong. Please try again.", { theme: "dark" });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0E1014] relative overflow-hidden font-['Inter']">
      <ToastContainer />
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#C59D5F]/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#C59D5F]/5 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md p-8 bg-[#1F2125] border border-white/10 rounded-[4px] shadow-2xl relative z-10 mx-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider mb-2">
            Create <span className="text-[#C59D5F]">Account</span>
          </h2>
          <p className="text-gray-400 text-sm">Join the KhabarTable community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label pl-0">
              <span className="label-text font-['Barlow_Condensed'] uppercase tracking-wide text-[#C59D5F] font-bold">Full Name</span>
            </label>
            <input type="text" name="name" placeholder="Enter your name" className="input w-full bg-[#0E1014] border border-white/10 text-white focus:outline-none focus:border-[#C59D5F] rounded-[4px] h-12 transition-colors placeholder:text-gray-600" onChange={handleChange} />
          </div>

          <div className="form-control">
            <label className="label pl-0">
              <span className="label-text font-['Barlow_Condensed'] uppercase tracking-wide text-[#C59D5F] font-bold">Email Address</span>
            </label>
            <input type="email" name="email" placeholder="Enter your email address" className="input w-full bg-[#0E1014] border border-white/10 text-white focus:outline-none focus:border-[#C59D5F] rounded-[4px] h-12 transition-colors placeholder:text-gray-600" onChange={handleChange} />
          </div>

          <div className="form-control">
            <label className="label pl-0">
              <span className="label-text font-['Barlow_Condensed'] uppercase tracking-wide text-[#C59D5F] font-bold">Password</span>
            </label>
            <input type="password" name="password" placeholder="••••••••" className="input w-full bg-[#0E1014] border border-white/10 text-white focus:outline-none focus:border-[#C59D5F] rounded-[4px] h-12 transition-colors placeholder:text-gray-600" onChange={handleChange} />
          </div>

          <div className="mt-8">
            <button className="btn w-full bg-[#C59D5F] hover:bg-white hover:text-[#0E1014] text-white border-none font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-lg rounded-[4px] transition-all duration-300">Sign Up</button>
          </div>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm">Already have an account? <Link to="/login" className="text-[#C59D5F] font-bold hover:text-white transition-colors uppercase font-['Barlow_Condensed'] tracking-wide ml-1">Login Here</Link></p>
        </div>
      </div>
    </div>
  );
}