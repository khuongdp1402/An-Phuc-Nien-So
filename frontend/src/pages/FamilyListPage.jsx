import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getFamilies } from '../services/api';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const PAGE_SIZE = 18;

export default function FamilyListPage() {
  const [families, setFamilies] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const debounceRef = useRef(null);

  const flash = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(
    (q, p = 1) => {
      setLoading(true);
      getFamilies(q, p, PAGE_SIZE)
        .then((res) => {
          setFamilies(res.items);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          setPage(res.page);
        })
        .catch(() => flash('Không thể tải danh sách gia đình.', 'error'))
        .finally(() => setLoading(false));
    },
    [flash],
  );

  useEffect(() => { load(); }, [load]);

  function handleInputChange(value) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(value.trim() || undefined, 1);
    }, 300);
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    load(search.trim() || undefined, 1);
  }

  function handlePageChange(p) {
    load(search.trim() || undefined, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-amber-900">Danh sách gia đình</h1>
          {totalCount > 0 && (
            <p className="text-sm text-amber-500 mt-0.5">{totalCount} gia đình</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/families/new"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">Thêm</span>
            <span className="hidden sm:inline"> gia đình</span>
          </Link>
          <Link
            to="/import"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-amber-700 border border-amber-300 text-sm font-semibold rounded-xl hover:bg-amber-50 transition-colors"
          >
            Nhập liệu
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 min-w-0 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Tìm theo tên gia chủ, địa chỉ…"
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
        />
        <button
          type="submit"
          className="shrink-0 px-3 sm:px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors"
        >
          <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Tìm kiếm</span>
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-amber-600" />
        </div>
      ) : families.length === 0 ? (
        <div className="text-center py-16 text-amber-500">
          <p className="text-lg font-medium">
            {search ? 'Không tìm thấy gia đình phù hợp' : 'Chưa có gia đình nào'}
          </p>
          <p className="text-sm mt-1">
            {search
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Nhấn "Thêm gia đình" hoặc "Nhập liệu" để bắt đầu.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map((f) => (
              <Link
                key={f.id}
                to={`/families/${f.id}`}
                className="bg-white rounded-2xl border border-amber-100 p-5 hover:shadow-md hover:border-amber-300 transition-all group"
              >
                <h3 className="font-semibold text-amber-900 group-hover:text-amber-700 truncate">
                  {f.headOfHouseholdName}
                </h3>
                {f.address && (
                  <p className="text-xs text-amber-500 mt-1 truncate">{f.address}</p>
                )}
                <div className="flex items-center gap-3 mt-4 text-xs">
                  <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded-lg font-medium">
                    {f.memberCount} thành viên
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-medium">
                    {f.aliveCount} hiện tiền
                  </span>
                  {f.deceasedCount > 0 && (
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">
                      {f.deceasedCount} vãng sanh
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
