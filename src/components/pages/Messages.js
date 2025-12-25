import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import socketService from '@/services/socket';
import { formatRelativeTime } from '@/utils/date';

export default function Messages({ isLoading, initialUserId }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Initialize Socket & Fetch Chats
    useEffect(() => {
        if (!session) return;

        // Connect socket with token
        const token = session.user?.apiToken;
        if (token) {
            socketService.connect(token);
        } else {
            console.warn("Socket connection failed: No API token found in session.");
        }

        const fetchChats = async () => {
            // Pass token: true to use the interceptor logic
            const res = await apiService.get('/chats', { token: true });
            if (res.success) {
                setChats(res.chats);
            }
        };

        fetchChats();

        socketService.socket?.on('chat_updated', (data) => {
            fetchChats();
        });

        return () => {
            socketService.socket?.off('chat_updated');
        };
    }, [session]);

    // Handle deep link / initial User
    useEffect(() => {
        if (initialUserId && session) {
            const initChat = async () => {
                const res = await apiService.post('/chats', { targetUserId: initialUserId }, { token: true });
                if (res.success) {
                    setActiveChat(res.chat);
                    fetchMessages(res.chat._id);
                    // Socket join logic handles in other effect

                    // Clean URL
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('userId');
                    newUrl.searchParams.delete('tab'); // Clean tab as well
                    router.replace(newUrl.pathname + newUrl.search);
                }
            };
            initChat();
        }
    }, [initialUserId, session]);

    // Fetch Messages when activeChat changes
    const fetchMessages = async (chatId) => {
        const res = await apiService.get(`/chats/${chatId}/messages`, { token: true });
        if (res.success) {
            setMessages(res.messages);
            scrollToBottom();

            // Mark as read
            apiService.post(`/chats/${chatId}/read`, {}, { token: true });

            // Update local chats state to remove badge immediately
            setChats(prev => prev.map(c => {
                if (c._id === chatId) {
                    const newCounts = { ...c.unreadCounts };
                    if (session?.user?.id) newCounts[session.user.id] = 0;
                    return { ...c, unreadCounts: newCounts };
                }
                return c;
            }));
        }
    };

    // Socket listeners for active chat
    useEffect(() => {
        if (!activeChat || !socketService.socket) return;

        socketService.socket.emit('join_chat', activeChat._id);

        const handleReceiveMessage = (message) => {
            if (message.chatId === activeChat._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();

                // Mark as read immediately if window is focused/active
                apiService.post(`/chats/${activeChat._id}/read`, {}, { token: true });
            }
        };

        socketService.socket.on('receive_message', handleReceiveMessage);

        return () => {
            if (socketService.socket && socketService.socket.connected) {
                socketService.socket.emit('leave_chat', activeChat._id);
                socketService.socket.off('receive_message', handleReceiveMessage);
            }
        };
    }, [activeChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || !socketService.socket) return;

        const content = newMessage;
        setNewMessage('');

        socketService.socket.emit('send_message', {
            chatId: activeChat._id,
            content
        });
    };

    const getOtherParticipant = (chat) => {
        const myId = session?.user?._id || session?.user?.id;
        return chat.participants.find(p => p._id !== myId && p.id !== myId) || {};
    };

    // Auth check - show message if not logged in
    if (status === "loading") {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl h-[80vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl h-[80vh] flex items-center justify-center p-20 text-white/50">
                <p>Mesajlarınızı görmek için lütfen giriş yapın.</p>
            </div>
        );
    }

    if (isLoading) return <div className="text-center p-10 text-zinc-500">Yükleniyor...</div>;

    if (activeChat) {
        const otherUser = getOtherParticipant(activeChat);
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl h-[80vh] flex flex-col overflow-hidden">
                {/* Chat Header - Minimal */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-zinc-900/50 backdrop-blur-md">
                    <button
                        onClick={() => setActiveChat(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                        {otherUser.avatar ? (
                            <img src={`${API_URL}${otherUser.avatar}`} className="w-full h-full object-cover select-none" draggable={false} />
                        ) : (
                            <div className="w-full h-full bg-zinc-800" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-tight">{otherUser.username || 'Unknown User'}</h3>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {messages.map((msg, idx) => {
                        const myId = session?.user?._id || session?.user?.id;
                        const isMe = msg.sender._id === myId || msg.sender === myId;
                        const isLast = idx === messages.length - 1;

                        return (
                            <div key={idx} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                    <div className={`px-4 py-2 relative ${isMe
                                        ? 'bg-primary text-black rounded-2xl rounded-tr-none'
                                        : 'bg-zinc-800 text-white rounded-2xl rounded-tl-none border border-white/5'
                                        }`}>
                                        <p className="text-sm break-words">{msg.content}</p>
                                    </div>

                                    {/* Timestamp & Icon Container */}
                                    <div className="flex flex-col items-end gap-0.5 mb-1">
                                        {/* Timestamp on Hover */}
                                        <span className={`text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                                            {formatRelativeTime(msg.createdAt)}
                                        </span>

                                        {isMe && isLast && (
                                            (() => {
                                                const currentChatData = chats.find(c => c._id === activeChat._id);
                                                const otherUser = getOtherParticipant(activeChat);
                                                const otherId = otherUser._id || otherUser.id;
                                                // If unread count is 0, they saw it
                                                const isSeen = currentChatData?.unreadCounts?.[otherId] === 0;
                                                return isSeen ? <CheckCheck size={14} className="text-blue-400" /> : <Check size={14} className="text-zinc-500" />;
                                            })()
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-zinc-900/50 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesaj yaz..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-primary text-black rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        );
    }

    // Chat List View
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Mesajlar</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chats.length > 0 ? (
                    chats.map(chat => {
                        const otherUser = getOtherParticipant(chat);
                        const myId = session?.user?._id || session?.user?.id;
                        const unreadCount = chat.unreadCounts?.[myId] || 0;
                        const lastMsg = chat.lastMessage;

                        let displayContent = <span className="italic text-zinc-600">Henüz mesaj yok</span>;
                        let isUnreadHighlight = false;

                        if (lastMsg) {
                            const isMyMsg = lastMsg.sender === myId || (lastMsg.sender && lastMsg.sender._id === myId);
                            if (isMyMsg) {
                                displayContent = <span className="text-zinc-400">Sen: {lastMsg.content}</span>;
                            } else {
                                // Received message
                                if (unreadCount > 0) {
                                    isUnreadHighlight = true;
                                    displayContent = <span className="text-yellow-400">{lastMsg.content}</span>;
                                } else {
                                    displayContent = <span className="text-zinc-400">{lastMsg.content}</span>;
                                }
                            }
                        }

                        return (
                            <div
                                key={chat._id}
                                onClick={() => {
                                    setActiveChat(chat);
                                    fetchMessages(chat._id);
                                }}
                                className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex gap-3 items-center group relative"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 group-hover:border-primary/50 transition-colors">
                                    {otherUser.avatar ? (
                                        <img src={`${API_URL}${otherUser.avatar}`} className="w-full h-full object-cover select-none" draggable={false} />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-white truncate">{otherUser.username}</h3>
                                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                                            {formatRelativeTime(chat.updatedAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm truncate pr-6">
                                        {displayContent}
                                    </p>
                                </div>

                                {unreadCount > 0 && (
                                    <div className="absolute right-4 bottom-4 w-5 h-5 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                            <Send size={24} className="opacity-50" />
                        </div>
                        <p>Henüz hiç sohbetiniz yok.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
