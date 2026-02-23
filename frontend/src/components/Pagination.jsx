export default function Pagination({ page, totalPages, totalCount, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = buildPageNumbers(page, totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pt-2">
      <p className="text-xs text-amber-500 order-2 sm:order-1">
        Hiển thị {from}–{to} / {totalCount}
      </p>
      <div className="flex items-center gap-0.5 sm:gap-1 order-1 sm:order-2">
        <NavBtn disabled={page <= 1} onClick={() => onPageChange(page - 1)} label="‹" />
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="px-1 sm:px-1.5 text-amber-400 text-xs sm:text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[1.75rem] sm:min-w-[2rem] h-7 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <NavBtn disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} label="›" />
      </div>
    </div>
  );
}

function NavBtn({ disabled, onClick, label }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="min-w-[1.75rem] sm:min-w-[2rem] h-7 sm:h-8 rounded-lg text-xs sm:text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

function buildPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  pages.push(1);
  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}
