'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
// Removed Storage imports: getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';

import { Diamond, LogIn, User, History, MapPin, Phone, MessageCircle, ArrowLeft, Sparkles, XCircle, RotateCw, UploadCloud, Save, Award, Trash2 } from 'lucide-react';

// --- Static Data (Rest of the component's non-Firebase helpers remain the same) ---
const SRI_LANKA_LOCATIONS = [
    { name: "Nalin Perera", city: "Ratnapura (Sab.)", specialty: "Classic Brilliant Cuts" },
    { name: "Ayesha Silva", city: "Kandy (Central)", specialty: "Precision Faceting (Sapphire)" },
    { name: "Rohan Fernando", city: "Colombo (Western)", specialty: "Modern Fancy Shapes" },
    { name: "Geetha Kumari", city: "Galle (Southern)", specialty: "Antique & Old Mine Cuts" },
    { name: "Suresh Rajan", city: "Jaffna (Northern)", specialty: "High-Clarity Emerald Cuts" },
    { name: "Kamal Premathilaka", city: "Matara (Southern)", specialty: "Color Enhancement & Cuts" },
    { name: "Dinesh Alwis", city: "Kurunegala (N.W.)", specialty: "Rough Stone Preparation" },
    { name: "Thanuja Bandara", city: "Nuwara Eliya (Central)", specialty: "Bespoke Jewelry Design" },
];

const getRandomSubset = (arr, count) => {
    const copy = [...arr];
    copy.sort(() => 0.5 - Math.random());
    return copy.slice(0, count);
};

// NOTE: fileToBase64 is no longer needed since we aren't uploading the file.

const formatDateFromTimestamp = (timestamp) => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString().split('T')[0];
    }
    try {
        return new Date(timestamp).toISOString().split('T')[0];
    } catch (e) {
        return 'N/A';
    }
};

// --- Firebase Initialization and Path Helpers ---
const APP_ID = typeof window !== 'undefined' && typeof __app_id !== 'undefined' ? __app_id : 'gemora-default-app';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp;
let auth;
let db;
// let storage; // Removed storage declaration

try {
    if (typeof window !== 'undefined' && !firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);
        db = getFirestore(firebaseApp);
        // storage = getStorage(firebaseApp); // Removed storage initialization
    }
} catch (e) {
    console.error('Firebase Initialization Error:', e);
}

const getUserArtifactsPath = (userId) => {
    return `artifacts/${APP_ID}/users/${userId}`;
};

// --- Sub-Components (Unchanged UI/Logic) ---
const ProviderActions = ({ provider }) => (
    <div className="flex justify-around space-x-2 mt-3 pt-3 border-t border-gray-200">
        <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"><Phone className="w-4 h-4 mr-1" /> Call</a>
        <a href="#" className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</a>
        <a href="#" target="_blank" rel="noreferrer" className="flex items-center text-sm text-gray-600 hover:text-blue-700 transition-colors"><MapPin className="w-4 h-4 mr-1" /> Location</a>
    </div>
);

const ServiceProviderCard = ({ provider, isHighlighted = false }) => (
    <div
        className={`p-5 rounded-xl transition-all duration-300 transform hover:shadow-xl hover:scale-[1.03] shadow-lg
      ${isHighlighted ? 'bg-blue-50 border-2 border-blue-400' : 'bg-white border border-gray-200'}`}
    >
        <div className="flex items-center">
            <Diamond className={`w-6 h-6 mr-3 ${isHighlighted ? 'text-blue-700' : 'text-gray-500'}`} />
            <div>
                <h4 className="font-bold text-lg text-gray-900">{provider.name}</h4>
                <p className="text-xs font-medium text-blue-600">{provider.specialty}</p>
            </div>
        </div>
        <p className="text-sm text-gray-500 mt-2 flex items-center">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            {provider.city}
        </p>
        <ProviderActions provider={provider} />
    </div>
);


