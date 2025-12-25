import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User } from 'lucide-react';
import apiService from '@/services/api';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';
import { formatRelativeTime } from '@/utils/date';

export default function CommentModal({ isOpen, onClose, postId, onCommentAdded }) {
    const { data: session } = useSession();
    const { addToast } = useToast();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await apiService.get(`/posts/${postId}/comments`);
            if (res.success) {
                setComments(res.comments);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await apiService.post(`/posts/${postId}/comments`, { content: newComment }, { token: true });
            if (res.success) {
                setComments([res.comment, ...comments]);
                setNewComment('');
                if (onCommentAdded) onCommentAdded(postId); // Notify parent to update count
            } else {
                addToast({ message: res.message || 'Yorum eklenemedi.', type: 'error' });
            }
        } catch (error) {
            addToast({ message: 'Bir hata oluştu.', type: 'error' });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-[#141412] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                    >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1C1C19]">
                            <h3 className="font-bold text-white">Yorumlar</h3>
                            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all z-20">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading && comments.length === 0 ? (
                                <div className="text-center text-zinc-500 py-10">Yükleniyor...</div>
                            ) : comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                                            {comment.author.avatar ? (
                                                <img src={`${API_URL}${comment.author.avatar}`} className="w-full h-full object-cover select-none" draggable={false} loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><User size={14} className="text-zinc-500" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/5">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-white text-sm">{comment.author.username}</span>
                                                    <span className="text-[10px] text-zinc-500">{formatRelativeTime(comment.createdAt)}</span>
                                                </div>
                                                <p className="text-zinc-300 text-sm">{comment.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-zinc-500 py-10">Henüz yorum yok. İlk yorumu sen yap!</div>
                            )}
                        </div>

                        {session ? (
                            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-[#1C1C19] flex gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 hidden sm:block">
                                    {session.user.avatar ? (
                                        <img src={session.user.avatar} className="w-full h-full object-cover select-none" draggable={false} />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><User size={14} className="text-zinc-500" /></div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Bir yorum yaz..."
                                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-primary/50 transition-colors duration-300"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="p-2 bg-primary text-black rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 border-t border-white/10 bg-[#1C1C19] text-center text-sm text-zinc-500">
                                Yorum yapmak için giriş yapmalısınız.
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
