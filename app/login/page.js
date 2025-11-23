'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'; // Added getDoc
// FIX: Added RotateCw to imports
import { Diamond, LogIn, Lock, User, LogOut, RotateCw, CheckCircle } from 'lucide-react';
import Image from "next/image";

// --- Firebase Initialization and Path Helpers ---

// CRUCIAL: Must use the real __app_id. Simulating its retrieval here.
const APP_ID = typeof window !== 'undefined' && typeof __app_id !== 'undefined' ? __app_id : 'gemora-default-app';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp;
let auth;
let db;

try {
    if (typeof window !== 'undefined') {
        // Initialize only if not already initialized
        if (!firebaseApp) {
            firebaseApp = initializeApp(firebaseConfig);
            auth = getAuth(firebaseApp);
            db = getFirestore(firebaseApp);
        }
    }
} catch (e) {
    console.error('Firebase Initialization Error:', e);
}

const googleProvider = new GoogleAuthProvider();

// CORE PATHING HELPER: Defines the security-critical path for user documents
const getUserArtifactsPath = (userId) => {
    // This structure isolates user data under a unique app ID for security and multi-app architecture
    return `artifacts/${APP_ID}/users/${userId}`;
};

// CORE FUNCTION: Ensures a user document exists in Firestore
const ensureUserDocument = async (user) => {
    if (!db || !user) return false;

    const userPath = getUserArtifactsPath(user.uid);
    const userRef = doc(db, userPath);

    try {
        const docSnap = await getDoc(userRef);
        const isNewUser = !docSnap.exists();

        // 💡 Enhancement: Set 'onboardingComplete' to false only if the document is NEW
        const initialUserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            lastLogin: new Date().toISOString(),
            // Only set onboardingComplete to false if the document is brand new
            ...(isNewUser && {
                createdAt: new Date().toISOString(),
                onboardingComplete: false // Triggers initial setup on /profile
            }),
        };

        await setDoc(userRef, initialUserData, { merge: true });
        console.log("Firestore User document ensured/updated at:", userPath);
        return isNewUser;

    } catch (error) {
        console.error("Error ensuring user document at:", userPath, error);
        throw new Error("Login failed: could not create user profile.");
    }
};

