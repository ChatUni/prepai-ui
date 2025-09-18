import React from 'react';

const VoiceWaveBar = () => {
  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2">
      <div className="flex items-end gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-blue-500 rounded-full animate-pulse"
            style={{
              width: '4px',
              height: `${12 + (i % 3) * 8}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
      </div>
      <span className="ml-3 text-blue-600 text-sm font-medium">Recording...</span>
    </div>
  );
};

export default VoiceWaveBar;