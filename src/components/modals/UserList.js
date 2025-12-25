'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Loader2 } from 'lucide-react';
import apiService from '@/services/api';
import { useSession } from 'next-auth/react';

export default function UserListModal({ isOpen, onClose, userId, initialTab = 'followers' }) {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState(initialTab); // 'followers', 'following'
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && userId) {
            setActiveTab(initialTab);
            fetchList(initialTab);
        }
    }, [isOpen, userId, initialTab]);

    const fetchList = async (type) => {
        setLoading(true);
        setActiveTab(type);
        try {
            const res = await apiService.get(`/public/users/${userId}/${type}`);
            if (res.success) {
                setList(res.users);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-[#141412] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1C1C19]">
                        <div className="flex gap-4">
                            <button
                                onClick={() => fetchList('followers')}
                                className={`text-sm font-bold transition-colors ${activeTab === 'followers' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Takipçiler
                            </button>
                            <button
                                onClick={() => fetchList('following')}
                                className={`text-sm font-bold transition-colors ${activeTab === 'following' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Takip Edilenler
                            </button>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-zinc-500" size={24} />
                            </div>
                        ) : list.length > 0 ? (
                            <div className="space-y-1">
                                {list.map(u => (
                                    <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/5 group-hover:border-white/10">
                                            {u.avatar ? (
                                                <img src={`${API_URL}${u.avatar}`} className="w-full h-full object-cover select-none" draggable={false} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><User size={18} className="text-zinc-500" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{u.username}</div>
                                            <div className="flex gap-2">
                                                {u.rank && (
                                                    <span className="text-[10px] text-zinc-500">{u.rank}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-zinc-500 text-sm">
                                {activeTab === 'followers' ? 'Henüz takipçi yok.' : 'Henüz kimseyi takip etmiyor.'}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
