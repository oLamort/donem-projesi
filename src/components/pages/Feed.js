import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Plus, Link as LinkIcon, Image as ImageIcon, X, ExternalLink, User, MessageCircle, MoreHorizontal, Trash2, Edit2, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { useToast } from '@/components/Toast';
import LinkModal from '../modals/Link';
import CommentModal from '../modals/Comment';
import { formatRelativeTime } from '@/utils/date';

export default function Feed({ isLoading }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { addToast } = useToast();
    const [posts, setPosts] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);

    // Create Post State
    const [content, setContent] = useState('');
    const [postLinks, setPostLinks] = useState([]); // Array of {title, url}
    const [postImages, setPostImages] = useState([]); // Array of Files
    const [imagePreviews, setImagePreviews] = useState([]); // Array of URLs

    // Modals
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const fileInputRef = useRef(null);
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setFeedLoading(true);
        try {
            const res = await apiService.get('/posts');
            if (res.success) {
                setPosts(res.posts);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
        } finally {
            setFeedLoading(false);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files) {
            setPostImages([...postImages, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index) => {
        const newImages = [...postImages];
        newImages.splice(index, 1);
        setPostImages(newImages);

        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]); // Cleanup
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const removeLink = (index) => {
        const newLinks = [...postLinks];
        newLinks.splice(index, 1);
        setPostLinks(newLinks);
    };

    const handlePostSubmit = async () => {
        if (!content && postImages.length === 0 && postLinks.length === 0) return;

        const formData = new FormData();
        formData.append('content', content);

        postImages.forEach(file => {
            formData.append('images', file);
        });

        // Backend expects links as JSON string if sending FormData
        formData.append('links', JSON.stringify(postLinks));

        try {
            const res = await apiService.post('/posts', formData, {
                token: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.success) {
                setPosts([res.post, ...posts]);
                setContent('');
                setPostLinks([]);
                setPostImages([]);
                setImagePreviews([]);
                addToast({ message: 'Gönderi paylaşıldı!', type: 'success' });
            } else {
                addToast({ message: res.message || 'Paylaşım başarısız oldu.', type: 'error' });
            }
        } catch (error) {
            console.error(error);
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        }
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
                // Revert if failed (fetch original posts or simple revert logic)
                fetchPosts(); // Easy way out
            }
        } catch (error) {
            fetchPosts();
        }
    };

    const incrementCommentCount = (postId) => {
        setPosts(posts.map(p =>
            p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
        ));
    };

    if (isLoading || (feedLoading && posts.length === 0)) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Create Post Skeleton */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-3">
                            <div className="h-14 bg-white/5 rounded-xl w-full" />
                        </div>
                    </div>
                </div>
                {/* Post Skeleton */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-48" />
                ))}
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6 pb-20"
            >
                {/* Create Post */}
                {status === "loading" ? (
                    <motion.div layout variants={item} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5" />
                            <div className="flex-1 space-y-3">
                                <div className="h-14 bg-white/5 rounded-xl w-full" />
                            </div>
                        </div>
                    </motion.div>
                ) : status === "authenticated" && session ? (
                    <motion.div layout variants={item} className="bg-white/5 border border-white/10 rounded-2xl p-4 group transition-all duration-300">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                                {session.user.avatar ? (
                                    <img src={session.user.avatar} className="w-full h-full object-cover select-none" draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><User size={18} /></div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Takım veya oyuncu mu arıyorsun?"
                                    className="w-full bg-transparent text-white placeholder:text-zinc-500 resize-none outline-none min-h-[50px] focus:min-h-[100px] transition-all duration-300"
                                />

                                {/* Previews */}
                                <AnimatePresence>
                                    {(imagePreviews.length > 0 || postLinks.length > 0) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex flex-wrap gap-3 pb-2"
                                        >
                                            {imagePreviews.map((src, idx) => (
                                                <div key={`img-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden group/img">
                                                    <img src={src} className="w-full h-full object-cover select-none" draggable={false} />
                                                    <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover/img:opacity-100">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {postLinks.map((link, idx) => (
                                                <div key={`link-${idx}`} className="relative flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-bold group/link h-min">
                                                    <LinkIcon size={12} />
                                                    {link.title}
                                                    <button onClick={() => removeLink(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-300"
                                            title="Görsel Ekle"
                                        >
                                            <ImageIcon size={20} />
                                        </button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageSelect} />

                                        <button
                                            onClick={() => setIsLinkModalOpen(true)}
                                            className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-300"
                                            title="Bağlantı Ekle"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handlePostSubmit}
                                        disabled={!content && postImages.length === 0 && postLinks.length === 0}
                                        className="px-6 py-2 bg-primary text-black font-bold rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        Paylaş
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                        <p className="text-zinc-400">Paylaşım yapmak için <Link href="/auth" className="text-primary hover:underline">giriş yapmalısınız</Link>.</p>
                    </div>
                )}

                {/* Posts */}
                <AnimatePresence mode="popLayout">
                    {posts.map((post) => {
                        const author = post.author || {};
                        const isLiked = session && post.likes.includes(session.user._id || session.user.id);
                        return (
                            <motion.div
                                layout
                                key={post._id}
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors duration-300 relative group"
                            >
                                {/* Main Post Link */}
                                <Link href={`/post/${post._id}`} className="absolute inset-0 z-0" />

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 relative z-50">
                                    <div
                                        className="flex gap-3 cursor-pointer group/user"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.push(`/user/${author._id}`);
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0 group-hover/user:border-primary/50 transition-colors duration-300">
                                            {author.avatar ? (
                                                <img src={`${API_URL}${author.avatar}`} className="w-full h-full object-cover select-none" draggable={false} />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><User size={18} /></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-white text-sm sm:text-base group-hover/user:text-primary transition-colors duration-300">{author.username || 'Unknown User'}</span>
                                                <span className="text-zinc-600 text-xs">• {formatRelativeTime(post.createdAt)}</span>
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                {author.rank && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">{author.rank}</span>}
                                                {author.role && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">{author.role}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Menu */}
                                    {session?.user && (session.user._id === author._id || session.user.id === author._id) && (
                                        <div className="relative">
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
                                    )}
                                </div>

                                <div className="relative z-0 pointer-events-none">
                                    {editingPostId === post._id ? (
                                        <div className="mb-4 pointer-events-auto relative z-10" onClick={e => e.preventDefault()}>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-black/20 border border-primary/30 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-primary/50 transition-colors min-h-[100px] resize-none"
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

                                    {/* Images */}
                                    {post.images && post.images.length > 0 && (
                                        <div className={`grid gap-2 mb-4 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                            {post.images.map((img, idx) => (
                                                <div key={idx} className="rounded-xl overflow-hidden border border-white/5">
                                                    <img src={`${API_URL}${img}`} className="w-full h-full object-cover max-h-96 select-none" draggable={false} loading="lazy" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Links / Action Buttons */}
                                {post.links && post.links.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4 relative z-10 pointer-events-auto">
                                        {post.links.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-primary hover:text-black text-white rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-wide border border-white/10"
                                            >
                                                <ExternalLink size={14} />
                                                {link.title}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-6 pt-2 relative z-10 pointer-events-auto">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleLike(post._id);
                                        }}
                                        className={`flex items-center gap-2 transition-colors duration-300 group ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}
                                    >
                                        <Heart size={18} className={isLiked ? "fill-current" : ""} />
                                        <span className="text-xs">{post.likes.length}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveCommentPostId(post._id);
                                        }}
                                        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors duration-300"
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
                                        className="ml-auto flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors duration-300"
                                    >
                                        <Share2 size={18} />
                                        <span className="text-xs">Paylaş</span>
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            <LinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onAdd={(link) => setPostLinks([...postLinks, link])}
            />

            <CommentModal
                isOpen={!!activeCommentPostId}
                onClose={() => setActiveCommentPostId(null)}
                postId={activeCommentPostId}
                onCommentAdded={incrementCommentCount}
            />
        </>
    );
}
