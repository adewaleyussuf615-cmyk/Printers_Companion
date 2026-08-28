import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const InstallAppPrompt = ({ visible, onDismiss }) => {
  const [installEvent, setInstallEvent] = useState(() => window.__pcDeferredInstallPrompt || null);

  useEffect(() => {
    if (!visible) return undefined;

    const handleInstallAvailable = (event) => {
      event.preventDefault();
      window.__pcDeferredInstallPrompt = event;
      setInstallEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
  }, [visible]);

  if (!visible) return null;

  const installApp = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    window.__pcDeferredInstallPrompt = null;
    setInstallEvent(null);
    onDismiss();
  };

  return (
    <div className="mb-5 rounded-xl border border-[#BFD7FF] bg-[#F2F7FF] p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#143F8F] p-2 text-white">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-[#0B1F3A]">Get the PWS App on your phone</h3>
            <button type="button" onClick={onDismiss} aria-label="Dismiss app download suggestion" className="text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          {installEvent ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Install Printers Companion for quicker access to your paper marketplace.</p>
              <button type="button" onClick={installApp} className="mt-3 rounded-lg bg-[#143F8F] px-3 py-2 text-xs font-bold text-white hover:bg-[#0F306D]">
                Download PWS App
              </button>
            </>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">On your phone, open your browser menu and choose “Add to Home screen” or “Install app”.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallAppPrompt;