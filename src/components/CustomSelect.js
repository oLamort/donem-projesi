import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ label, icon: Icon, options, value, onChange, placeholder, isOpen, onOpenChange }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    const isControlled = isOpen !== undefined;
    const open = isControlled ? isOpen : internalIsOpen;

    const handleOpenChange = (newOpen) => {
        if (isControlled) {
            if (onOpenChange) onOpenChange(newOpen);
        } else {
            setInternalIsOpen(newOpen);
        }
    };

    return (
        <div className={`relative space-y-2 group ${open ? 'z-30' : 'z-20'}`}>
            <label className="text-xs font-medium text-white/50 flex items-center gap-1 group-focus-within:text-primary transition-colors">
                {Icon && <Icon size={12} />} {label}
            </label>

            <div className="relative">
                <button
                    onClick={() => handleOpenChange(!open)}
                    className={`w-full bg-black/40 border ${open ? 'border-primary/50' : 'border-white/10'} rounded-xl px-3 py-2.5 text-sm flex items-center justify-between hover:bg-white/5 transition-all outline-none`}
                    type="button"
                >
                    <span className={value ? "text-white font-medium" : "text-white/30"}>
                        {options.find(o => (typeof o === 'object' ? o.value : o) === value)?.label || options.find(o => o === value) || value || placeholder}
                    </span>
                    <ChevronDown size={14} className={`text-white/50 transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`} />
                </button>

                <AnimatePresence>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => handleOpenChange(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1C1C19] border border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5"
                            >
                                <style jsx>{`
                                    .custom-scrollbar::-webkit-scrollbar {
                                        width: 6px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-track {
                                        background: rgba(255, 255, 255, 0.02);
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb {
                                        background: rgba(255, 255, 255, 0.1);
                                        border-radius: 10px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                        background: rgba(255, 255, 255, 0.2);
                                    }
                                `}</style>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {options.map((option) => {
                                        const optionValue = typeof option === 'object' ? option.value : option;
                                        const optionLabel = typeof option === 'object' ? option.label : option;

                                        return (
                                            <button
                                                key={optionValue}
                                                onClick={() => {
                                                    onChange(optionValue);
                                                    handleOpenChange(false);
                                                }}
                                                type="button"
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                          ${value === optionValue ? 'bg-primary/10 text-primary font-bold' : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                        `}
                                            >
                                                {optionLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CustomSelect;
