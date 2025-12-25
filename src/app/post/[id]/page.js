'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, User, ExternalLink, ArrowLeft, Loader2, Send } from 'lucide-react';
import apiService from '@/services/api';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';
import { formatRelativeTime } from '@/utils/date';

export default function PostPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { addToast } = useToast();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const commentInputRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    useEffect(() => {
        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const fetchData = async () => {
        setLoading(true);
        setCommentsLoading(true);
        try {
            // Fetch Post
            const postRes = await apiService.get(`/posts/${params.id}`);
            if (postRes.success) {
                setPost(postRes.post);
            } else {
                addToast({ message: 'Gönderi bulunamadı.', type: 'error' });
                router.push('/');
                return;
            }

            // Fetch Comments
            const commentsRes = await apiService.get(`/posts/${params.id}/comments`);
            if (commentsRes.success) {
                setComments(commentsRes.comments);
            }
        } catch (error) {
            console.error(error);
            router.push('/');
        } finally {
            setLoading(false);
            setCommentsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!session) return addToast({ message: 'Beğenmek için giriş yapmalısınız.', type: 'info' });

        const isLiked = post.likes.includes(session.user._id || session.user.id);
        const newLikes = isLiked
            ? post.likes.filter(id => id !== (session.user._id || session.user.id))
            : [...post.likes, (session.user._id || session.user.id)];

        setPost({ ...post, likes: newLikes });

        try {
            await apiService.post(`/posts/${post._id}/like`, {}, { token: true });
        } catch (error) {
            // Revert state if necessary, or just refetch
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!session) return addToast({ message: 'Yorum yapmak için giriş yapmalısınız.', type: 'info' });
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const res = await apiService.post(`/posts/${post._id}/comments`, { content: newComment }, { token: true });
            if (res.success) {
                setComments([res.comment, ...comments]);
                setPost(curr => ({ ...curr, commentCount: (curr.commentCount || 0) + 1 }));
                setNewComment('');
                addToast({ message: 'Yorum gönderildi!', type: 'success' });
            } else {
                addToast({ message: res.message || 'Yorum gönderilemedi.', type: 'error' });
            }
        } catch (error) {
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!post) return null;

    const isLiked = session && post.likes.includes(session.user._id || session.user.id);

    return (
        <div className="min-h-screen text-white font-sans selection:bg-primary/30 flex flex-col items-center pt-24 pb-10">

            <div className="w-full max-w-2xl px-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors duration-300">
                    <ArrowLeft size={20} />
                    Geri Dön
                </button>

                {/* Main Post Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300 mb-6"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                                {post.author.avatar ? (
                                    <img src={`${API_URL}${post.author.avatar}`} className="w-full h-full object-cover select-none" draggable={false} />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><User size={18} /></div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-white text-sm sm:text-base">{post.author.username}</span>
                                    <span className="text-zinc-600 text-xs">• {formatRelativeTime(post.createdAt)}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    {post.author.rank && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">{post.author.rank}</span>}
                                    {post.author.role && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">{post.author.role}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <p className="text-zinc-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        {post.content}
                    </p>

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

                    {/* Links */}
                    {post.links && post.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.links.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-primary hover:text-black text-white rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-wide border border-white/10"
                                >
                                    <ExternalLink size={14} />
                                    {link.title}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-6 pt-2">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-colors duration-300 group ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}
                        >
                            <Heart size={18} className={isLiked ? "fill-current" : "group-hover:fill-current"} />
                            <span className="text-xs">{post.likes.length}</span>
                        </button>
                        <button
                            onClick={() => commentInputRef.current?.focus()}
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

                {/* Comment Input */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                        {session?.user?.avatar ? (
                            <img src={session.user.avatar} className="w-full h-full object-cover select-none" draggable={false} />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><User size={18} /></div>
                        )}
                    </div>
                    <form onSubmit={handleCommentSubmit} className="flex-1 flex gap-2">
                        <input
                            ref={commentInputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={session ? "Bir yorum yaz..." : "Yorum yapmak için giriş yapın"}
                            disabled={!session || submittingComment}
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-500"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submittingComment}
                            className="text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submittingComment ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Yorumlar ({comments.length})</h3>

                    {commentsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-zinc-500" size={24} />
                        </div>
                    ) : comments.length > 0 ? (
                        <AnimatePresence>
                            {comments.map((comment, index) => (
                                <motion.div
                                    key={comment._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                                        {comment.author.avatar ? (
                                            <img src={`${API_URL}${comment.author.avatar}`} className="w-full h-full object-cover select-none" draggable={false} />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><User size={18} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white text-sm">{comment.author.username}</span>
                                            <span className="text-zinc-500 text-xs">• {formatRelativeTime(comment.createdAt)}</span>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            {comment.author.rank && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-zinc-400 border border-white/10">{comment.author.rank}</span>}
                                        </div>
                                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center text-zinc-500 py-8 bg-white/5 rounded-2xl border border-white/10">
                            Henüz yorum yapılmamış. İlk yorumu sen yap!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
