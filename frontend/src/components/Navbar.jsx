import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const links = [
  { to: '/', label: 'Tổng quan' },
  { to: '/families', label: 'Gia đình' },
  { to: '/cau-an', label: 'Cầu An' },
  { to: '/cau-sieu', label: 'Cầu Siêu' },
  { to: '/import', label: 'Nhập liệu' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (to) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to);
  };

  return (
    <nav className="bg-white/80 backdrop-blur sticky top-0 z-40 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="An Phúc Niên Sổ" className="h-9 w-9 rounded-full object-cover" />
          <span className="text-xl font-bold text-amber-900 hidden sm:inline">An Phúc Niên Sổ</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(l.to)
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-amber-600 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden p-2 text-amber-700 hover:text-amber-900"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="sm:hidden border-t border-amber-100 bg-white px-4 pb-3 pt-1 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(l.to)
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
