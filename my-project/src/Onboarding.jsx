import React, { useState } from 'react';
import { db } from './firebase';
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from './firebase';
import logo from './d-logo.svg';

const Onboarding = ({ user, profile, onComplete, colorTheme }) => {
  const [dept, setDept] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [batch, setBatch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Common DBU Departments
  const departments = [
    "Computer Science", "Software Engineering", "Information Technology",
    "Civil Engineering", "Electrical Engineering", "Medicine",
    "Business & Economics", "Law", "Other"
  ];

  const handleFinish = async () => {
    if ((dept === 'Other' && !customDept.trim()) || !dept || !batch) {
      return alert("Please select your Department and Year.");
    }

    setIsSaving(true);
    try {
      const finalDept = dept === "Other" ? customDept : dept;
      const profileData = {
        ...profile,
        department: finalDept,
        batch: batch,
        setupComplete: true,
        isEditing: false
      };

      await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
      onComplete(profileData);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#09090b] text-slate-900 dark:text-white transition-colors duration-500">

      {/* LEFT PANEL - Visual & Brand */}
      <div className="relative hidden md:flex w-5/12 lg:w-1/2 bg-black items-center justify-center overflow-hidden">

        {/* Abstract Dynamic Background */}
        <div className="absolute inset-0 bg-[#09090b]">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[var(--color-primary)] opacity-20 blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--color-primary)] opacity-10 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-12 text-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 mb-8 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-2xl">
            <img src={logo} alt="DBU" className="w-10 h-10 drop-shadow-lg" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Academic <br /> Excellence <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-white">Redefined.</span>
          </h1>
          <p className="text-lg text-white/50 max-w-md font-light leading-relaxed">
            Your personalized AI companion for Debre Berhan University. Tailored resources, instant answers, and smart study tools.
          </p>

          <div className="mt-12 flex items-center gap-4 text-sm font-medium text-white/40">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-white/5 backdrop-blur-md" />)}
            </div>
            <span>Joined by 500+ DBU Students</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 relative">

        {/* Back Button */}
        <button
          onClick={() => signOut(auth)}
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back
        </button>

        <div className="w-full max-w-md space-y-10 animate-fade-in-up">

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Set up your profile</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Please tell us your academic details to customize your dashboard.
            </p>
          </div>

          <div className="space-y-8">

            {/* Department Input */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Department</label>
              <div className="relative">
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 pr-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all font-medium"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map(d => <option key={d} value={d} className="bg-white dark:bg-[#18181b]">{d}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>

              {dept === "Other" && (
                <input
                  type="text"
                  placeholder="Type your department..."
                  className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 py-2 px-1 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[var(--color-primary)] transition-colors animate-slide-down"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                />
              )}
            </div>

            {/* Year Input */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Academic Year</label>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(y => (
                  <button
                    key={y}
                    onClick={() => setBatch(String(y))}
                    className={`group relative h-14 rounded-xl border flex items-center justify-center text-lg font-semibold transition-all duration-300 ${batch === String(y)
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[0_0_20px_-5px_var(--color-primary)]'
                      : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                  >
                    {y}
                    {batch === String(y) && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-white dark:ring-offset-[#09090b]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="w-full h-14 bg-[var(--color-primary)] text-white rounded-xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 group"
            >
              {isSaving ? "Personalizing..." : "Get Started"}
              {!isSaving && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>}
            </button>

          </div>
        </div>

        {/* Footer Help */}
        <p className="absolute bottom-6 text-xs text-slate-400">
          Need help? <a href="#" className="underline hover:text-[var(--color-primary)]">Contact Support</a>
        </p>

      </div>
    </div>
  );
};

export default Onboarding;