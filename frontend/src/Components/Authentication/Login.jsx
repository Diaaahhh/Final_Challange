import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// CHANGE 1: Import IMAGE_BASE_URL (Root URL)
import { IMAGE_BASE_URL } from "../../config"; 

// CHANGE: Import icons for the password toggle
import { FaEye, FaEyeSlash } from 'react-icons/fa';
export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // CHANGE: State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!formData.email || !formData.password) {
        toast.warning("Please fill in all fields", { theme: "dark" });
        return;
    }

    try {
      // CHANGE 2: Use IMAGE_BASE_URL (Root) + /login
      // Result: https://backend.khabartable.com/login
      const res = await axios.post(`${IMAGE_BASE_URL}/login`, formData);

      if (res.status === 200 && res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        sessionStorage.setItem('justLoggedIn', 'true');

        toast.success("Welcome back!", {
            theme: "dark",
            position: "top-center"
        });

        setTimeout(() => {
            navigate('/'); 
        }, 1500);
      } else {
         toast.error("Login failed: Invalid server response.", { theme: "dark" });
      }

    } catch (err) {
      if (err.response) {
        if (err.response.status === 404) {
             toast.error("User not found! Please sign up.", { theme: "dark" });
        } else if (err.response.status === 401) {
             toast.error("Incorrect Password!", { theme: "dark" });
        } else {
             toast.error("Login failed. Try again.", { theme: "dark" });
        }
      } else {
        console.error(err);
        toast.error("Network Error. Check console.", { theme: "dark" });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0E1014] relative overflow-hidden font-['Inter']">
       <ToastContainer />
       <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#C59D5F]/10 rounded-full blur-[100px]"></div>
       <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#C59D5F]/5 rounded-full blur-[100px]"></div>

       <div className="w-full max-w-md p-8 bg-[#1F2125] border border-white/10 rounded-[4px] shadow-2xl relative z-10 mx-4">
          <div className="text-center mb-8">
             <h2 className="text-4xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider mb-2">
               Welcome <span className="text-[#C59D5F]">Back</span>
             </h2>
             <p className="text-gray-400 text-sm">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="form-control">
                <label className="label pl-0">
                  <span className="label-text font-['Barlow_Condensed'] uppercase tracking-wide text-[#C59D5F] font-bold">Email Address</span>
                </label>
                <input type="email" name="email" placeholder="email@example.com" className="input w-full bg-[#0E1014] border border-white/10 text-white focus:outline-none focus:border-[#C59D5F] rounded-[4px] h-12 transition-colors placeholder:text-gray-600" onChange={handleChange} />
             </div>
             {/* CHANGE: Wrapped input in relative div to position the icon */}
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} // Dynamic Type
                        name="password" 
                        placeholder="••••••••" 
                        className="input w-full bg-[#0E1014] border border-white/10 text-white focus:outline-none focus:border-[#C59D5F] rounded-[4px] h-12 transition-colors placeholder:text-gray-600 pr-10" // added pr-10 for space
                        onChange={handleChange} 
                    />
                    
                    {/* CHANGE: The Toggle Button */}
                    <button
                        type="button" // Important: preventing form submit
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#C59D5F] transition-colors cursor-pointer focus:outline-none"
                    >
                        {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                </div>
             <div className="mt-8">
                <button className="btn w-full bg-[#C59D5F] hover:bg-white hover:text-[#0E1014] text-white border-none font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-lg rounded-[4px] transition-all duration-300">Login</button>
             </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/10">
             <p className="text-gray-400 text-sm">Don't have an account? <Link to="/signup" className="text-[#C59D5F] font-bold hover:text-white transition-colors uppercase font-['Barlow_Condensed'] tracking-wide ml-1">Sign Up Here</Link></p>
          </div>
       </div>
    </div>
  );
}