export default function LoginSignup() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false); // New state for sign-in button
    const [error, setError] = useState('');

    // 1. Firebase Auth State Listener
    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            setError('Firebase Auth is not initialized. Check environment variables.');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setIsLoading(false);

            if (user) {
                try {
                    setIsSigningIn(true);
                    const isNewUser = await ensureUserDocument(user);
                    setIsSigningIn(false);

                    // Redirect after successful document creation/update
                    const redirectPath = isNewUser ? '/profile?onboarding=true' : '/profile';
                    window.location.href = redirectPath;
                } catch (e) {
                    setIsSigningIn(false);
                    setError(e.message || 'Login failed due to permissions or database error.');
                    // Force sign out if document creation fails due to critical error
                    await signOut(auth);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // 2. Google Sign-in Handler
    const handleGoogleSignIn = useCallback(async () => {
        if (!auth) return;
        setIsSigningIn(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
            // The onAuthStateChanged listener handles the rest (document creation and redirect)
        } catch (err) {
            console.error('Google sign-in failed', err);
            // Handle common closed-popup error gracefully
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Google sign-in failed.');
            }
        } finally {
            // Note: isSigningIn is set to false by the listener upon failure/success
            // It is kept true here to handle the loading screen effect until the listener resolves
            if (!currentUser) setIsSigningIn(false);
        }
    }, [currentUser]);

    // 3. Logout Handler
    const handleLogout = async () => {
        if (!auth) return;
        setIsLoading(true);
        try {
            await signOut(auth);
            window.location.href = '/';
        } catch (err) {
            console.error('Logout failed', err);
            setError('Logout failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => (
        <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100 shadow-md sticky top-0 z-20">
            <div className="flex items-center text-3xl font-black text-gray-900 tracking-tighter">
                <Image src="/Logo.png" alt="Gemora Logo" height={70} width={70} className="mr-1" />
                <span className="text-blue-900">GEM</span><span className="text-gray-900">ORA</span>
            </div>
            <nav className="flex items-center space-x-4">
                <button
                    onClick={() => window.location.href = '/'}
                    className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors text-gray-600 hover:bg-gray-100`}
                >
                    Home
                </button>
                {currentUser ? (
                    <button
                        onClick={handleLogout}
                        className="py-2 px-4 rounded-lg text-sm font-semibold text-black bg-blue-600 hover:bg-blue-700 transition-colors flex items-center shadow-md"
                        disabled={isLoading}
                    >
                        <LogOut className="w-4 h-4 inline mr-2" /> Logout
                    </button>
                ) : (
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="py-2 px-4 rounded-lg text-sm font-semibold text-black bg-blue-800 transition-colors flex items-center shadow-md"
                        aria-current="page"
                    >
                        <LogIn className="w-4 h-4 inline mr-2" /> Login
                    </button>
                )}
            </nav>
        </header>
    );

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 font-inter flex justify-center items-center">
                <div className="text-gray-700 flex flex-col items-center">
                    <RotateCw className="w-8 h-8 mb-2 text-blue-800 animate-spin" />
                    <p className="text-lg font-medium">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // --- Main UI ---
    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');body { font-family: 'Inter', sans-serif; }`}</style>
            <script src="https://cdn.tailwindcss.com"></script>

            {renderHeader()}

            <main className="p-4 md:p-8 flex justify-center items-start pt-16">
                <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100">
                    <div className="text-center mb-10">
                        {currentUser ? (
                            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                        ) : (
                            <Lock className="w-12 h-12 mx-auto text-blue-800 mb-4" />
                        )}
                        <h2 className="text-3xl font-extrabold text-gray-900">{currentUser ? 'Authentication Successful' : 'Sign In to Gemora'}</h2>
                        <p className="text-gray-500 mt-2">
                            {currentUser
                                ? `Hello, ${currentUser.displayName}! Redirecting you to your profile.`
                                : 'Securely access your analysis history and professional connections.'}
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-medium" role="alert">
                            **Error:** {error}
                        </div>
                    )}

                    {/* Sign-in Button */}
                    {!currentUser && (
                        <>
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isSigningIn}
                                className={`w-full py-3 px-4 rounded-xl text-lg font-bold text-black transition-all duration-300 shadow-lg flex items-center justify-center 
                                    ${isSigningIn ? 'bg-gray-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-300/50'}`}
                            >
                                {isSigningIn ? (
                                    <>
                                        <RotateCw className="w-5 h-5 mr-3 animate-spin" /> Authenticating...
                                    </>
                                ) : (
                                    <>
                                        {/* Google SVG Icon */}
                                        <svg className="w-5 h-5 mr-3 fill-white" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.56l6.62-6.38C35.2 4.13 29.98 2 24 2 13.95 2 5.25 8.18 2.76 16.27h7.94c.66-2.9 2.59-5.18 5.46-6.68 2.8-1.45 6.01-2.09 9.38-2.09zm0 30c-5.74 0-10.87-2.31-14.59-6.07l-6.52 6.5C8.04 45.41 15.65 48 24 48c9.02 0 17.06-3.78 22.75-9.76l-7.39-5.75c-2.35 1.5-5.22 2.38-8.36 2.38zM46 24c0-1.84-.17-3.66-.48-5.46H24v10.92h12.59c-.48 2.56-1.74 4.8-3.67 6.55l7.38 5.75C45.2 38.6 48 31.9 48 24z" /></svg>
                                        Continue with Google
                                    </>
                                )}
                            </button>

                            <div className="text-center mt-6">
                                <p className="text-xs text-gray-500">
                                    This uses Google's secure OAuth service. No passwords stored.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}