// --- Main Component ---
export default function ProfileView() {
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [onboardingData, setOnboardingData] = useState({
        name: 'Guest',
        contact: '',
        knowledge: 'beginner',
    });

    const [gemFile, setGemFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [cutPrediction, setCutPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);

    const fileInputRef = useRef(null);
    const recommendedProviders = useMemo(() => getRandomSubset(SRI_LANKA_LOCATIONS, 6), []);

    // --- FIREBASE SERVICE FUNCTIONS ---

    // NOTE: Storage references and deletion logic are removed from the following functions.

    const fetchProfileAndHistory = useCallback(async (userId, displayName) => {
        if (!db) return;
        setIsHistoryLoading(true);
        setError('');
        const userPath = getUserArtifactsPath(userId);

        try {
            const profileRef = doc(db, userPath);
            const profileDoc = await getDoc(profileRef);

            if (profileDoc.exists()) {
                const data = profileDoc.data();

                setOnboardingData({
                    name: data.name ?? displayName,
                    contact: data.contact ?? '',
                    knowledge: data.knowledge ?? 'beginner',
                    onboardingComplete: data.onboardingComplete
                });

                if (!data.onboardingComplete) {
                    setShowWelcomeModal(true);
                }
            } else {
                setOnboardingData(prev => ({ ...prev, name: displayName }));
                setShowWelcomeModal(true);
            }

            const gemsCollectionRef = collection(db, userPath, 'gems');
            const q = query(gemsCollectionRef);
            const querySnapshot = await getDocs(q);

            const loadedHistory = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: formatDateFromTimestamp(doc.data().timestamp),
            }));

            loadedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            setHistory(loadedHistory);
        } catch (error) {
            console.error("Error fetching user data:", error);
            setError("Failed to load profile or history. Check network/permissions.");
            setHistory([]);
        } finally {
            setIsHistoryLoading(false);
        }
    }, []);

    const saveProfileData = async (data, userId) => {
        if (!db) return false;
        const userPath = getUserArtifactsPath(userId);
        const profileRef = doc(db, userPath);
        setError('');

        try {
            await setDoc(profileRef, { ...data, onboardingComplete: true, lastUpdated: Timestamp.now() }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error saving profile data:", error);
            setError("Failed to save profile data.");
            return false;
        }
    };

    /**
     * 💡 MODIFIED: This function now ONLY handles saving the data to Firestore.
     * Image file data is passed but is NOT uploaded to Storage.
     */
    const saveGemAnalysis = async (gemData, imageFile, userId) => {
        if (!db) throw new Error("Firestore not initialized.");

        const timestamp = Timestamp.now();
        const userPath = getUserArtifactsPath(userId);
        const docId = doc(collection(db, userPath, 'gems')).id;

        // 1. Prepare Data for Firestore
        const dataToSave = {
            ...gemData,
            // We use the file name/preview for history, but do NOT store the file itself.
            // imageUrl and storagePath fields are REMOVED.
            timestamp: timestamp,
        };

        const firestorePath = `${userPath}/gems/${docId}`;
        console.log("Firestore Path Attempt (Data Only):", firestorePath);

        // 2. Save Data to Firestore
        const gemRef = doc(db, firestorePath);
        await setDoc(gemRef, dataToSave);

        // We return the file's local preview URL to update the history instantly (client-side only).
        return {
            id: docId,
            ...dataToSave,
            // Include previewUrl for local display until page reload
            previewUrl: URL.createObjectURL(imageFile)
        };
    };

    /**
     * 💡 MODIFIED: This function now ONLY handles deleting the document from Firestore.
     * Storage deletion logic is REMOVED.
     */
    const deleteGemAnalysis = async (item, userId) => {
        if (!db) throw new Error("Firestore not initialized.");

        const userPath = getUserArtifactsPath(userId);

        // 1. Delete Document
        // We no longer attempt to delete from Storage (item.storagePath).
        await deleteDoc(doc(db, userPath, 'gems', item.id));
    };

    // --- EFFECTS ---
    useEffect(() => {
        if (!auth) {
            setAuthReady(true);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthReady(true);
            if (!user) {
                window.location.href = '/login';
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUser?.uid && authReady) {
            fetchProfileAndHistory(currentUser.uid, currentUser.displayName);
        }
    }, [currentUser, authReady, fetchProfileAndHistory]);


    // --- Core Logic Functions ---
    const handleFileChange = (event) => {
        setError('');
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be under 5MB.');
            if (fileInputRef.current) fileInputRef.current.value = null;
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (jpg, png).');
            if (fileInputRef.current) fileInputRef.current.value = null;
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setGemFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setCutPrediction(null);
        setShowHistory(false);
    };

    const handlePrediction = async () => {
        if (!gemFile) {
            setError('Please upload an image first.');
            return;
        }
        setIsLoading(true);
        setError('');
        setCutPrediction(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const mockResult = { cut: getRandomSubset(['Oval Brilliant Cut', 'Emerald Cut', 'Radiant Cut', 'Cushion Cut', 'Marquise Cut', 'Asscher Cut'], 1)[0] };

            setCutPrediction(mockResult.cut);
        } catch (err) {
            setError('Prediction failed. (Check server logs or API key).');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePrediction = async () => {
        if (!cutPrediction || !gemFile || !currentUser) {
            alert('Cannot save. Ensure you are logged in, an image is uploaded, and prediction is run.');
            return;
        }
        setIsLoading(true);
        setError('');

        console.log("--- STARTING SAVE PROCESS (DATA ONLY) ---");

        try {
            const gemData = {
                cut: cutPrediction,
                stone: gemFile.name || 'Rough Stone',
                knowledgeLevel: onboardingData.knowledge,
                contact: onboardingData.contact
            };

            // This call no longer involves Firebase Storage
            const savedItem = await saveGemAnalysis(gemData, gemFile, currentUser.uid);

            console.log("--- SAVE SUCCESSFUL TO FIRESTORE ---");

            const historyEntry = {
                id: savedItem.id,
                ...savedItem,
                date: formatDateFromTimestamp(savedItem.timestamp),
                // Use the local preview URL for instant display (will vanish on refresh)
                imageUrl: savedItem.previewUrl || null
            };

            setHistory([historyEntry, ...history]);
            setCutPrediction(null);
            alert(`Analysis for "${historyEntry.cut}" saved successfully to Firestore!`);

            // Cleanup: Clear prediction UI
            setGemFile(null);
            if (fileInputRef.current) fileInputRef.current.value = null;
            if (previewUrl) URL.revokeObjectURL(previewUrl);

        } catch (error) {
            console.error("--- SAVE PROCESS FAILED CRITICALLY ---");
            console.error("Firestore Error Details:", error);

            // If this fails now, it MUST be a Firestore Security Rule issue.
            setError(`Critical failure saving data. Check Firestore rules or network.`);
            alert(`Save Failed! Check console for errors.`);

        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHistoryItem = async (item) => {
        if (!currentUser) return;
        if (window.confirm(`Are you sure you want to delete the analysis for ${item.cut} (${item.date})?`)) {
            setIsLoading(true);
            try {
                // This now only deletes the Firestore document
                await deleteGemAnalysis(item, currentUser.uid);
                setHistory(history.filter(h => h.id !== item.id));
            } catch (error) {
                console.error("Deletion failed:", error);
                setError("Failed to delete analysis.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleLogout = async () => {
        if (auth) await signOut(auth);
        window.location.href = '/login';
    };

    const handleWelcomeSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsLoading(true);
        setError('');

        const success = await saveProfileData(onboardingData, currentUser.uid);

        if (success) {
            setShowWelcomeModal(false);
        }
        setIsLoading(false);
    };

    // --- RENDER CONDITIONALS (Unchanged) ---
    if (!authReady || !currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 font-inter flex justify-center items-center">
                <div className="text-gray-700 flex flex-col items-center">
                    <RotateCw className="w-8 h-8 mb-2 text-blue-800 animate-spin" />
                    <p className="text-lg font-medium">{!authReady ? 'Initializing Authentication...' : 'Redirecting to Login...'}</p>
                </div>
            </div>
        );
    }

    // --- Render Functions (Simplified image handling) ---

    const renderWelcomeModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-3xl w-full max-w-lg mx-4 transform transition-all duration-300 scale-100 border border-blue-100">
                <div className="text-center mb-6">
                    <Award className="w-10 h-10 mx-auto text-blue-800 animate-pulse" />
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-3">Welcome to Gemora!</h3>
                    <p className="text-gray-600 mt-1">Tell us a little about your goals to personalize your experience.</p>
                </div>

                <form onSubmit={handleWelcomeSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Your Preferred Name</label>
                        <input id="name" type="text" placeholder="Enter your name" required value={onboardingData.name} onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="contact" className="block text-sm font-semibold text-gray-700">Contact Number (For service providers)</label>
                        <input id="contact" type="tel" placeholder="+94 77 XXXXXXX" required value={onboardingData.contact} onChange={(e) => setOnboardingData({ ...onboardingData, contact: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="knowledge" className="block text-sm font-semibold text-gray-700">Your knowledge about gems?</label>
                        <select id="knowledge" required value={onboardingData.knowledge} onChange={(e) => setOnboardingData({ ...onboardingData, knowledge: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 bg-white focus:ring-blue-500 focus:border-blue-500">
                            <option value="beginner">Beginner (First time rough stone owner)</option>
                            <option value="hobbyist">Hobbyist (I collect occasionally)</option>
                            <option value="trader">Trader/Jeweler (Professional experience)</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isLoading} className={`w-full py-3 px-4 rounded-lg font-bold text-black transition-colors shadow-lg flex items-center justify-center 
                            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900 shadow-blue-300/50'}`}>
                            {isLoading ? <><RotateCw className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : <>Save Details and Start Analyzing</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );


    const renderHeader = () => {
        const nameToDisplay = onboardingData.name || 'User';
        const firstName = nameToDisplay.split(' ')[0];

        return (
            <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100 shadow-md sticky top-0 z-20">
                <div className="flex items-center text-3xl font-black text-gray-900 tracking-tighter">
                    <Diamond className="w-8 h-8 text-blue-800 mr-2" />
                    <span className="text-blue-800">Gem</span><span className="text-gray-900">ora</span>
                </div>
                <nav className="flex items-center space-x-4">
                    <div className="flex items-center text-sm font-semibold text-gray-700 p-2 rounded-full bg-gray-100">
                        <User className="w-4 h-4 mr-1 text-blue-800" /> **{firstName}**
                    </div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        disabled={showWelcomeModal || isHistoryLoading}
                        className={`py-2 px-4 rounded-lg text-sm font-bold transition-colors flex items-center shadow-sm 
                            ${showHistory ? 'text-black bg-blue-800 hover:bg-blue-900' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'} ${showWelcomeModal || isHistoryLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <History className="w-4 h-4 inline mr-2" /> {showHistory ? 'New Prediction' : 'View History'}
                    </button>
                    <button onClick={handleLogout} disabled={showWelcomeModal} className={`py-2 px-4 rounded-lg text-sm font-semibold text-black bg-gray-200 hover:bg-gray-300 transition-colors flex items-center shadow-sm ${showWelcomeModal ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <LogIn className="w-4 h-4 inline mr-2 rotate-180" /> Logout
                    </button>
                </nav>
            </header>
        );
    };

    const renderPredictionSection = () => (
        <div className="flex flex-col lg:flex-row bg-white shadow-2xl rounded-xl p-8 space-y-8 lg:space-y-0 lg:space-x-8 border border-gray-100">

            <div className="lg:w-1/3 space-y-4">
                <h3 className="text-xl font-bold text-blue-800 flex items-center">1. Upload Gemstone</h3>

                <label htmlFor="file-upload" className="block w-full h-56 p-4 text-center border-4 border-dashed border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition duration-300 relative overflow-hidden">
                    <input id="file-upload" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFileChange} className="hidden" />
                    {previewUrl ?
                        <img src={previewUrl} alt="Gem Preview" className="object-contain h-full w-full" /> :
                        <div className="flex flex-col items-center justify-center h-full">
                            <UploadCloud className="w-10 h-10 text-blue-800 mb-2" />
                            <span className="text-md font-bold text-blue-800">Click to Upload Rough Stone</span>
                            <span className="text-xs text-gray-500 mt-1">(Max 5MB PNG/JPG)</span>
                        </div>
                    }
                </label>

                <button
                    onClick={handlePrediction}
                    disabled={isLoading || !gemFile}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-black transition-all duration-300 shadow-lg flex items-center justify-center 
                        ${isLoading || !gemFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900 shadow-blue-300/50'}`}
                >
                    {isLoading ? <><RotateCw className="w-5 h-5 mr-2 animate-spin" /> Analyzing Geometry...</> : <><Sparkles className="w-5 h-5 mr-2" /> Run AI Analysis</>}
                </button>
            </div>

            <div className="lg:w-2/3 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">2. AI Result & Save</h3>
                    {cutPrediction ? (
                        <div className="p-6 rounded-xl border-4 border-blue-500 bg-blue-50 shadow-inner">
                            <p className="text-lg text-blue-700 font-semibold flex items-center"><Sparkles className='w-5 h-5 mr-2' /> OPTIMAL RECOMMENDED CUT:</p>
                            <div className="text-5xl font-black text-blue-900 mt-2 tracking-wider">{cutPrediction.toUpperCase()}</div>

                            <p className="text-md text-blue-700 mt-3">This shape is predicted to maximize the **brilliance** and retain the highest possible **carat weight** based on the rough stone's geometry.</p>
                            <button
                                onClick={handleSavePrediction}
                                disabled={isLoading}
                                className={`mt-5 w-full py-3 px-4 rounded-lg font-bold text-black transition-colors flex items-center justify-center 
                                    ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-300/50'}`}
                            >
                                <Save className='w-5 h-5 mr-2' /> Save Result to History
                            </button>
                        </div>
                    ) : (
                        <div className="p-10 bg-gray-100 rounded-xl text-center text-gray-500 shadow-inner h-full flex flex-col justify-center">
                            <Diamond className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className='font-medium'>Run the AI Analysis to generate your custom cut recommendation.</p>
                        </div>
                    )}
                </div>

                {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center text-sm"><XCircle className="w-4 h-4 mr-2" /> <p className="font-medium">{error}</p></div>}
            </div>
        </div>
    );

    const renderHistorySection = () => (
        <div className="bg-white shadow-2xl rounded-xl p-8 space-y-6 border border-gray-100">
            <h3 className="text-3xl font-bold text-blue-800 flex items-center border-b pb-4">
                <History className="w-7 h-7 mr-2" /> Your Analysis History ({history.length} Saved)
            </h3>

            <p className='text-sm text-gray-500 mb-6'>Data is securely stored in your personal Firestore path: `artifacts/{APP_ID}/users/{currentUser.uid}/gems`</p>

            <div className="space-y-4">
                {history.length > 0 ? history.map((item, index) => (
                    <div key={item.id} className={`p-4 rounded-lg border flex items-center transition-all shadow-sm ${index === 0 ? 'bg-blue-50 border-blue-400/70' : 'bg-white border-gray-200 hover:shadow-md'}`}>

                        <div className="w-20 h-20 mr-4 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 border border-gray-300">
                            {/* 💡 MODIFIED: Use a placeholder icon since images are no longer stored/fetched from Storage */}
                            <Diamond className="w-full h-full p-4 text-blue-500" />
                        </div>

                        <div className='flex-grow'>
                            <p className="font-extrabold text-xl text-gray-900">{item.cut.toUpperCase()}</p>
                            <p className="text-sm text-gray-600 mt-0.5">Rough Stone: **{item.stone || 'Unnamed Stone'}** | Saved: {item.date}</p>
                            <p className="text-xs text-blue-700 mt-1">Owner Profile: {item.knowledgeLevel.toUpperCase()}</p>
                        </div>

                        <div className="flex flex-col space-y-1 ml-4 flex-shrink-0">
                            <button onClick={() => alert(`Showing providers for ${item.cut}`)} className="text-blue-800 text-sm font-semibold hover:underline">
                                View Cutters
                            </button>
                            <button className="text-red-500 text-sm font-semibold hover:underline flex items-center" onClick={() => handleDeleteHistoryItem(item)} disabled={isLoading}>
                                <Trash2 className='w-4 h-4 mr-1' /> Delete
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="p-6 text-center text-gray-500 bg-gray-100 rounded-lg shadow-inner">
                        <History className='w-8 h-8 mx-auto mb-3 text-gray-400' />
                        <p className='font-medium'>No analysis history found. Run a prediction and click **'Save Result to History'** to track your gems!</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');body { font-family: 'Inter', sans-serif; }`}</style>
            <script src="https://cdn.tailwindcss.com"></script>

            {showWelcomeModal && renderWelcomeModal()}

            {renderHeader()}

            <main className="p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-12">

                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h2 className="text-4xl font-extrabold text-gray-900 flex items-center">
                            <User className="w-8 h-8 mr-3 text-blue-800" /> Your Gem Profile
                        </h2>
                        <button className="text-gray-500 hover:text-blue-800 flex items-center text-sm font-semibold transition-colors" onClick={() => window.location.href = '/'}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Return to Home
                        </button>
                    </div>

                    {isHistoryLoading && (
                        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                            <RotateCw className="w-6 h-6 mx-auto text-blue-800 animate-spin mb-3" />
                            <p className="text-gray-600 font-medium">Loading profile and analysis history...</p>
                        </div>
                    )}

                    {!isHistoryLoading && (
                        <>
                            {showHistory ? renderHistorySection() : renderPredictionSection()}

                            <div className="pt-8 border-t border-gray-200">
                                <h3 className="text-4xl font-extrabold text-gray-900 text-center mb-6">💎 Local Gem Cut Specialists</h3>
                                <p className="text-center text-gray-600 mb-8">Contact these master cutters who specialize in maximizing brilliance.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recommendedProviders.map((p, i) => <ServiceProviderCard key={i} provider={p} isHighlighted={i === 0} />)}
                                </div>
                                <div className="text-center mt-8">
                                    <button className="text-blue-800 hover:text-blue-900 font-semibold flex items-center justify-center mx-auto transition-colors" onClick={() => window.location.href = '/providers'}>
                                        View all {SRI_LANKA_LOCATIONS.length} local cutters →
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}