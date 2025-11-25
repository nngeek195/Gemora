'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Sparkles, Diamond, UploadCloud, LogIn, Users, MapPin, Phone, MessageCircle, Star } from 'lucide-react';
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa6";


// --- Static Data for Service Providers ---
const SRI_LANKA_LOCATIONS = [
  { name: "Nalin Perera", city: "Ratnapura (Sab.)", specialty: "Classic Brilliant Cuts", phone: '0711234567', whatsapp: '94711234567', mapLink: 'https://goo.gl/maps/example1' },
  { name: "Ayesha Silva", city: "Kandy (Central)", specialty: "Precision Faceting (Sapphire)", phone: '0779876543', whatsapp: '94779876543', mapLink: 'https://goo.gl/maps/example2' },
  { name: "Rohan Fernando", city: "Colombo (Western)", specialty: "Modern Fancy Shapes", phone: '0705551234', whatsapp: '94705551234', mapLink: 'https://goo.gl/maps/example3' },
  { name: "Geetha Kumari", city: "Galle (Southern)", specialty: "Antique & Old Mine Cuts", phone: '0784449999', whatsapp: '94784449999', mapLink: 'https://goo.gl/maps/example4' },
  { name: "Suresh Rajan", city: "Jaffna (Northern)", specialty: "High-Clarity Emerald Cuts", phone: '0712228888', whatsapp: '94712228888', mapLink: 'https://goo.gl/maps/example5' },
  { name: "Kamal Premathilaka", city: "Matara (Southern)", specialty: "Color Enhancement & Cuts", phone: '0773330000', whatsapp: '94773330000', mapLink: 'https://goo.gl/maps/example6' },
];

// Simple random subset util
const getRandomSubset = (arr, count) => {
  const copy = [...arr];
  copy.sort(() => 0.5 - Math.random());
  return copy.slice(0, count);
};

