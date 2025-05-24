import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  isResultsView: boolean; // To adjust styling based on view
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, isResultsView }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`w-full flex justify-center ${isResultsView ? 'py-2' : 'mb-8 mt-4'}`}
    >
      <div 
        className={`flex items-center ${isResultsView ? 'max-w-xl shadow-sm' : 'max-w-2xl shadow-md hover:shadow-lg transition-shadow'} w-full bg-white rounded-full p-1 border`}
        style={{
          backgroundColor: 'var(--bg-main)', 
          borderColor: 'var(--border-color)',
        }}
      >
        <input
          className="appearance-none bg-transparent border-none w-full text-neutral-100 placeholder-neutral-400 py-3 px-5 leading-tight focus:outline-none"
          style={{
            color: 'var(--text-main)', 
            '--placeholder-color': 'var(--text-muted)'
          } as React.CSSProperties}
          type="text"
          placeholder="Search to create a reel with Crux..."
          aria-label="Search query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="flex-shrink-0 text-white font-semibold p-3 rounded-full transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mr-1"
          style={{
            backgroundColor: isLoading ? 'var(--primary-accent-hover)' : 'var(--primary-accent)', 
            color: 'var(--primary-accent-text)'
          }}
          type="submit"
          disabled={isLoading}
          aria-label="Search"
          onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--primary-accent-hover)';}}
          onMouseOut={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--primary-accent)';}}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin fa-fw"></i>
          ) : (
            <i className="fas fa-search fa-fw"></i>
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;