import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Login from './Login';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Onboarding from './Onboarding';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  // Initialize from LocalStorage or default
  const [theme, setTheme] = useState(() => localStorage.getItem('dbu_theme') || 'dark');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('dbu_color') || 'purple');

  // --- THEME & COLOR LOGIC ---
  useEffect(() => {
    const root = document.documentElement;

    // Save to LocalStorage
    localStorage.setItem('dbu_theme', theme);
    localStorage.setItem('dbu_color', colorTheme);

    // Handle Light/Dark
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    // Handle Color Theme (Remove old, add new)
    root.classList.remove('theme-purple', 'theme-blue', 'theme-green', 'theme-orange', 'theme-red');
    root.classList.add(`theme-${colorTheme}`);

  }, [theme, colorTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchProfile = async (uid) => {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error("Profile error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await fetchProfile(u.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Props bundle to pass down
  const themeProps = { theme, setTheme, toggleTheme, colorTheme, setColorTheme };

  if (loading) return <div className="h-screen flex justify-center items-center bg-gray-50 dark:bg-[#0a0a0a] text-[var(--color-primary)] font-bold animate-pulse">Loading DBU AI...</div>;

  // 1. If not logged in -> Show Landing Page or Login Page
  if (!user) {
    if (showLogin) {
      return (
        <Login
          onBack={() => setShowLogin(false)}
          {...themeProps}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => setShowLogin(true)}
        {...themeProps}
      />
    );
  }

  // 2. If new user (Setup not done) -> Force Onboarding 
  if (!profile || !profile.setupComplete) {
    return (
      <div className="h-screen w-screen bg-gray-50 dark:bg-[#0a0a0a]">
        <Onboarding
          user={user}
          profile={profile}
          onComplete={(data) => setProfile(data)}
          {...themeProps}
        />
      </div>
    );
  }

  // 3. If setup is done -> Show Dashboard
  return (
    <div className="App">
      <Dashboard
        user={user}
        profile={profile}
        setProfile={setProfile}
        {...themeProps} // Pass theme props to Dashboard
      />
    </div>
  );
}

export default App;