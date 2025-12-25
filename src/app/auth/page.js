'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';

function AuthContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useToast();
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const registerParam = searchParams.get('register');
        if (registerParam === 'true') {
            setIsRegister(true);
        } else {
            setIsRegister(false);
        }

        // Show success message if redirected from register
        // Although we are on single page now, standard might be to set mode to login after register success
        if (searchParams.get('registered') === 'true') {
            // Maybe show a toast or message. For now let's just ensure we are in login mode
            setIsRegister(false);
        }
    }, [searchParams]);

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                // Register Logic
                const response = await apiService.post('/auth/register', { username, email, password });
                if (response.success) {
                    setIsRegister(false); // Switch to login
                    setError(''); // Clear any errors
                    addToast({
                        message: "Kayıt başarılı! Lütfen giriş yapın.",
                        type: 'success'
                    });
                } else {
                    const msg = response.message || 'Kayıt başarısız oldu.';
                    setError(msg);
                    addToast({
                        message: msg,
                        type: 'error'
                    });
                }
            } else {
                // Login Logic
                const result = await signIn('credentials', {
                    username,
                    password,
                    redirect: false
                });

                if (result.error) {
                    const msg = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
                    setError(msg);
                    addToast({
                        message: msg,
                        type: 'error'
                    });
                } else {
                    addToast({
                        message: "Giriş başarılı! Yönlendiriliyorsunuz...",
                        type: 'success'
                    });
                    // Small delay to let toast show
                    setTimeout(() => {
                        router.push('/');
                        router.refresh();
                    }, 500);
                }
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Bir hata oluştu.';
            setError(msg);
            addToast({
                message: msg,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ layout: { duration: 0.3, type: "spring", bounce: 0.2 } }}
                className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 relative z-10 shadow-2xl"
            >
                {/* Header */}
                <div className="text-center mb-8 h-24">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="font-bold text-black text-xl">V</span>
                        </div>
                    </Link>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isRegister ? 'register-text' : 'login-text'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {isRegister ? 'Aramıza Katıl' : 'Tekrar Hoşgeldin'}
                            </h1>
                            <p className="text-zinc-400 text-sm">
                                {isRegister
                                    ? 'Topluluğun bir parçası ol.'
                                    : 'Hesabına giriş yap ve takımı kur.'}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 p-1 bg-black/20 rounded-xl mb-6 relative">
                    <button
                        onClick={() => setIsRegister(false)}
                        className={`relative z-10 py-2.5 text-sm font-medium transition-colors ${!isRegister ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {!isRegister && (
                            <motion.div
                                layoutId="tab-bg"
                                className="absolute inset-0 bg-white/10 rounded-lg shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">Giriş Yap</span>
                    </button>
                    <button
                        onClick={() => setIsRegister(true)}
                        className={`relative z-10 py-2.5 text-sm font-medium transition-colors ${isRegister ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {isRegister && (
                            <motion.div
                                layoutId="tab-bg"
                                className="absolute inset-0 bg-white/10 rounded-lg shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">Kayıt Ol</span>
                    </button>
                </div>

                {/* Error Box */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400 ml-1">Kullanıcı Adı</label>
                        <div className="relative group">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="ValoGod"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:border-primary/50 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {isRegister && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-semibold text-zinc-400 ml-1">E-posta</label>
                                    <div className="relative group">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="ornek@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:border-primary/50 outline-none transition-all"
                                            required={isRegister}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-1.5 pb-2">
                        <label className="text-xs font-semibold text-zinc-400 ml-1">Şifre</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-zinc-600 focus:border-primary/50 outline-none transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:brightness-110 text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={isRegister ? 'btn-register' : 'btn-login'}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                            >
                                {loading
                                    ? (isRegister ? 'Kaydediliyor...' : 'Giriş Yapılıyor...')
                                    : (isRegister ? 'Kayıt Ol' : 'Giriş Yap')
                                }
                            </motion.span>
                        </AnimatePresence>
                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center mt-6 text-sm text-zinc-500">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={isRegister ? 'footer-reg' : 'footer-login'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {isRegister ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
                        </motion.span>
                    </AnimatePresence>
                    <button
                        onClick={toggleMode}
                        type="button"
                        className="text-white font-semibold ml-1 hover:text-primary transition-colors inline-block"
                    >
                        {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                    </button>
                </p>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                        <ArrowRight size={14} className="group-hover:-translate-x-1 transition-transform rotate-180" />
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-white">Yükleniyor...</div>}>
            <AuthContent />
        </Suspense>
    )
}
