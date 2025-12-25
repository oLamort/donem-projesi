'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Feed from '@/components/pages/Feed';
import Messages from '@/components/pages/Messages';
import Profile from '@/components/pages/Profile';
import RightSidebar from '@/components/RightSidebar';
import SearchModal from '@/components/modals/Search';
import { AnimatePresence, motion } from 'framer-motion';

function HomeContent() {
  const [activeTab, setActiveTab] = useState('feed');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['feed', 'messages', 'profile'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <main className="container mx-auto px-4 pt-6 flex gap-8 justify-center">

        {/* Main Feed / Messages Area */}
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'feed' ? (
                <Feed isLoading={isLoading} />
              ) : activeTab === 'messages' ? (
                <Messages isLoading={isLoading} initialUserId={searchParams.get('userId')} />
              ) : (
                <Profile isLoading={isLoading} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Sidebar (Desktop Only) */}
        <div className="hidden lg:block w-80 flex-shrink-0 sticky top-20 h-fit">
          <RightSidebar />
        </div>

      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