// --- Sub-Component 1: Provider Actions ---
const ProviderActions = ({ provider }) => (
  <div className="flex justify-around space-x-2 mt-3 pt-3 border-t border-gray-200">
    <a
      href={`tel:${provider.phone || '#'}`}
      className="flex items-center text-sm text-blue-900 transition-colors font-medium group"
    >
      <Phone className="w-4 h-4 mr-1 group-hover:scale-105 transition-transform" /> Call
    </a>
    <a
      href={`https://wa.me/${provider.whatsapp || '#'}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center text-sm text-green-600 transition-colors font-medium group"
    >
      <FaWhatsapp className="w-5 h-5 mr-1 group-hover:scale-105 transition-transform" /> WhatsApp
    </a>
    <a
      href={provider.mapLink || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center text-sm text-red-600 transition-colors font-medium group"
    >
      <MapPin className="w-4 h-4 mr-1 group-hover:scale-105 transition-transform" /> Location
    </a>
  </div>
);

// --- Sub-Component 2: Service Provider Card ---
const Rating = ({ score = 4.8 }) => (
  <div className="flex items-center space-x-1">
    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden="true" />
    <span className="text-sm font-semibold text-gray-800">{score}</span>
    <span className="text-xs text-gray-500">(120 Reviews)</span>
  </div>
);

const ServiceProviderCard = ({ provider, isHighlighted = false }) => (
  <div
    className={`p-6 rounded-2xl transition-all duration-500 transform hover:shadow-2xl hover:scale-[1.03] shadow-lg
      ${isHighlighted ? 'bg-white border-2 border-blue-500/50' : 'bg-white border border-gray-200'}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start">
        <div className={`p-2 rounded-full mr-4 ${isHighlighted ? 'bg-blue-100/70' : 'bg-gray-100'}`}>
          <Diamond className={`w-5 h-5 ${isHighlighted ? 'text-blue-700' : 'text-gray-500'}`} aria-hidden="true" />
        </div>
        <div>
          <h4 className="font-extrabold text-xl text-gray-900">{provider.name}</h4>
          <p className="text-sm font-semibold text-blue-600 mt-0.5">{provider.specialty}</p>
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between">
      <Rating />
      <p className="text-sm text-gray-500 flex items-center font-medium">
        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
        {provider.city.split(' ')[0]}
      </p>
    </div>

    <ProviderActions provider={provider} />
  </div>
);


export default function HomeView() {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Optimization: useMemo for providers
  const homeProviders = useMemo(() => getRandomSubset(SRI_LANKA_LOCATIONS, 3), []);

  const handleFileChange = async (event) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png).');
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit check
      setError('File size exceeds 5MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    setIsUploading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`Simulated upload for: ${file.name}`);

    // Navigate to the prediction/profile page
    alert(`File uploaded: ${file.name}. Moving to prediction page...`);
    window.location.href = `/profile?gem=${encodeURIComponent(file.name)}`;

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // --- Sub-Component 3: Header ---
  const renderHeader = () => (
    <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100 shadow-md sticky top-0 z-20">
      <div className="flex items-center text-3xl font-black text-gray-900 tracking-tighter">
        <Image src="/Logo.png" alt="Gemora Logo" height={70} width={70} className="mr-1" />
        <span className="text-blue-900">GEM</span><span className="text-gray-900">ORA</span>
      </div>
      <nav className="flex items-center space-x-4">
        <button
          onClick={() => window.location.href = '/'}
          className={`py-2 px-4 rounded-lg text-sm font-bold transition-all text-blue-900 bg-gradient-to-r from-blue-600 to-blue-800 shadow-md shadow-blue-200  hover:scale-[1.02]`}
          aria-current="page"
        >
          Home
        </button>

        <button
          onClick={() => window.location.href = '/providers'}
          className="text-blue-900 py-2 px-4 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all shadow-md shadow-blue-200 flex items-center transform hover:scale-[1.02]"
        >
          <Users className="w-4 h-4 inline mr-2" /> Master Cutters
        </button>

        <button
          onClick={() => window.location.href = '/login'}
          className="py-2 px-4 rounded-lg text-sm text-blue-900 font-bold bg-gradient-to-r from-blue-600 to-blue-800 hover:scale-[1.02] transition-all flex items-center shadow-md shadow-blue-200"
        >
          <LogIn className="w-4 h-4 inline mr-2" /> Login
        </button>


      </nav>
    </header>
  );

  return (
    <div className="min-h-screen bg-sky-50 font-inter">
      {/* Import Inter font for modern typography */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');body { font-family: 'Inter', sans-serif; }`}</style>
      <script src="https://cdn.tailwindcss.com"></script>

      {renderHeader()}

      <main className="p-4 md:p-10">
        {/* --- Gem Upload Hero Section (Central Feature) --- */}
        <section className="text-center py-16 px-4 bg-white shadow-3xl rounded-3xl max-w-3xl mx-auto border-4 border-dashed border-blue-100/50">
          <Sparkles className="mx-auto w-14 h-14 text-blue-900 animate-pulse" />
          <h2 className="text-5xl font-extrabold text-gray-900 mt-4 tracking-tight">
            Analyze Your <span className="text-blue-900">Rough Gem</span>
          </h2>
          <p className="text-xl text-gray-600 mt-3 mb-10 max-w-lg mx-auto">
            Our AI Gemologist predicts the optimal cut for maximum brilliance and value.
          </p>

          <label
            htmlFor="file-upload"
            className={`block w-full p-10 text-center rounded-2xl cursor-pointer transition duration-500 
              ${isUploading
                ? 'border-4 border-solid border-blue-500 bg-blue-50'
                : error
                  ? 'border-4 border-solid border-red-500 bg-red-50 hover:bg-red-100'
                  : 'border-4 border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100'}`}
          >
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-800 mb-4"></div>
                <span className="font-extrabold text-blue-900 text-2xl">Analyzing Gem...</span>
                <span className="block text-sm text-gray-600 mt-2">Processing image data for optimal geometry.</span>
              </div>
            ) : (
              <>
                <UploadCloud className="mx-auto w-14 h-14 text-blue-900 mb-3" />
                <span className="font-extrabold text-blue-900 text-xl md:text-2xl">Drop or Tap to Upload Image</span>
                <span className="block text-sm text-gray-500 mt-1">Maximum 5MB (PNG or JPG). No sign-up required.</span>
              </>
            )}
          </label>
          {error && <p className="text-md text-red-600 mt-4 font-semibold" role="alert">{error}</p>}
        </section>

        {/* --- Service Providers Section --- */}
        <section className="mt-20 pt-10 border-t border-gray-200 max-w-6xl mx-auto">
          <h3 className="text-4xl font-extrabold text-gray-900 text-center mb-4">Connect with Master Cutters</h3>
          <p className="text-lg text-gray-600 text-center mb-12">Hand-picked, highly-rated professionals across Sri Lanka ready to bring your analyzed gem to life.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {homeProviders.map((p) => <ServiceProviderCard key={p.name} provider={p} isHighlighted={true} />)}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => window.location.href = '/providers'}
              className="text-black py-3 px-8 rounded-full text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all shadow-xl shadow-blue-300 flex items-center justify-center mx-auto transform hover:scale-105"
            >
              <MapPin className="w-5 h-5 mr-3" /> View All 20 Master Cutters →
            </button>
          </div>
        </section>
      </main>

      {/* Basic Footer */}
      <footer className="p-6 text-center text-sm text-gray-500 border-t mt-20 bg-white shadow-inner">
        &copy; {new Date().getFullYear()} Gemora. All rights reserved. | Crafted for the Sri Lankan Gem Industry.
      </footer>
    </div>
  );
}