import React from 'react';
import { useUpdater } from '../../hooks/useUpdater';
import { UpdateProgress } from './UpdateProgress';

export const UpdateModal: React.FC = () => {
  const { state, downloadUpdate, installUpdate, skipVersion, checkForUpdates } = useUpdater();
  
  // Close the modal if state is idle or checking
  const isOpen = ['available', 'downloading', 'downloaded', 'error', 'not-available'].includes(state.status);

  // Helper to close (reset state to idle for UI purposes)
  const onClose = () => {
      const modal = document.getElementById('update-modal-overlay');
      if (modal) modal.style.display = 'none';
  };

  // Parse error message to show user-friendly text
  const getUserFriendlyError = (error: string | null): { title: string; message: string; isNotFound: boolean } => {
    if (!error) {
      return { title: "Update Check Failed", message: "An unknown error occurred.", isNotFound: false };
    }
    
    // Check for 404 / not found errors (no releases published yet)
    if (error.includes('404') || error.includes('HttpError: 404') || error.includes('Cannot find latest.yml') || error.includes('not found')) {
      return { 
        title: "You're Up to Date!", 
        message: "No updates are available at this time. You're running the latest version.",
        isNotFound: true
      };
    }
    
    // Check for network errors
    if (error.includes('ENOTFOUND') || error.includes('ETIMEDOUT') || error.includes('network')) {
      return { 
        title: "Connection Error", 
        message: "Could not connect to the update server. Please check your internet connection and try again.",
        isNotFound: false
      };
    }
    
    // Generic error
    return { 
      title: "Update Check Failed", 
      message: "Something went wrong while checking for updates. Please try again later.",
      isNotFound: false
    };
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

      case 'not-available':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">You're Up to Date!</h3>
                <p className="text-gray-500">
                  Version {state.currentVersion} is the latest version.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                ✨ You're running the latest version of Memora. Check back later for new features and improvements!
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Got it!
              </button>
            </div>
          </div>
        );

      case 'error':
        const errorInfo = getUserFriendlyError(state.error);
        
        // If error is actually "no updates found" (404), show friendly UI
        if (errorInfo.isNotFound) {
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{errorInfo.title}</h3>
                  <p className="text-gray-500">Version {state.currentVersion}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  ✨ {errorInfo.message}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Got it!
                </button>
              </div>
            </div>
          );
        }

        // Show actual error for other cases
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{errorInfo.title}</h3>
                <p className="text-gray-500">Please try again</p>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <p className="text-sm text-red-700">{errorInfo.message}</p>
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
    <div id="update-modal-overlay" className="modal-overlay fixed inset-0 bg-black/70 flex items-center justify-center z-[10001] animate-in fade-in duration-200" data-interactive>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 scale-100 animate-in zoom-in-95 duration-200 border border-white/20" data-interactive>
        {renderContent()}
      </div>
    </div>
  );
};