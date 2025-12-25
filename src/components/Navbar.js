import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Search, User, LogIn, LogOut, Home, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ activeTab, setActiveTab, onSearchClick }) {
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const { data: session } = useSession();
    const profileRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || '';

    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getAvatarUrl = (avatar) => {
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        return `${API_URL}${avatar}`;
    };

    return (
        <>
            <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="font-bold text-black">V</span>
                        </div>
                        <span className="text-lg font-bold text-white hidden sm:block">LFT Türkiye</span>
                    </div>

                    {/* Desktop Center Tabs */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'feed' ? 'text-black' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            {activeTab === 'feed' && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-primary rounded-full"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">Akış</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'messages' ? 'text-black' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            {activeTab === 'messages' && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-primary rounded-full"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">Mesajlar</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-black' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            {activeTab === 'profile' && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-primary rounded-full"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">Profil</span>
                        </button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onSearchClick}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                        >
                            <Search size={16} />
                            <span className="text-sm hidden sm:block">Oyuncu Ara...</span>
                        </button>

                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors overflow-hidden"
                            >
                                {session?.user?.avatar ? (
                                    <img
                                        src={getAvatarUrl(session.user.avatar)}
                                        alt={session.user.username}
                                        className="w-full h-full object-cover select-none" draggable={false}
                                    />
                                ) : (
                                    <User size={18} />
                                )}
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C19] border border-white/10 rounded-xl shadow-2xl p-1 z-50 overflow-hidden"
                                    >
                                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                                            <div className="text-xs font-semibold text-white">{session ? session.user.username : "Misafir Kullanıcı"}</div>
                                            <div className="text-[10px] text-zinc-500">{session ? session.user.email : "Giriş yapılmadı"}</div>
                                        </div>
                                        {session ? (
                                            <>
                                                <button
                                                    onClick={() => signOut()}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 rounded-lg transition-colors text-left"
                                                >
                                                    <LogOut size={14} /> Çıkış Yap
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link href="/auth" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                                    <LogIn size={14} /> Giriş Yap
                                                </Link>
                                                <Link href="/auth?register=true" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                                                    <User size={14} /> Kayıt Ol
                                                </Link>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0C0C0C]/90 backdrop-blur-lg border-t border-white/10 z-50 flex justify-around items-center p-2 pb-safe">
                <button
                    onClick={() => setActiveTab('feed')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'feed' ? 'text-primary' : 'text-zinc-500 hover:text-white'}`}
                >
                    <Home size={24} strokeWidth={activeTab === 'feed' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Akış</span>
                </button>

                <button
                    onClick={() => setActiveTab('messages')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'messages' ? 'text-primary' : 'text-zinc-500 hover:text-white'}`}
                >
                    <Mail size={24} strokeWidth={activeTab === 'messages' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Mesajlar</span>
                </button>

                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'profile' ? 'text-primary' : 'text-zinc-500 hover:text-white'}`}
                >
                    <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Profil</span>
                </button>
            </div>
        </>
    );
}
