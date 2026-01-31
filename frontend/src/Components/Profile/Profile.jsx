import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaSave, FaCity, FaMap, FaCamera } from 'react-icons/fa';

const Profile = () => {
  // --- STATE ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    district_id: '',
    thana_id: '',
    photo: null // File object for upload
  });

  const [previewImage, setPreviewImage] = useState("https://cdn-icons-png.flaticon.com/512/149/149071.png");
  const [initialData, setInitialData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [thanas, setThanas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. FETCH INITIAL DATA ---
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (!localUser || !localUser.id) {
            console.error("User ID missing");
            setIsLoading(false);
            return;
        }

        const [userRes, districtRes] = await Promise.all([
          axios.get(`http://localhost:8081/api/user/${localUser.id}`),
          axios.get('http://localhost:8081/api/districts')
        ]);

        const userData = userRes.data;
        
        const initialFormState = {
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          apartment: userData.apartment || '',
          district_id: userData.district_id || '',
          thana_id: userData.thana_id || '',
          photo: null
        };

        setFormData(initialFormState);
        setInitialData(initialFormState);
        setDistricts(districtRes.data);

        // Set Preview Image if exists
        if(userData.photoUrl) {
            setPreviewImage(`http://localhost:8081${userData.photoUrl}`);
        }

        if (userData.district_id) {
            const thanaRes = await axios.get(`http://localhost:8081/api/thanas/${userData.district_id}`);
            setThanas(thanaRes.data);
        }

        setIsLoading(false);

      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // --- 2. CHECK DIRTY STATE ---
  useEffect(() => {
    // Exclude photo object from deep comparison, check it separately
    const { photo, ...dataWithoutPhoto } = formData;
    const { photo: initPhoto, ...initDataWithoutPhoto } = initialData;
    
    const isChanged = (JSON.stringify(dataWithoutPhoto) !== JSON.stringify(initDataWithoutPhoto)) || (photo !== null);
    setIsDirty(isChanged);
  }, [formData, initialData]);

  // --- 3. HANDLERS ---
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPreviewImage(URL.createObjectURL(file)); // Show preview instantly
    }
  };

  const handleDistrictChange = async (e) => {
    const newDistrictId = e.target.value;
    setFormData(prev => ({ ...prev, district_id: newDistrictId, thana_id: '' }));
    setThanas([]); 
    if (newDistrictId) {
        try {
            const res = await axios.get(`http://localhost:8081/api/thanas/${newDistrictId}`);
            setThanas(res.data);
        } catch (error) { console.error(error); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const localUser = JSON.parse(localStorage.getItem('user'));

    try {
        // Use FormData for file upload
        const dataPayload = new FormData();
        dataPayload.append('id', localUser.id);
        dataPayload.append('name', formData.name);
        dataPayload.append('phone', formData.phone);
        dataPayload.append('address', formData.address);
        dataPayload.append('apartment', formData.apartment);
        dataPayload.append('district_id', formData.district_id);
        dataPayload.append('thana_id', formData.thana_id);
        
        // Only append photo if a new one is selected
        if (formData.photo) {
            dataPayload.append('photo', formData.photo);
        }

        const res = await axios.put('http://localhost:8081/api/user/update', dataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update initial state
        setInitialData({ ...formData, photo: null });
        // If server returned new photo URL, update local storage/context if needed
        setIsDirty(false);
        alert("Profile updated successfully!");

    } catch (error) {
        console.error("Update failed", error);
        alert("Failed to update profile.");
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0E1014] text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0E1014] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-8 text-center">
          <h2 className="text-[#C59D5F] font-['Barlow_Condensed'] tracking-widest uppercase text-sm font-bold mb-2">Settings</h2>
          <h1 className="text-4xl font-['Barlow_Condensed'] font-bold uppercase text-white">Update Profile</h1>
        </div>

        <div className="bg-[#1A1C21] rounded-xl shadow-2xl overflow-hidden border border-white/5 relative p-8">
            
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- PROFILE PICTURE UPLOAD --- */}
            <div className="flex justify-center mb-6">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-[#0E1014] overflow-hidden bg-gray-700 shadow-lg">
                        <img 
                            src={previewImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <label 
                        htmlFor="photo-upload" 
                        className="absolute bottom-1 right-1 bg-[#C59D5F] text-[#0E1014] p-2 rounded-full cursor-pointer hover:bg-white transition-colors shadow-lg z-10"
                    >
                        <FaCamera size={16} />
                    </label>
                    <input 
                        type="file" 
                        id="photo-upload" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden"
                    />
                </div>
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <FaUser className="absolute top-4 left-3 text-[#C59D5F]" />
                <input 
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full bg-[#0E1014] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#C59D5F] transition-colors placeholder-gray-600"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="form-control">
              <label className="label text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Email</label>
              <div className="relative opacity-60">
                <FaEnvelope className="absolute top-4 left-3 text-[#C59D5F]" />
                <input 
                  type="email" name="email" value={formData.email} readOnly
                  className="w-full bg-[#0E1014] border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="form-control">
              <label className="label text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Phone</label>
              <div className="relative">
                <FaPhone className="absolute top-4 left-3 text-[#C59D5F]" />
                <input 
                  type="text" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full bg-[#0E1014] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#C59D5F] transition-colors placeholder-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DISTRICT */}
                <div className="form-control">
                    <label className="label text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">District</label>
                    <div className="relative">
                        <FaCity className="absolute top-4 left-3 text-[#C59D5F]" />
                        <select 
                            name="district_id" value={formData.district_id} onChange={handleDistrictChange}
                            className="w-full bg-[#0E1014] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#C59D5F] appearance-none"
                        >
                            <option value="" className="text-gray-500">Select District</option>
                            {districts.map(d => (
                                <option key={d.id} value={d.id} className="text-white bg-[#1A1C21]">{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* THANA */}
                <div className="form-control">
                    <label className="label text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Thana</label>
                    <div className="relative">
                        <FaMap className="absolute top-4 left-3 text-[#C59D5F]" />
                        <select 
                            name="thana_id" value={formData.thana_id} onChange={handleChange} disabled={!formData.district_id}
                            className={`w-full bg-[#0E1014] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#C59D5F] appearance-none ${!formData.district_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <option value="" className="text-gray-500">Select Thana</option>
                            {thanas.map(t => (
                                <option key={t.id} value={t.id} className="text-white bg-[#1A1C21]">{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* APARTMENT */}
            <div className="form-control">
              <label className="label text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Apartment / Suite</label>
              <div className="relative">
                <FaBuilding className="absolute top-4 left-3 text-[#C59D5F]" />
                <input 
                  type="text" name="apartment" value={formData.apartment} onChange={handleChange} placeholder="e.g. 4B, 3rd Floor"
                  className="w-full bg-[#0E1014] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#C59D5F] transition-colors placeholder-gray-600"
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div className="form-control">
              <label className="label text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Street Address</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute top-4 left-3 text-[#C59D5F]" />
                <textarea 
                  name="address" value={formData.address} onChange={handleChange} rows="3"
                  className="w-full bg-[#0E1014] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#C59D5F] resize-none placeholder-gray-600"
                ></textarea>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="mt-8">
              <button 
                type="submit" disabled={!isDirty || isSaving}
                className={`w-full btn border-none rounded-lg font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-lg py-3 flex items-center justify-center gap-2 transition-all duration-300
                  ${isDirty && !isSaving ? "bg-[#C59D5F] hover:bg-white hover:text-[#0E1014] text-white" : "bg-gray-800 text-gray-500 cursor-not-allowed"}`}
              >
                {isSaving ? "Saving..." : <><FaSave /> Save Changes</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;