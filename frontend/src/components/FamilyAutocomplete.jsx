import { useState, useEffect, useRef, useCallback } from 'react';
import { searchFamilies } from '../services/api';

export default function FamilyAutocomplete({ onSelect, placeholder = 'Tìm gia đình...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  const doSearch = useCallback((q) => {
    if (q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    searchFamilies(q.trim())
      .then((data) => {
        setResults(data);
        setOpen(data.length > 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSelect(f) {
    setQuery('');
    setOpen(false);
    setResults([]);
    onSelect(f);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-amber-200 shadow-lg max-h-64 overflow-y-auto">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-b border-amber-50 last:border-0"
                onClick={() => handleSelect(f)}
              >
                <p className="font-medium text-gray-900 text-sm">{f.headOfHouseholdName}</p>
                <p className="text-xs text-amber-500 mt-0.5">
                  {f.address || 'Chưa có địa chỉ'}
                  {f.phoneNumber && ` · ${f.phoneNumber}`}
                  {` · ${f.memberCount} thành viên`}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
