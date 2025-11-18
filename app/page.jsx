'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import {
  Sparkles, Diamond, UploadCloud, RotateCw, XCircle, Phone, MapPin, MessageCircle,
  LogIn, Users, ArrowLeft, User, History
} from 'lucide-react';

// --- Static Data for Service Providers ---
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

// Simple random subset util (non-destructive)
const getRandomSubset = (arr, count) => {
  const copy = [...arr];
  copy.sort(() => 0.5 - Math.random());
  return copy.slice(0, count);
};

// Firebase (reads config from NEXT_PUBLIC_ env vars)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
let firebaseApp;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (e) {
  // initializeApp throws if app already initialized — ignore in dev HMR
  // console.warn('Firebase init:', e);
}
const auth = typeof window !== 'undefined' && firebaseApp ? getAuth(firebaseApp) : null;
const googleProvider = new GoogleAuthProvider();

// convert file to base64 (payload body uses only the base64 content)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const parts = result.split(',');
        resolve(parts[1] ?? '');
      } else {
        resolve('');
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Provider action small component
const ProviderActions = ({ provider }) => (
  <div className="flex justify-around space-x-2 mt-3 pt-3 border-t border-gray-100">
    <a href="#" className="flex items-center text-sm text-gray-700 hover:text-blue-500 transition-colors">
      <Phone className="w-4 h-4 mr-1" /> Call
    </a>
    <a href="#" className="flex items-center text-sm text-gray-700 hover:text-green-500 transition-colors">
      <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
    </a>
    <a href={`https://www.google.com/maps/search/${encodeURIComponent(provider.city)}`} target="_blank" rel="noreferrer" className="flex items-center text-sm text-gray-700 hover:text-pink-500 transition-colors">
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

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'prediction' | 'providers'
  const [gemFile, setGemFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cutPrediction, setCutPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const fileInputRef = useRef(null);
  const recommendedProviders = useMemo(() => getRandomSubset(SRI_LANKA_LOCATIONS, 7), []);

  // Firebase auth listener
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth) { alert('Firebase not initialized (missing env vars)'); return; }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in failed', err);
      alert('Sign-in failed: ' + (err?.message ?? err));
    }
  };

  const handleFileChange = (event) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large (max 5MB).');
      return;
    }
    setGemFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCutPrediction(null);
    setView('prediction');
  };

  const handleReset = () => {
    setGemFile(null);
    setPreviewUrl('');
    setCutPrediction(null);
    setError('');
    setIsLoading(false);
    setView('home');
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const getGemCut = useCallback(async () => {
    if (!gemFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCutPrediction(null);

    try {
      const base64Image = await fileToBase64(gemFile);
      const mimeType = gemFile.type;

      const resp = await fetch('/api/gemini-cut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, mimeType }),
      });

      // server might respond with JSON or error JSON
      const text = await resp.text();
      try {
        const json = JSON.parse(text);
        if (!resp.ok) throw new Error(json.error || 'Server error during prediction');
        const resultText = (json.cut ?? json.result ?? '').toString();
        if (resultText && resultText.toLowerCase() !== 'unknown cut') {
          const clean = resultText.replace(/['"]+/g, '').replace(/The recommended cut is: ?/i, '').trim();
          setCutPrediction(clean);
        } else {
          setError('Could not get a valid cut recommendation. Try another image.');
        }
      } catch (e) {
        // parse error: server returned something unexpected
        throw new Error(text || 'Unexpected server response');
      }
    } catch (err) {
      console.error('Prediction error', err);
      setError(err?.message ?? 'Prediction failed');
    } finally {
      setIsLoading(false);
    }
  }, [gemFile]);

  // Simple header / nav
  const renderHeader = () => (
    <header className="flex justify-between items-center p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
      <div className="flex items-center text-2xl font-extrabold text-gray-900 tracking-tight">
        <Diamond className="w-7 h-7 text-amber-500 mr-2" />
        <span className="text-amber-600">Gem</span><span className="text-gray-900">ora</span>
      </div>
      <nav className="flex items-center space-x-3">
        <button onClick={() => setView('home')} className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${view === 'home' ? 'text-amber-600 bg-amber-50' : 'text-gray-600 hover:bg-gray-50'}`}>Home</button>
        <button onClick={() => setView('providers')} className="text-white py-2 px-4 rounded-lg text-sm font-bold bg-gradient-to-r from-yellow-600 to-amber-500 shadow-lg flex items-center">
          <Users className="w-4 h-4 inline mr-1" /> Service Providers
        </button>
        <button onClick={handleGoogleSignIn} className="py-2 px-3 rounded-lg text-sm font-medium text-black bg-accent hover:bg-[#5cb9ff] transition-colors flex items-center">
          <LogIn className="w-4 h-4 inline mr-1" /> {currentUser ? 'Connected' : 'Login (Google)'}
        </button>
      </nav>
    </header>
  );

  const renderHomeView = () => (
    <>
      <div className="text-center py-12 px-4 bg-white shadow-xl rounded-xl max-w-2xl mx-auto">
        <Sparkles className="mx-auto w-12 h-12 text-amber-500 animate-pulse" />
        <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Uncover the Perfect Cut</h2>
        <p className="text-lg text-gray-600 mt-2 mb-8 max-w-md mx-auto">Upload a photo of your rough gem and let our AI gemologist recommend the most brilliant cut.</p>

        <label htmlFor="file-upload" className="block w-full p-8 text-center border-4 border-dashed border-pink-400 bg-pink-50 rounded-2xl cursor-pointer hover:bg-pink-100 transition duration-300">
          <input id="file-upload" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFileChange} className="hidden" />
          <UploadCloud className="mx-auto w-12 h-12 text-pink-600 mb-2" />
          <span className="font-extrabold text-pink-700 text-xl">Tap to Upload Gemstone Image</span>
          <span className="block text-sm text-gray-500 mt-1">PNG, JPG, or JPEG (Max 5MB)</span>
        </label>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200">
        <h3 className="text-3xl font-bold text-gray-900 text-center mb-6">Meet Our Master Cutters</h3>
        <p className="text-md text-gray-600 text-center mb-10">Trusted professionals across Sri Lanka ready to bring your gem to life.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {getRandomSubset(SRI_LANKA_LOCATIONS, 3).map((p, i) => <ServiceProviderCard key={i} provider={p} isHighlighted={true} />)}
        </div>
        <div className="text-center mt-8">
          <button onClick={() => setView('providers')} className="text-amber-600 hover:text-amber-800 font-semibold flex items-center justify-center mx-auto">View all 20 service providers &rarr;</button>
        </div>
      </div>
    </>
  );

  const renderPredictionView = () => (
    <div className="max-w-4xl mx-auto space-y-10">
      <button onClick={handleReset} className="text-gray-500 hover:text-gray-700 flex items-center text-sm transition-colors"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Upload</button>

      <div className="flex flex-col md:flex-row bg-white shadow-2xl rounded-xl p-8 space-y-6 md:space-y-0 md:space-x-8">
        <div className="md:w-1/2 space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Your Uploaded Gem</h3>
          <div className="w-full h-64 bg-gray-100 rounded-md border-2 border-gray-200 flex items-center justify-center overflow-hidden">
            {previewUrl ? <img src={previewUrl} alt="preview" className="object-contain h-full w-full" /> : <div className="text-gray-400">No preview</div>}
          </div>

          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center text-sm"><XCircle className="w-4 h-4 mr-2" /> <p className="font-medium">{error}</p></div>}

          <button onClick={getGemCut} disabled={isLoading || !!cutPrediction} className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 shadow-lg flex items-center justify-center ${isLoading || !!cutPrediction ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}>
            {isLoading ? <><RotateCw className="w-5 h-5 mr-2 animate-spin" />Analyzing Stone Geometry...</> : <><Sparkles className="w-5 h-5 mr-2" />{cutPrediction ? 'Re-Run Analysis' : 'Find Best Cut Now'}</>}
          </button>
        </div>

        <div className="md:w-1/2 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4">AI Gemologist Recommendation</h3>
          {cutPrediction ? (
            <div className="p-6 rounded-xl border-4 border-amber-500 bg-amber-50 text-center">
              <p className="text-lg text-amber-700 font-semibold">THE IDEAL CUT IS:</p>
              <div className="text-4xl font-black text-amber-900 mt-2 mb-4 tracking-wider">{cutPrediction.toUpperCase()}</div>
              <p className="text-sm text-amber-700">This cut is selected to maximize brilliance and value of your gem.</p>
            </div>
          ) : (
            <div className="p-6 bg-gray-100 rounded-xl text-center text-gray-500">
              <Diamond className="w-8 h-8 mx-auto mb-2" />
              Waiting for analysis...
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">💎 Cut Specialists for the {cutPrediction || 'Selected'} Shape</h3>
        <p className="text-center text-gray-600 mb-8">Contact these master cutters who specialize in the recommended cut style.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedProviders.map((p, i) => <ServiceProviderCard key={i} provider={p} isHighlighted={false} />)}
        </div>
        <div className="text-center mt-8">
          <button onClick={() => setView('providers')} className="text-amber-600 hover:text-amber-800 font-semibold flex items-center justify-center mx-auto">View all 20 local cutters &rarr;</button>
        </div>
      </div>
    </div>
  );

  const renderProvidersView = () => (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <button onClick={() => setView('home')} className="text-gray-500 hover:text-gray-700 flex items-center text-sm transition-colors"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Gemora Home</button>
      <h2 className="text-4xl font-extrabold text-amber-700 text-center border-b pb-4">All Certified Gem Cut Service Providers (20)</h2>
      <p className="text-center text-gray-600">Connect directly with our network of experienced gem cutters located throughout Sri Lanka.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SRI_LANKA_LOCATIONS.map((p, i) => <ServiceProviderCard key={i} provider={p} isHighlighted={i < 4} />)}
      </div>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'providers': return renderProvidersView();
      case 'prediction': return renderPredictionView();
      case 'home':
      default: return renderHomeView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
      {/* quick Tailwind CDN so classes work immediately */}
      <script src="https://cdn.tailwindcss.com"></script>

      {renderHeader()}

      <main className="p-8">
        {renderView()}
      </main>
    </div>
  );
}
