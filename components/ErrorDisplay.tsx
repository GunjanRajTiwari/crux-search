import React from 'react';

interface ErrorDisplayProps {
  message: string | null;
  onDismiss?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div 
      className="border-l-4 p-4 my-4 rounded-md shadow-sm" 
      style={{
        backgroundColor: 'var(--error-bg)', 
        borderColor: 'var(--error-border)', 
        color: 'var(--error-text)'
      }}
      role="alert"
    >
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 mr-4" style={{color: 'var(--error-border)'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold">Error</p>
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="ml-auto text-sm font-medium px-2 py-1 rounded hover:bg-red-200 transition-colors"
            style={{color: 'var(--error-text)'}}
            aria-label="Dismiss error"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;