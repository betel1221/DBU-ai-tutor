import React from 'react';

const LandingPage = ({ onGetStarted, theme, toggleTheme, colorTheme }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white selection:bg-[var(--color-primary)] selection:text-white font-sans overflow-x-hidden transition-colors duration-300">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-black/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center font-bold text-lg text-white shadow-lg">
                            D
                        </div>
                        <span className="font-bold text-xl tracking-tight">DBU AI</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all border border-transparent dark:border-white/5"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                // Sun Icon
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
                                // Moon Icon
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="px-6 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-80 transition-all transform hover:scale-105"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                {/* Ambient Background Glow */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-primary)] rounded-full blur-[120px] opacity-20 pointer-events-none" />

                <div className="relative z-10 animate-fade-in-up">
                    <span className="inline-block py-1 px-3 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium tracking-wide text-[var(--color-primary)] mb-6">
                        REDEFINING EDUCATION
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8">
                        Unlock Your Potential <br />
                        <span className="text-[var(--color-primary)]">
                            with DBU AI
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                        Your personalized AI study companion. Get answers tailored to your <span className="text-gray-900 dark:text-white font-semibold">Department & Year</span>, analyze diagrams instantly, and learn through natural voice conversations.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <button
                            onClick={onGetStarted}
                            className="group relative px-8 py-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all overflow-hidden"
                        >
                            <span className="relative z-10">Start Learning Now</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Interactive Features Grid */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Study Smarter, Not Harder</h2>
                    <p className="text-gray-600 dark:text-gray-400">Everything you need to excel in your courses.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon="🎓"
                        title="Context Aware"
                        desc="Answers are customized specifically for your Department and Year level. No generic explanations."
                        color="hover:border-[var(--color-primary)]"
                    />
                    <FeatureCard
                        icon="📸"
                        title="Visual Recognition"
                        desc="Stuck on a diagram? Snap a photo and get an instant breakdown of complex visual concepts."
                        color="hover:border-[var(--color-primary)]"
                    />
                    <FeatureCard
                        icon="🎙️"
                        title="Voice Companion"
                        desc="Tired of typing? Talk to DBU AI naturally. It listens and responds with human-like voice."
                        color="hover:border-[var(--color-primary)]"
                    />
                    <FeatureCard
                        icon="📜"
                        title="Smart History"
                        desc="Never lose track. Access your entire conversation history to review past lessons anytime."
                        color="hover:border-[var(--color-primary)]"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-white/5 py-12 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} DBU AI. All rights reserved.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, color }) => (
    <div className={`group p-8 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 backdrop-blur-sm hover:-translate-y-2 transition-all duration-300 ${color}`}>
        <div className="w-12 h-12 rounded-lg bg-white dark:bg-black/50 border border-gray-200 dark:border-white/5 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:text-[var(--color-primary)]">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
            {desc}
        </p>
    </div>
);

export default LandingPage;
