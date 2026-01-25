import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Remove 'BrowserRouter as Router'

// Import your components
import Navbar from './Components/Header/Navbar';
import Hero from './Components/Hero/Hero';
import Signup from './Components/Authentication/Signup';
import Footer from './Components/Footer/Footer';

function App() {
  return (
    <> 
      {/* <Router>  <-- REMOVE THIS WRAPPER */}
      
      <Navbar />
      
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      
      <Footer />

      {/* </Router> <-- REMOVE THIS CLOSING TAG */}
    </>
  );
}

export default App;