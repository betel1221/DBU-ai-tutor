import React, { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Login = ({ onBack, theme, toggleTheme, colorTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Helper to map Firebase errors to user-friendly messages
  const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed. Please contact support.';
      default:
        return 'An undefined error occurred. Please try again.';
    }
  };

  const validateAndSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLogin) {
      if (!firstName.trim() || !lastName.trim()) return setError("Please enter your first and last name.");
      if (password !== confirmPassword) return setError("Passwords do not match!");
    }

    try {
      if (isLogin) {
        // LOGIN
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // SIGN UP
        const res = await createUserWithEmailAndPassword(auth, email, password);

        // SAVE NAME TO FIRESTORE IMMEDIATELY
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          email: res.user.email,
          firstName: firstName,
          lastName: lastName,
          displayName: `${firstName} ${lastName}`.trim(),
          setupComplete: false
        });
      }
    } catch (err) {
      console.error("Auth Error:", err.code, err.message);
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-[#0a0a0a] p-4 font-sans text-gray-900 dark:text-white transition-colors duration-300">

      {/* Theme Toggle (Absolute Top Right) */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-2.5 rounded-full bg-white dark:bg-white/10 shadow-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/20 transition-all z-50 transform hover:scale-105"
        title="Toggle Theme"
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      <div className="flex w-full max-w-4xl h-[600px] bg-white dark:bg-[#111] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 transition-colors duration-300">

        {/* LEFT FORM SECTION */}
        <div className="flex-1 p-10 flex flex-col justify-center relative">
          <button
            onClick={onBack}
            className="absolute top-8 left-8 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="w-fit px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold mb-6 mt-8">
            DBU AI
          </div>

          <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            {isLogin ? "Welcome Back" : "Join DBU AI"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
            {isLogin ? "Sign in to continue your learning journey" : "Get started with your free account today"}
          </p>

          {error && (
            <div className="p-3 mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={validateAndSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-1/2 p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-1/2 p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>
            )}

            <input
              type="email"
              placeholder="Email Address"
              className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
              onChange={e => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
              onChange={e => setPassword(e.target.value)}
              required
            />

            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            )}

            <button
              type="submit"
              className="w-full py-3.5 mt-2 rounded-xl bg-[var(--color-primary)] font-bold text-white shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all"
            >
              {isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>

          <p
            onClick={() => setIsLogin(!isLogin)}
            className="mt-6 text-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            {isLogin ? "New user? Create account" : "Have an account? Login"}
          </p>
        </div>

        {/* RIGHT VISUAL SECTION */}
        <div className="hidden md:block flex-1 relative overflow-hidden bg-gray-100 dark:bg-[#050505]">
          {/* Color Overlay based on Theme */}
          <div className="absolute inset-0 bg-[var(--color-primary)] opacity-10 dark:opacity-5"></div>

          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111] via-transparent to-transparent"></div>

          <div className="absolute bottom-12 left-12 right-12 z-10">
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Learning</p>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">DBU AI Companion</h3>
              <p className="text-[var(--color-primary)] text-sm">Your Personal Tutor</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;