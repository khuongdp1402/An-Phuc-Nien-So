import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { getCurrentAccount, logout, getTemples, getViewTempleId, getViewTempleName, setViewTemple } from '../services/api';

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
  const [templeDropdownOpen, setTempleDropdownOpen] = useState(false);
  const [temples, setTemples] = useState([]);
  const account = getCurrentAccount();
  const isSuper = account?.role === 'SuperAdmin' || account?.Role === 'SuperAdmin';
  const viewTempleId = getViewTempleId();
  const viewTempleName = getViewTempleName();

  useEffect(() => {
    if (isSuper) getTemples().then(setTemples).catch(() => setTemples([]));
  }, [isSuper]);

  const navLinks = [
    { to: '/', label: 'Tổng quan' },
    { to: '/families', label: 'Gia đình' },
    { to: '/cau-an', label: 'Cầu An' },
    { to: '/cau-sieu', label: 'Cầu Siêu' },
    { to: '/import', label: 'Nhập liệu' },
    ...(isSuper ? [
      { to: '/temples', label: 'Chùa' },
      { to: '/accounts', label: 'Người dùng' }
    ] : [])
  ];

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (to) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to);
  };

  return (
    <nav className="bg-white/80 backdrop-blur sticky top-0 z-40 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="An Phúc Niên Sổ" className="h-9 w-9 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-amber-900 hidden sm:inline leading-tight">
              An Phúc Niên Sổ
            </span>
            {isSuper ? (
              <span className="text-[10px] text-amber-700 hidden sm:inline italic max-w-[140px] truncate" title={viewTempleName || 'Tất cả'}>
                {viewTempleName || 'Xem tất cả chùa'}
              </span>
            ) : account?.templeName ? (
              <span className="text-[10px] text-amber-700 hidden sm:inline italic">
                {account.templeName}
              </span>
            ) : null}
          </div>
        </Link>

        {/* SuperAdmin: Chọn chùa (desktop) */}
        {isSuper && (
          <div className="hidden sm:block relative">
            <button
              onClick={() => setTempleDropdownOpen(!templeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-amber-700 bg-amber-100/80 hover:bg-amber-100 border border-amber-200/80"
            >
              <span className="max-w-[120px] truncate">{viewTempleName || 'Tất cả chùa'}</span>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {templeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTempleDropdownOpen(false)} />
                <div className="absolute left-0 mt-1 w-56 max-h-72 overflow-auto bg-white rounded-xl shadow-lg border border-amber-100 py-1 z-20">
                  <button
                    type="button"
                    onClick={() => { setViewTemple(null); setTempleDropdownOpen(false); setTimeout(() => window.location.reload(), 50); }}
                    className={`w-full text-left px-3 py-2 text-sm ${!viewTempleId ? 'bg-amber-50 font-medium text-amber-900' : 'text-gray-700 hover:bg-amber-50/50'}`}
                  >
                    Tất cả chùa
                  </button>
                  {temples.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setViewTemple(t.id, t.name); setTempleDropdownOpen(false); setTimeout(() => window.location.reload(), 50); }}
                      className={`w-full text-left px-3 py-2 text-sm truncate ${String(viewTempleId || '') === String(t.id || '') ? 'bg-amber-50 font-medium text-amber-900' : 'text-gray-700 hover:bg-amber-50/50'}`}
                      title={t.name}
                    >
                      {t.name}
                    </button>
                  ))}
                  <Link
                    to="/select-temple"
                    onClick={() => setTempleDropdownOpen(false)}
                    className="block px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 border-t border-amber-100 mt-1"
                  >
                    Trang chọn chùa →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive(l.to)
                ? 'bg-amber-100 text-amber-900'
                : 'text-amber-600 hover:text-amber-900 hover:bg-amber-50'
                }`}
            >
              {l.label}
            </Link>
          ))}

          {/* User Dropdown */}
          <div className="relative ml-2 pl-2 border-l border-amber-200">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-xs border border-amber-200 group-hover:bg-amber-200 transition-colors">
                {account?.fullName?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-amber-900 max-w-[120px] truncate">
                {account?.fullName}
              </span>
              <svg
                className={`w-4 h-4 text-amber-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-amber-100 py-2 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-4 py-2 border-b border-amber-50 mb-1">
                    <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Tài khoản</p>
                    <p className="text-xs font-bold text-amber-900 truncate">{account?.username}</p>
                  </div>
                  <Link
                    to="/change-password"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Đổi mật khẩu
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header Icons */}
        <div className="flex items-center gap-1 sm:hidden">
          {account && (
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-amber-50 border border-amber-100"
            >
              <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 font-bold text-[10px]">
                {account.fullName?.charAt(0)}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] text-amber-900 font-bold max-w-[60px] truncate">{account.fullName}</span>
                {isSuper && <span className="text-[7px] text-indigo-600 font-bold uppercase">Super</span>}
              </div>
            </button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-amber-700 hover:text-amber-900"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="sm:hidden border-t border-amber-100 bg-white/95 backdrop-blur-md px-4 pb-6 pt-2 space-y-1 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="py-2 mb-2 border-b border-amber-50">
            <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Hệ thống</p>
            {isSuper && viewTempleName && (
              <p className="text-xs text-amber-700 mt-1 truncate">Đang xem: {viewTempleName}</p>
            )}
          </div>
          {isSuper && (
            <Link
              to="/select-temple"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Chọn chùa xem dữ liệu
            </Link>
          )}
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(l.to)
                ? 'bg-amber-100 text-amber-900 shadow-sm'
                : 'text-amber-600 hover:bg-amber-50'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive(l.to) ? 'bg-amber-600' : 'bg-transparent'}`}></span>
              {l.label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-amber-50 space-y-1">
            <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider px-3 mb-2">Cá nhân</p>
            <Link
              to="/change-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Đổi mật khẩu
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
