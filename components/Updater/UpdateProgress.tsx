import React from 'react';

interface UpdateProgressProps {
  percent: number;
  bytesPerSecond: number;
  totalBytes: number;
  downloadedBytes: number;
}

export const UpdateProgress: React.FC<UpdateProgressProps> = ({
  percent,
  bytesPerSecond,
  totalBytes,
  downloadedBytes
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return formatBytes(bytesPerSec) + '/s';
  };

  const estimateTimeRemaining = (): string => {
    if (bytesPerSecond === 0) return 'Calculating...';
    const remaining = totalBytes - downloadedBytes;
    const seconds = Math.ceil(remaining / bytesPerSecond);
    if (seconds < 60) return `${seconds}s remaining`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m remaining`;
  };

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>{percent}%</span>
        <span>{formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}</span>
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatSpeed(bytesPerSecond)}</span>
        <span>{estimateTimeRemaining()}</span>
      </div>
    </div>
  );
};