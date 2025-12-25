import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, User, X, Filter, Loader2 } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import apiService from '@/services/api';
import { useRouter } from 'next/navigation';

export default function SearchModal({ isOpen, onClose }) {
    const router = useRouter();
    const [filters, setFilters] = useState({
        rank: '',
        agent: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSelect, setActiveSelect] = useState(null);
    const [searchMode, setSearchMode] = useState('default'); // 'default', 'text', 'filter'

    // API State
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');

    const rankOptions = [
        { value: 'radiant', label: 'Radiant' },
        { value: 'immortal', label: 'Immortal' },
        { value: 'ascendant', label: 'Ascendant' },
        { value: 'diamond', label: 'Diamond' },
        { value: 'platinum', label: 'Platinum' },
        { value: 'gold', label: 'Gold' },
        { value: 'silver', label: 'Silver' },
        { value: 'iron', label: 'Iron' },
    ];

    const agentOptions = [
        { value: 'flex', label: 'Flex' },
        { value: 'controller', label: 'Controller' },
        { value: 'duelist', label: 'Duelist' },
        { value: 'initiator', label: 'Initiator' },
        { value: 'sentinel', label: 'Sentinel' },
    ];

    // Reset when opening/closing
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSearchMode('default');
            setActiveSelect(null);
            setResults([]);
            setFilters({ rank: '', agent: '' });
        }
    }, [isOpen]);

    // Live search effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm || searchMode === 'filter') {
                performSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, searchMode, filters]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('q', searchTerm);
            if (searchMode === 'filter') {
                if (filters.rank) queryParams.append('rank', filters.rank);
                if (filters.agent) queryParams.append('role', filters.agent);
            }

            const res = await apiService.get(`/public/search?${queryParams.toString()}`);
            if (res.success) {
                setResults(res.users);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.length > 0) {
            setSearchMode('text');
        } else if (!filters.rank && !filters.agent) {
            setSearchMode('default');
        }
    };

    const handleFilterSearch = () => {
        if (filters.rank || filters.agent) {
            setSearchMode('filter');
            performSearch();
        }
    };

    const clearFilters = () => {
        setFilters({ rank: '', agent: '' });
        setSearchMode(searchTerm ? 'text' : 'default');
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    >
                        <motion.div
                            key="modal"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-3xl"
                        >
                            <div className="bg-[#141412] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">

                                {/* Header */}
                                <div className="p-3 sm:p-5 border-b border-white/10 flex items-center gap-3 sm:gap-4 transition-all duration-300">
                                    <Search className={`transition-colors duration-300 ${searchTerm || searchMode === 'filter' ? 'text-primary' : 'text-zinc-500'}`} size={24} />

                                    <input
                                        type="text"
                                        placeholder={searchMode === 'filter' ? "Filtrelenmiş sonuçlar..." : "Oyuncu ara..."}
                                        value={searchTerm}
                                        onChange={handleSearchInput}
                                        disabled={searchMode === 'filter'}
                                        className={`flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600 text-base sm:text-xl font-medium h-10 ${searchMode === 'filter' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        autoFocus
                                    />

                                    <button onClick={onClose} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Dynamic Content Area */}
                                <AnimatePresence mode="wait">
                                    {searchMode !== 'filter' && (
                                        <motion.div
                                            key="filters-input"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-black/20 overflow-visible"
                                        >
                                            <div className="p-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                                                <CustomSelect
                                                    label="Rank"
                                                    icon={Trophy}
                                                    options={rankOptions}
                                                    value={filters.rank}
                                                    onChange={(val) => setFilters({ ...filters, rank: val })}
                                                    placeholder="Rank"
                                                    isOpen={activeSelect === 'rank'}
                                                    onOpenChange={(open) => setActiveSelect(open ? 'rank' : null)}
                                                />
                                                <CustomSelect
                                                    label="Ajan"
                                                    icon={User}
                                                    options={agentOptions}
                                                    value={filters.agent}
                                                    onChange={(val) => setFilters({ ...filters, agent: val })}
                                                    placeholder="Ajan"
                                                    isOpen={activeSelect === 'agent'}
                                                    onOpenChange={(open) => setActiveSelect(open ? 'agent' : null)}
                                                />
                                                <button
                                                    onClick={handleFilterSearch}
                                                    className="h-[42px] px-6 bg-primary text-black font-bold rounded-xl hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    <Search size={18} />
                                                    <span>Filtrele</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {searchMode === 'filter' && (
                                        <motion.div
                                            key="active-filters"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-primary/5 border-b border-white/5"
                                        >
                                            <div className="px-5 py-3 flex items-center gap-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                                                    <Filter size={12} />
                                                    Aktif Filtreler:
                                                </div>
                                                <div className="flex gap-2">
                                                    {filters.rank && (
                                                        <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/20">
                                                            {rankOptions.find(r => r.value === filters.rank)?.label}
                                                        </span>
                                                    )}
                                                    {filters.agent && (
                                                        <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">
                                                            {agentOptions.find(a => a.value === filters.agent)?.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <button onClick={clearFilters} className="ml-auto text-xs text-zinc-500 hover:text-white transition-colors duration-300">
                                                    Temizle
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Suggestions / Results Area */}
                                <div className="flex-1 overflow-y-auto min-h-[300px] p-2 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full py-10">
                                            <Loader2 className="animate-spin text-zinc-500" size={32} />
                                        </div>
                                    ) : (
                                        <>
                                            {(searchMode !== 'default' || results.length > 0) ? (
                                                <div className="p-2 space-y-1">
                                                    {results.length > 0 ? results.map(user => (
                                                        <motion.div
                                                            key={user._id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            onClick={() => {
                                                                router.push(`/user/${user._id}`);
                                                                onClose();
                                                            }}
                                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors duration-300 border border-transparent hover:border-white/5"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-bold group-hover:bg-primary group-hover:text-black transition-colors duration-300 ring-2 ring-transparent group-hover:ring-primary/20 overflow-hidden">
                                                                {user.avatar ? (
                                                                    <img src={`${API_URL}${user.avatar}`} className="w-full h-full object-cover" draggable={false} />
                                                                ) : (
                                                                    <User size={18} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors duration-300">{user.username}</span>
                                                                    {user.rank && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary border border-primary/20">
                                                                            {user.rank}
                                                                        </span>
                                                                    )}
                                                                    {user.role && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                            {user.role}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )) : (
                                                        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                                            <Search size={64} className="mb-4 opacity-20" />
                                                            <p>Sonuç bulunamadı.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                                    <Search size={64} className="mb-4 opacity-20" />
                                                    <p>Aramaya başlamak için yazın veya filtre kullanın.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-3 bg-black/40 border-t border-white/5 rounded-b-2xl flex justify-between items-center px-5">
                                    <div className="flex gap-4">
                                        <span className="text-[10px] text-zinc-600">Enter <span className="text-zinc-500">Seç</span></span>
                                    </div>
                                    <div className="text-[10px] text-zinc-600">LFT Türkiye</div>
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
