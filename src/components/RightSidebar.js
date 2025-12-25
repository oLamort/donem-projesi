import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Plus, User, Check } from 'lucide-react';
import apiService from '@/services/api';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';

export default function RightSidebar() {
    const { data: session } = useSession();
    const { addToast } = useToast();
    const [popularPlayers, setPopularPlayers] = useState([]);
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    useEffect(() => {
        fetchPopularUsers();
    }, [session]);

    const fetchPopularUsers = async () => {
        try {
            const res = await apiService.get('/public/popular-users', { token: !!session });
            if (res.success) {
                setPopularPlayers(res.users);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleFollow = async (e, userId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            return addToast({ message: 'Takip etmek için giriş yapmalısınız.', type: 'info' });
        }

        try {
            const res = await apiService.post(`/public/users/${userId}/follow`, {}, { token: true });

            if (res.success) {
                setPopularPlayers(prev => prev.map(p => {
                    if (p._id === userId) {
                        return { ...p, isFollowing: true, followerCount: (p.followerCount || 0) + 1 };
                    }
                    return p;
                }));
                addToast({ message: 'Takip edildi!', type: 'success' });
            }
        } catch (error) {
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Popular Players */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    Popüler Oyuncular
                </h3>

                <div className="space-y-4">
                    {popularPlayers.length > 0 ? popularPlayers.map((player) => {
                        const isMe = session?.user?.id === player._id || session?.user?._id === player._id;

                        return (
                            <Link key={player._id} href={`/user/${player._id}`} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-zinc-800 flex items-center justify-center font-bold text-white/50 group-hover:border-primary/50 transition-colors">
                                        {player.avatar ? (
                                            <img src={`${API_URL}${player.avatar}`} className="w-full h-full object-cover select-none" draggable={false} />
                                        ) : (
                                            <User size={18} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{player.username}</div>
                                        <div className="text-xs text-zinc-500">
                                            {[player.rank, player.role].filter(Boolean).join(' • ')}
                                        </div>
                                    </div>
                                </div>

                                {!player.isFollowing && !isMe && (
                                    <button
                                        onClick={(e) => handleFollow(e, player._id)}
                                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white hover:text-black transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}

                                {player.isFollowing && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary/50">
                                        <Check size={16} />
                                    </div>
                                )}
                            </Link>
                        );
                    }) : (
                        <div className="text-zinc-500 text-sm">Oyuncu bulunamadı.</div>
                    )}
                </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-2">
                <div className="w-full text-[11px] text-zinc-500">© 2025 LFT Türkiye</div>
            </div>
        </div>
    );
}
