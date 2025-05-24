import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "Loading...", size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-4', // Adjusted sm size for better fit in some contexts
    md: 'w-10 h-10 border-[5px]', // Adjusted md size
    lg: 'w-14 h-14 border-[6px]', // Adjusted lg size
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 my-8">
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent`}
        style={{ borderColor: 'var(--primary-accent)', borderTopColor: 'transparent' }}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className="text-slate-300 text-sm" style={{color: 'var(--text-muted)'}}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;