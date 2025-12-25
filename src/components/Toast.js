'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext({});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }) {
    const { id, message, type } = toast;

    const styles = {
        success: 'border-primary text-primary',
        error: 'border-red-500 text-red-500',
        info: 'border-blue-400 text-blue-400',
        warning: 'border-orange-400 text-orange-400',
    };

    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        info: <Info size={20} />,
        warning: <AlertCircle size={20} />,
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: 'spring', warning: 0.5, bounce: 0.3 }}
            className={`
                pointer-events-auto
                flex items-center gap-3 px-4 py-3 rounded-xl
                border ${styles[type] || styles.info}
                bg-transparent backdrop-blur-[2px]
                shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)]
                min-w-[300px] max-w-md
            `}
        >
            <div className={`shrink-0 ${styles[type] || styles.info}`}>
                {icons[type] || icons.info}
            </div>
            <p className="text-sm font-medium text-white/90">
                {message}
            </p>
            <button
                onClick={() => onRemove(id)}
                className="ml-auto shrink-0 text-white/50 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
