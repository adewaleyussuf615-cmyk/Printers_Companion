import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';

const SearchBar = ({ onSearch, onFilterClick }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val); // Real-time search update
  };

  return (
    <div className="bg-white p-4 border-b border-[#E2E8F0] shadow-sm">
      <form onSubmit={handleSubmit} className="flex gap-2.5 max-w-md mx-auto">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search paper type, GSM, use case..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E2E8F0] text-[#1E293B] rounded-xl outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10 transition-all text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onFilterClick}
          className="p-3 border border-[#E2E8F0] hover:border-[#00C2FF] bg-white rounded-xl hover:bg-slate-50 transition-all text-[#0B1F3A]"
        >
          <Filter className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
