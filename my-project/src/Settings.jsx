import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from './firebase';

const Settings = ({ user, profile, setProfile, onClose, theme, setTheme, toggleTheme, colorTheme, setColorTheme }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Store initial values to revert on Cancel
    const initialTheme = useRef(theme);
    const initialColor = useRef(colorTheme);

    // Profile State
    const [firstName, setFirstName] = useState(profile?.firstName || '');
    const [lastName, setLastName] = useState(profile?.lastName || '');
    const [dept, setDept] = useState(profile?.department || 'Computer Science');
    const [customDept, setCustomDept] = useState(profile?.department || '');
    const [batch, setBatch] = useState(profile?.batch || '1');

    // Constants
    const departments = [
        "Computer Science", "Software Engineering", "Information Technology",
        "Civil Engineering", "Electrical Engineering", "Mechanical Engineering",
        "Medicine", "Business & Economics", "Law", "Other"
    ];

    // Initialize customDept if "Other" logic applies
    useEffect(() => {
        if (!departments.includes(profile?.department) && profile?.department) {
            setDept("Other");
            setCustomDept(profile.department);
        }
    }, [profile]);

    const handleCancel = () => {
        // Revert visual changes
        if (setTheme) setTheme(initialTheme.current);
        // Fallback if setTheme not passed (though we added it), toggle if mismatch
        else if (theme !== initialTheme.current) toggleTheme();

        setColorTheme(initialColor.current);
        onClose();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalDept = dept === "Other" ? customDept : dept;
            const updatedData = {
                firstName,
                lastName,
                displayName: `${firstName} ${lastName}`.trim(),
                department: finalDept,
                batch: batch,
                setupComplete: true
            };

            await updateDoc(doc(db, "users", user.uid), updatedData);

            // Update local state avoiding reload
            if (typeof setProfile === 'function') {
                setProfile({ ...profile, ...updatedData });
            } else {
                // Fallback or Reload if setProfile missing (shouldn't happen now)
                window.location.reload();
            }

            // No need to revert themes, they are now "Saved"
            onClose();
        } catch (err) {
            alert("Error saving profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={handleCancel} />

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col max-h-[85vh] transition-all transform animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#18181b]">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h2>
                    <button
                        onClick={handleCancel}
                        className="p-2 -mr-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Content Layout */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar Tabs */}
                    <div className="w-48 flex-shrink-0 bg-gray-50/50 dark:bg-black/20 border-r border-gray-100 dark:border-white/5 p-4 space-y-2 hidden sm:block">
                        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon />}>
                            My Profile
                        </TabButton>
                        <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<PaletteIcon />}>
                            Appearance
                        </TabButton>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#18181b]">

                        {/* Mobile Tabs (Visible only on small screens) */}
                        <div className="flex sm:hidden gap-2 mb-6 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
                            <MobileTab active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>Profile</MobileTab>
                            <MobileTab active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')}>Appearance</MobileTab>
                        </div>

                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-fade-in">

                                {/* Name Section */}
                                <div className="grid grid-cols-2 gap-5">
                                    <InputGroup label="First Name" value={firstName} onChange={setFirstName} placeholder="Jane" />
                                    <InputGroup label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" />
                                </div>

                                {/* Department Section */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Department</label>
                                    <div className="relative">
                                        <CustomSelect
                                            options={departments}
                                            value={dept}
                                            onChange={setDept}
                                        />
                                    </div>
                                    {dept === "Other" && (
                                        <div className="mt-3 animate-slide-down">
                                            <input
                                                type="text"
                                                value={customDept}
                                                onChange={(e) => setCustomDept(e.target.value)}
                                                placeholder="Type your department name..."
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Year Section */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Year</label>
                                    <div className="flex bg-gray-50 dark:bg-black/20 p-1.5 rounded-xl border border-gray-100 dark:border-white/5">
                                        {[1, 2, 3, 4, 5].map(y => (
                                            <button
                                                key={y}
                                                onClick={() => setBatch(String(y))}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${batch === String(y)
                                                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                {y}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-8 animate-fade-in">

                                {/* Theme Mode */}
                                <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-500">
                                            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Dark Mode</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Reduce eye strain</p>
                                        </div>
                                    </div>
                                    <Switch checked={theme === 'dark'} onChange={toggleTheme} />
                                </div>

                                {/* Accent Color */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Accent Color</h3>
                                    <div className="flex gap-4">
                                        {[
                                            { id: 'purple', color: '#9333ea', label: 'Royal' },
                                            { id: 'blue', color: '#2563eb', label: 'Ocean' },
                                            { id: 'green', color: '#16a34a', label: 'Nature' },
                                            { id: 'orange', color: '#ea580c', label: 'Sunset' },
                                            { id: 'red', color: '#dc2626', label: 'Rose' },
                                        ].map(c => (
                                            <div key={c.id} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setColorTheme(c.id)}>
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${colorTheme === c.id
                                                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#18181b] ring-[var(--color-primary)] scale-110'
                                                        : 'hover:scale-105'
                                                    }`}
                                                    style={{ backgroundColor: c.color }}
                                                >
                                                    {colorTheme === c.id && <CheckIcon />}
                                                </div>
                                                <span className={`text-xs font-medium transition-colors ${colorTheme === c.id ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600'
                                                    }`}>{c.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
                    <button
                        onClick={() => signOut(auth)}
                        className="text-red-500 hover:text-red-600 text-sm font-semibold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        Sign Out
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/25 transition-all active:scale-95"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- SUB COMPONENTS FOR PROFESSIONAL LOOK ---

const TabButton = ({ active, onClick, icon, children }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                ? 'bg-white dark:bg-white/10 text-[var(--color-primary)] shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
            }`}
    >
        <span className={`text-lg ${active ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>{icon}</span>
        {children}
    </button>
);

const MobileTab = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${active ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
            }`}
    >
        {children}
    </button>
);

const InputGroup = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
        />
    </div>
);

const CustomSelect = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
                <span className="truncate">{value}</span>
                <span className="text-gray-400 text-xs">▼</span>
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-[#1f1f23] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in-up">
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt
                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}

            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

const Switch = ({ checked, onChange }) => (
    <button
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-[var(--color-primary)]' : 'bg-gray-200 dark:bg-white/10'
            }`}
    >
        <span
            className={`${checked ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm`}
        />
    </button>
);

// --- ICONS ---
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const PaletteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const SunIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;

export default Settings;
