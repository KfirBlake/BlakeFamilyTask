'use client';

import { useState, useEffect } from 'react';

// Extend the window interface to support beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Service Worker is registered safely by OneSignal naturally in UserContext

    const handler = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Optionally log the outcome
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl shadow-red-900/20 border border-red-100 dark:border-red-900 flex items-center justify-between animate-in slide-in-from-bottom-5">
      <div className="flex flex-col">
        <span className="font-bold text-gray-900 dark:text-gray-100">משימות משפחתיות</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">התקן את האפליקציה לגישה מהירה!</span>
      </div>
      <button 
        onClick={handleInstallClick}
        className="px-4 py-2 bg-[#AA0000] text-white rounded-lg font-bold shadow-md hover:bg-red-800 transition-colors"
      >
        התקן
      </button>
    </div>
  );
}
