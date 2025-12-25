'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User as UserIcon, Calendar, Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
import apiService from '@/services/api';
import { useToast } from '@/components/Toast';
import { formatRelativeTime } from '@/utils/date';
import Link from 'next/link';
import UserListModal from '@/components/modals/UserList';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { addToast } = useToast();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, tab: 'followers' });

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    useEffect(() => {
        if (params.id) {
            fetchUser();
            fetchUserPosts();
        }
    }, [params.id, session]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await apiService.get(`/public/users/${params.id}`, { token: !!session });
            if (res.success) {
                setUser(res.user);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        setPostsLoading(true);
        try {
            const res = await apiService.get(`/public/users/${params.id}/posts`);
            if (res.success) {
                setPosts(res.posts);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setPostsLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!session) return addToast({ message: 'Takip etmek için giriş yapmalısınız.', type: 'info' });

        try {
            const res = await apiService.post(`/public/users/${params.id}/follow`, {}, { token: true });
            if (res.success) {
                setUser(prev => ({
                    ...prev,
                    isFollowing: res.isFollowing,
                    followerCount: res.isFollowing ? prev.followerCount + 1 : prev.followerCount - 1
                }));
                addToast({ message: res.message, type: 'success' });
            }
        } catch (error) {
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen text-white flex flex-col items-center justify-center">
                <UserIcon size={48} className="mb-4 opacity-20" />
                <p>Kullanıcı bulunamadı.</p>
                <button onClick={() => router.push('/')} className="mt-4 text-primary hover:underline">Ana Sayfaya Dön</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans selection:bg-primary/30 flex flex-col items-center pt-24 pb-10">
            <UserListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                userId={user._id}
                initialTab={modalConfig.tab}
            />

            <div className="w-full max-w-2xl px-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors duration-300">
                    <ArrowLeft size={20} />
                    Geri Dön
                </button>

                {/* Profile Header Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative mb-6">
                    {/* Banner */}
                    <div className="h-32 sm:h-40 bg-zinc-900 relative">
                        {user.banner ? (
                            <img src={`${API_URL}${user.banner}`} alt="Banner" className="w-full h-full object-cover select-none" draggable={false} />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-blue-600/10" />
                        )}
                    </div>

                    <div className="px-6 pb-6 relative">
                        {/* Avatar & Infos */}
                        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10 sm:-mt-12 mb-4">
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-[#1C1C19] bg-zinc-800 overflow-hidden shadow-xl">
                                    {user.avatar ? (
                                        <img src={`${API_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover select-none" draggable={false} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                                            <UserIcon size={32} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 w-full pt-2 sm:pt-14">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            {user.username}
                                        </h2>

                                        <div className="flex gap-2 mt-1.5 mb-1">
                                            {user.rank && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                    {user.rank}
                                                </span>
                                            )}
                                            {user.role && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    {user.role}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 my-3">
                                            <button onClick={() => setModalConfig({ isOpen: true, tab: 'followers' })} className="hover:text-white transition-colors group">
                                                <span className="font-bold text-white group-hover:text-primary transition-colors">{user.followerCount || 0}</span>
                                                <span className="text-zinc-500 text-xs ml-1 group-hover:text-zinc-300">Takipçi</span>
                                            </button>
                                            <button onClick={() => setModalConfig({ isOpen: true, tab: 'following' })} className="hover:text-white transition-colors group">
                                                <span className="font-bold text-white group-hover:text-primary transition-colors">{user.followingCount || 0}</span>
                                                <span className="text-zinc-500 text-xs ml-1 group-hover:text-zinc-300">Takip</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {session?.user?.id !== user._id && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleFollow}
                                                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${user.isFollowing
                                                    ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                    : 'bg-primary text-black hover:brightness-110'
                                                    }`}
                                            >
                                                {user.isFollowing ? 'Takibi Bırak' : 'Takip Et'}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/?tab=messages&userId=${user._id}`)}
                                                className="px-4 py-1.5 rounded-xl font-bold text-xs transition-all bg-white/5 text-white hover:bg-white/10 border border-white/10 flex items-center gap-2"
                                            >
                                                <MessageCircle size={14} />
                                                Mesaj
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2">
                                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                                        {user.bio || "Henüz bir biyografi eklenmemiş."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        <span>Katılım: {new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Section */}
                <h3 className="text-lg font-bold text-white mb-4">Gönderiler</h3>

                <div className="space-y-4">
                    {postsLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : posts.length > 0 ? (
                        posts.map((post) => (
                            <motion.div
                                key={post._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors relative group"
                            >
                                <Link href={`/post/${post._id}`} className="absolute inset-0 z-0" />

                                <div className="flex justify-between items-start mb-4 relative z-10 pointer-events-none">
                                    <div className="flex gap-3 pointer-events-auto">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                                            {user.avatar ?
                                                <img src={`${API_URL}${user.avatar}`} className="w-full h-full object-cover select-none" draggable={false} /> :
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><UserIcon size={18} /></div>
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">{user.username}</span>
                                                <span className="text-zinc-600 text-xs">• {formatRelativeTime(post.createdAt)}</span>
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                {user.rank && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                        {user.rank}
                                                    </span>
                                                )}
                                                {user.role && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {user.role}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-zinc-300 text-sm leading-relaxed mb-4 relative z-10 pointer-events-none whitespace-pre-wrap">
                                    {post.content}
                                </p>

                                <div className="flex items-center gap-6 pt-2 relative z-10 pointer-events-none">
                                    <button className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors group pointer-events-auto">
                                        <Heart size={18} className={post.likes && post.likes.includes(session?.user?.id) ? "fill-red-500 text-red-500" : "group-hover:fill-current"} />
                                        <span className="text-xs">{post.likes ? post.likes.length : 0}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors pointer-events-auto">
                                        <MessageCircle size={18} />
                                        <span className="text-xs">{post.commentCount || 0}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Share logic
                                            const url = `${window.location.origin}/post/${post._id}`;
                                            navigator.clipboard.writeText(url);
                                            addToast({ message: 'Bağlantı kopyalandı!', type: 'success' });
                                        }}
                                        className="ml-auto flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors pointer-events-auto"
                                    >
                                        <Share2 size={18} />
                                        <span className="text-xs">Paylaş</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-zinc-500 bg-white/5 rounded-2xl border border-white/10">
                            <p>Kullanıcının henüz gönderisi yok.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
