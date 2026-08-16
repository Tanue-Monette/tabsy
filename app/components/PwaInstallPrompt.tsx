"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    // 2. Check if already running as installed PWA (standalone)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 3. Detect iOS device
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIos(iosDevice);

    // 4. Handle Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not standalone, show iOS guide if not dismissed
    if (iosDevice && !isStandaloneMode) {
      const dismissed = localStorage.getItem("tabsy_pwa_ios_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIos) {
      localStorage.setItem("tabsy_pwa_ios_dismissed", "true");
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-[#18181b] text-white p-4 rounded-3xl shadow-2xl z-50 border border-zinc-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#a3e635] text-2xl">add_to_home_screen</span>
        </div>
        <div className="min-w-0">
          <h4 className="font-extrabold text-sm leading-tight truncate">Install Tabsy App</h4>
          <p className="text-xs text-zinc-400 font-medium leading-tight mt-0.5">
            {isIos ? "Tap Share ➔ 'Add to Home Screen'" : "Add to home screen for fast access"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-[#a3e635] text-[#121212] text-xs font-black rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-md shadow-[#a3e635]/20"
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-800 text-zinc-400"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}
