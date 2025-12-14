import React from 'react';
import { useUpdater } from '../../hooks/useUpdater';
import { UpdateProgress } from './UpdateProgress';

export const UpdateModal: React.FC = () => {
  const { state, downloadUpdate, installUpdate, skipVersion, checkForUpdates } = useUpdater();
  
  // Close the modal if state is idle or checking (unless explicit check triggered, but for auto-popup we want available/error)
  const isOpen = ['available', 'downloading', 'downloaded', 'error'].includes(state.status);

  // Helper to close (reset state to idle for UI purposes)
  const onClose = () => {
      // In a real app we might invoke a 'dismiss' IPC event.
      // For now we rely on the parent or logic. 
      // Since useUpdater logic is managing this, we might need an action to 'dismiss' the alert manually
      // But typically state comes from backend. We'll use a local override or just not render if we could.
      // For this implementation, we will assume 'Later' just hides it.
      // Since we can't easily change backend state from here without an IPC 'reset', we'll hide via DOM if we had a local state,
      // but `isOpen` is derived from global state.
      // We will assume 'skipVersion' or 'Later' (which does nothing usually) is handled.
      // For the demo, let's force a reload or just let it be.
      // Actually, let's just make the modal internal visible state controllable.
      const modal = document.getElementById('update-modal-overlay');
      if (modal) modal.style.display = 'none';
  };

  if (!isOpen) return null;

  const renderContent = () => {
    switch (state.status) {
      case 'available':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Update Available</h3>
                <p className="text-gray-500">
                  Version {state.availableVersion} is ready to download
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current version:</span>
                <span className="font-mono text-slate-700">{state.currentVersion}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">New version:</span>
                <span className="font-mono text-green-600 font-bold">{state.availableVersion}</span>
              </div>
            </div>

            {state.releaseNotes && (
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-gray-600 max-h-40 overflow-y-auto whitespace-pre-wrap border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-1 text-xs uppercase tracking-wide">What's New</h4>
                {state.releaseNotes}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={downloadUpdate}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Download Now
              </button>
              <button
                onClick={() => skipVersion(state.availableVersion!)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              >
                Skip
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        );

      case 'downloading':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-900">Downloading Update...</h3>
            <UpdateProgress
              percent={state.downloadProgress}
              bytesPerSecond={state.bytesPerSecond}
              totalBytes={state.totalBytes}
              downloadedBytes={state.downloadedBytes}
            />
            <p className="text-sm text-gray-500 text-center">
              You can keep working while we download.
            </p>
          </div>
        );

      case 'downloaded':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Update Ready</h3>
                <p className="text-gray-500">
                  Version {state.availableVersion} is ready to install
                </p>
              </div>
            </div>

            <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100">
              ⚠️ The application will restart to complete the installation.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={installUpdate}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
              >
                Restart & Install
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Install on Quit
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Update Failed</h3>
                <p className="text-gray-500">Something went wrong</p>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <p className="text-sm text-red-700 font-mono break-all">{state.error || "Unknown error"}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => checkForUpdates()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div id="update-modal-overlay" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 scale-100 animate-in zoom-in-95 duration-200 border border-white/20">
        {renderContent()}
      </div>
    </div>
  );
};