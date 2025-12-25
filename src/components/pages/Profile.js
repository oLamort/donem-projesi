'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Edit2, Save, X, Calendar, User as UserIcon, Heart, MessageCircle, Share2, Trophy, MoreHorizontal, Trash2 } from 'lucide-react';
import apiService from '@/services/api';
import { useToast } from '@/components/Toast';
import CustomSelect from '../CustomSelect';
import UserListModal from '../modals/UserList';
import CommentModal from '../modals/Comment';
import { formatRelativeTime } from '@/utils/date';
import Link from 'next/link';

export default function Profile({ isLoading }) {
    const { data: session, update: updateSession } = useSession();
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, tab: 'followers' });

    // Posts State
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // Form States
    const [bio, setBio] = useState('');
    const [rank, setRank] = useState('');
    const [role, setRole] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);

    // Preview States
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    // UI States
    const [activeSelect, setActiveSelect] = useState(null);
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);

    // Post Actions State
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLike = async (postId) => {
        if (!session) return addToast({ message: 'Beğenmek için giriş yapmalısınız.', type: 'info' });

        // Optimistic update
        const updatedPosts = posts.map(post => {
            if (post._id === postId) {
                const isLiked = post.likes.includes(session.user._id || session.user.id);
                const newLikes = isLiked
                    ? post.likes.filter(id => id !== (session.user._id || session.user.id))
                    : [...post.likes, (session.user._id || session.user.id)];
                return { ...post, likes: newLikes };
            }
            return post;
        });
        setPosts(updatedPosts);

        try {
            const res = await apiService.post(`/posts/${postId}/like`, {}, { token: true });
            if (!res.success) {
                // Revert or simple fetch
                // fetchPosts(); // We can define fetchPosts outside or just ignore for now as simplistic
            }
        } catch (error) {
            console.error(error);
        }
    };

    const incrementCommentCount = (postId) => {
        setPosts(posts.map(p =>
            p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
        ));
    };

    const handleDeletePost = async (postId) => {
        try {
            const res = await apiService.delete(`/posts/${postId}`, { token: true });
            if (res.success) {
                setPosts(posts.filter(p => p._id !== postId));
                addToast({ message: 'Gönderi silindi.', type: 'success' });
            } else {
                addToast({ message: res.message || 'Silinemedi.', type: 'error' });
            }
        } catch (error) {
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        }
    };

    const handleEditStart = (post, e) => {
        e.stopPropagation();
        setEditingPostId(post._id);
        setEditContent(post.content);
        setOpenMenuId(null);
    };

    const handleEditSave = async (postId) => {
        try {
            const res = await apiService.put(`/posts/${postId}`, { content: editContent }, { token: true });
            if (res.success) {
                setPosts(posts.map(p => p._id === postId ? res.post : p));
                setEditingPostId(null);
                setEditContent('');
                addToast({ message: 'Gönderi güncellendi.', type: 'success' });
            } else {
                addToast({ message: res.message || 'Güncellenemedi.', type: 'error' });
            }
        } catch (error) {
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        }
    };

    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    // Initial Data
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiService.get('/profile', { token: true });
                if (response.success && response.user) {
                    setProfileData(response.user);

                    // Sync initial form state
                    if (response.user.bio) setBio(response.user.bio);
                    if (response.user.rank) setRank(response.user.rank);
                    if (response.user.role) setRole(response.user.role);
                    if (response.user.avatar) setAvatarPreview(`${API_URL}${response.user.avatar}`);
                    if (response.user.banner) setBannerPreview(`${API_URL}${response.user.banner}`);
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };

        const fetchPosts = async () => {
            setLoadingPosts(true);
            try {
                const res = await apiService.get('/posts/my-posts', { token: true });
                if (res.success) {
                    setPosts(res.posts);
                }
            } catch (error) {
                console.error("Failed to fetch posts", error);
            } finally {
                setLoadingPosts(false);
            }
        };

        if (session) {
            fetchProfile();
            fetchPosts();
        }
    }, [session, API_URL]);

    const displayUser = profileData || session?.user || {};

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'avatar') {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        const formData = new FormData();

        formData.append('bio', bio);
        formData.append('rank', rank);
        formData.append('role', role);
        if (avatarFile) formData.append('avatar', avatarFile);
        if (bannerFile) formData.append('banner', bannerFile);

        try {
            const response = await apiService.put('/profile', formData, {
                token: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.success) {
                addToast({ message: 'Profil güncellendi!', type: 'success' });
                setIsEditing(false);
                setProfileData(response.user);

                // Construct full URLs for session
                const updatedUser = { ...response.user };
                if (updatedUser.avatar && !updatedUser.avatar.startsWith('http')) {
                    updatedUser.avatar = `${API_URL}${updatedUser.avatar}`;
                }
                if (updatedUser.banner && !updatedUser.banner.startsWith('http')) {
                    updatedUser.banner = `${API_URL}${updatedUser.banner}`;
                }

                // Update Session
                await updateSession({
                    ...session,
                    user: {
                        ...session.user,
                        ...updatedUser
                    }
                });
            } else {
                const msg = response.message || 'Güncelleme başarısız.';
                addToast({ message: msg, type: 'error' });
            }
        } catch (error) {
            console.error(error);
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setBio(displayUser.bio || '');
        setRank(displayUser.rank || '');
        setRole(displayUser.role || '');
        setAvatarFile(null);
        setBannerFile(null);
        setAvatarPreview(displayUser.avatar ? `${API_URL}${displayUser.avatar}` : null);
        setBannerPreview(displayUser.banner ? `${API_URL}${displayUser.banner}` : null);
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center p-20 text-white/50">
                <p>Profilinizi görmek için lütfen giriş yapın.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-48 bg-white/5 rounded-2xl w-full" />
                <div className="flex gap-4 px-4">
                    <div className="w-24 h-24 rounded-full bg-white/5 -mt-12 border-4 border-background" />
                    <div className="flex-1 space-y-2 mt-2">
                        <div className="h-6 w-32 bg-white/5 rounded" />
                        <div className="h-4 w-24 bg-white/5 rounded" />
                    </div>
                </div>
            </div>
        )
    }

    const rankOptions = [
        'Radiant', 'Immortal', 'Ascendant', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Iron'
    ];

    const agentOptions = [
        'Flex', 'Controller', 'Duelist', 'Initiator', 'Sentinel'
    ];

    return (
        <div className="space-y-6 pb-20">
            <UserListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                userId={displayUser.id || displayUser._id}
                initialTab={modalConfig.tab}
            />

            {/* Profile Header Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden relative">
                {/* Banner */}
                <div className="h-40 md:h-52 bg-zinc-900 group relative">
                    {bannerPreview ? (
                        <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover select-none" draggable={false} />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary/10 to-blue-600/10" />
                    )}

                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => bannerInputRef.current.click()}>
                            <Camera size={24} className="text-white drop-shadow-lg" />
                            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar & Infos */}
                    <div className="flex flex-col md:flex-row items-start gap-4 -mt-12 md:-mt-16 mb-4">
                        <div className="relative group shrink-0">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-[#1C1C19] bg-zinc-800 overflow-hidden shadow-xl">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover select-none" draggable={false} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                                        <UserIcon size={40} />
                                    </div>
                                )}
                            </div>
                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent" onClick={() => avatarInputRef.current.click()}>
                                    <Camera size={20} className="text-white" />
                                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 w-full pt-14 md:pt-16">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                        {displayUser.username}
                                    </h2>

                                    <div className="flex gap-2 mt-1.5 mb-1">
                                        {displayUser.rank && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                {displayUser.rank}
                                            </span>
                                        )}
                                        {displayUser.role && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {displayUser.role}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-zinc-500 text-sm">{displayUser.email}</p>

                                    <div className="flex items-center gap-4 my-3">
                                        <button onClick={() => setModalConfig({ isOpen: true, tab: 'followers' })} className="hover:text-white transition-colors duration-300 group">
                                            <span className="font-bold text-white group-hover:text-primary transition-colors duration-300">{displayUser.followerCount || 0}</span>
                                            <span className="text-zinc-500 text-xs ml-1 group-hover:text-zinc-300">Takipçi</span>
                                        </button>
                                        <button onClick={() => setModalConfig({ isOpen: true, tab: 'following' })} className="hover:text-white transition-colors group">
                                            <span className="font-bold text-white group-hover:text-primary transition-colors duration-300">{displayUser.followingCount || 0}</span>
                                            <span className="text-zinc-500 text-xs ml-1 group-hover:text-zinc-300">Takip</span>
                                        </button>
                                    </div>
                                </div>
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} className="flex items-center p-2 md:px-4 md:py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors duration-300">
                                        <Edit2 size={16} /> <span className="hidden md:inline ml-2 text-sm font-medium">Düzenle</span>
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={cancelEdit} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><X size={20} /></button>
                                        <button onClick={handleSubmit} className="p-2 bg-primary text-black rounded-xl hover:brightness-110"><Save size={20} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-4">
                                {isEditing && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <CustomSelect
                                            label="Rank"
                                            icon={Trophy}
                                            options={rankOptions}
                                            value={rank}
                                            onChange={setRank}
                                            placeholder="Rank Seçin"
                                            isOpen={activeSelect === 'rank'}
                                            onOpenChange={(open) => setActiveSelect(open ? 'rank' : null)}
                                        />
                                        <CustomSelect
                                            label="Ajan Rolü"
                                            icon={UserIcon}
                                            options={agentOptions}
                                            value={role}
                                            onChange={setRole}
                                            placeholder="Rol Seçin"
                                            isOpen={activeSelect === 'agent'}
                                            onOpenChange={(open) => setActiveSelect(open ? 'agent' : null)}
                                        />
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 ml-1">Biyografi</label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-zinc-300 focus:border-primary/50 outline-none resize-none h-24"
                                            placeholder="Kendinden bahset..."
                                        />
                                    </div>
                                ) : (
                                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                                        {bio || "Henüz bir biyografi eklenmemiş."}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-zinc-500">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>Katılım: {new Date(displayUser.createdAt || Date.now()).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Tabs / Content */}
            <h3 className="text-lg font-bold text-white px-2">Gönderiler</h3>

            {loadingPosts ? (
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
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors duration-300 relative group"
                    >
                        <Link href={`/post/${post._id}`} className="absolute inset-0 z-0" />

                        <div className="flex justify-between items-start mb-4 relative z-50 pointer-events-none">
                            <div className="flex gap-3 pointer-events-auto">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                    {displayUser.avatar ?
                                        <img src={`${API_URL}${displayUser.avatar}`} className="w-full h-full object-cover select-none" draggable={false} /> :
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><UserIcon size={18} /></div>
                                    }
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm">{displayUser.username}</span>
                                        <span className="text-zinc-600 text-xs">• {formatRelativeTime(post.createdAt)}</span>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        {displayUser.rank && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                {displayUser.rank}
                                            </span>
                                        )}
                                        {displayUser.role && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {displayUser.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Menu */}
                            <div className="relative pointer-events-auto">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.nativeEvent.stopImmediatePropagation();
                                        setOpenMenuId(openMenuId === post._id ? null : post._id);
                                    }}
                                    className="text-zinc-500 hover:text-white p-1 transition-colors duration-300"
                                >
                                    <MoreHorizontal size={20} />
                                </button>

                                {openMenuId === post._id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute right-0 top-full mt-2 w-44 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 z-[100]"
                                    >
                                        <button
                                            onClick={(e) => handleEditStart(post, e)}
                                            disabled={Date.now() - new Date(post.createdAt).getTime() > 24 * 60 * 60 * 1000}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                        >
                                            <Edit2 size={16} className="text-zinc-500 group-hover/btn:text-white transition-colors duration-300" />
                                            <span>Düzenle</span>
                                            {Date.now() - new Date(post.createdAt).getTime() > 24 * 60 * 60 * 1000 && (
                                                <span className="ml-auto text-[9px] text-zinc-600 font-normal">Süre doldu</span>
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeletePost(post._id);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-300 text-left mt-0.5 group/btn"
                                        >
                                            <Trash2 size={16} className="text-red-500/70 group-hover/btn:text-red-400 transition-colors duration-300" />
                                            <span>Sil</span>
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        <div className="relative z-0 pointer-events-none">
                            {editingPostId === post._id ? (
                                <div className="mb-4 pointer-events-auto relative z-10" onClick={e => e.preventDefault()}>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-black/20 border border-primary/30 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-primary/50 transition-colors duration-300 min-h-[100px] resize-none"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPostId(null);
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditSave(post._id);
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:brightness-110 flex items-center gap-1"
                                        >
                                            <Save size={14} /> Kaydet
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-zinc-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                    {post.content}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-6 pt-2 relative z-10 pointer-events-none">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleLike(post._id);
                                }}
                                className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors duration-300 group pointer-events-auto"
                            >
                                <Heart size={18} className={post.likes.includes(session?.user?._id || session?.user?.id) ? "fill-red-500 text-red-500" : ""} />
                                <span className="text-xs">{post.likes.length}</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveCommentPostId(post._id);
                                }}
                                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors duration-300 pointer-events-auto"
                            >
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
                                className="ml-auto flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors duration-300 pointer-events-auto"
                            >
                                <Share2 size={18} />
                                <span className="text-xs">Paylaş</span>
                            </button>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="text-center py-10 text-zinc-500">
                    <p>Henüz hiç gönderi paylaşmadınız.</p>
                </div>
            )}

            <CommentModal
                isOpen={!!activeCommentPostId}
                onClose={() => setActiveCommentPostId(null)}
                postId={activeCommentPostId}
                onCommentAdded={incrementCommentCount}
            />
        </div>
    );
}
