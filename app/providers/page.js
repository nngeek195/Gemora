'use client';

import React from 'react';
import { Diamond, Users, ArrowLeft, MapPin, Phone, MessageCircle } from 'lucide-react';

// --- Static Data for Service Providers (Full List) ---
const SRI_LANKA_LOCATIONS = [
    { name: "Nalin Perera", city: "Ratnapura (Sab.)", specialty: "Classic Brilliant Cuts" },
    { name: "Ayesha Silva", city: "Kandy (Central)", specialty: "Precision Faceting (Sapphire)" },
    { name: "Rohan Fernando", city: "Colombo (Western)", specialty: "Modern Fancy Shapes" },
    { name: "Geetha Kumari", city: "Galle (Southern)", specialty: "Antique & Old Mine Cuts" },
    { name: "Suresh Rajan", city: "Jaffna (Northern)", specialty: "High-Clarity Emerald Cuts" },
    { name: "Kamal Premathilaka", city: "Matara (Southern)", specialty: "Color Enhancement & Cuts" },
    { name: "Dinesh Alwis", city: "Kurunegala (N.W.)", specialty: "Rough Stone Preparation" },
    { name: "Thanuja Bandara", city: "Nuwara Eliya (Central)", specialty: "Bespoke Jewelry Design" },
    { name: "Harsha Liyanage", city: "Trincomalee (Eastern)", specialty: "Radiant & Princess Cuts" },
    { name: "Krishan Silva", city: "Anuradhapura (N.C.)", specialty: "Oval & Marquise Optimization" },
    { name: "Priya Samaranayake", city: "Kalutara (Western)", specialty: "Step Cuts (Baguette)" },
    { name: "Jayantha Wijenayake", city: "Badulla (Uva)", specialty: "Deep Rough Shaping" },
    { name: "Saman Kumara", city: "Negombo (Western)", specialty: "Quartz & Semi-Precious" },
    { name: "Lakshmi Fernando", city: "Batticaloa (Eastern)", specialty: "Unique Cabochon Finishes" },
    { name: "Rizwan Iqbal", city: "Puttalam (N.W.)", specialty: "Laser-Guided Cutting" },
    { name: "Charith Wijesinghe", city: "Ratnapura (Sab.)", specialty: "High-End Diamond Recutting" },
    { name: "Shiromi Perera", city: "Kandy (Central)", specialty: "Heirloom Restoration" },
    { name: "Isuru Rajapaksa", city: "Galle (Southern)", specialty: "Mixed Cut Expertise" },
    { name: "Fathima Razeek", city: "Mannar (Northern)", specialty: "Clarity-Focused Cuts" },
    { name: "Nishantha Silva", city: "Dambulla (Central)", specialty: "Opals & Phenomenal Gems" },
];

// Provider action small component
const ProviderActions = ({ provider }) => (
    <div className="flex justify-around space-x-2 mt-3 pt-3 border-t border-gray-100">
        <a href="#" className="flex items-center text-sm text-gray-700 hover:text-blue-500 transition-colors">
            <Phone className="w-4 h-4 mr-1" /> Call
        </a>
        <a href="#" className="flex items-center text-sm text-gray-700 hover:text-green-500 transition-colors">
            <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
        </a>
        <a href="#" target="_blank" rel="noreferrer" className="flex items-center text-sm text-gray-700 hover:text-pink-500 transition-colors">
            <MapPin className="w-4 h-4 mr-1" /> Location
        </a>
    </div>
);

const ServiceProviderCard = ({ provider, isHighlighted = false }) => (
    <div
        className={`p-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] 
      ${isHighlighted ? 'bg-amber-50 border-2 border-amber-400' : 'bg-white border border-gray-200'}`}
    >
        <div className="flex items-center">
            <Diamond className={`w-6 h-6 mr-3 ${isHighlighted ? 'text-amber-600' : 'text-gray-500'}`} />
            <div>
                <h4 className="font-bold text-lg text-gray-900">{provider.name}</h4>
                <p className="text-xs font-medium text-amber-600">{provider.specialty}</p>
            </div>
        </div>
        <p className="text-sm text-gray-500 mt-2 flex items-center">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            {provider.city}
        </p>
        <ProviderActions provider={provider} />
    </div>
);

// Main Component for the Providers Page
export default function ProvidersPage() {

    const renderHeader = () => (
        <header className="flex justify-between items-center p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
            <div className="flex items-center text-2xl font-extrabold text-gray-900 tracking-tight">
                <Diamond className="w-7 h-7 text-amber-500 mr-2" />
                <span className="text-amber-600">Gem</span><span className="text-gray-900">ora</span>
            </div>
            <nav className="flex items-center space-x-3">
                <button onClick={() => window.location.href = '/'} className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50`}>Home</button>
                <button className="text-black py-2 px-4 rounded-lg text-sm font-bold bg-gradient-to-r from-yellow-600 to-amber-500 shadow-lg flex items-center">
                    <Users className="w-4 h-4 inline mr-1" /> Service Providers
                </button>
                <button onClick={() => window.location.href = '/login'} className="py-2 px-3 rounded-lg text-sm font-medium text-black bg-accent hover:bg-[#5cb9ff] transition-colors flex items-center">
                    Login
                </button>
            </nav>
        </header>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');body { font-family: 'Inter', sans-serif; }`}</style>
            <script src="https://cdn.tailwindcss.com"></script>

            {renderHeader()}

            <main className="p-8">
                <div className="max-w-6xl mx-auto p-4 space-y-6">
                    <button onClick={() => window.location.href = '/'} className="text-gray-500 hover:text-gray-700 flex items-center text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Gemora Home
                    </button>

                    <h2 className="text-4xl font-extrabold text-amber-700 text-center border-b pb-4">
                        All Certified Gem Cut Service Providers ({SRI_LANKA_LOCATIONS.length})
                    </h2>
                    <p className="text-center text-gray-600">Connect directly with our network of experienced gem cutters located throughout Sri Lanka.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Highlight the first few as featured, matching the original UI */}
                        {SRI_LANKA_LOCATIONS.map((p, i) =>
                            <ServiceProviderCard key={i} provider={p} isHighlighted={i < 4} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}