import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboardSummary,
  getSaoHanStats,
  getLunarYear,
  setLunarYear,
} from '../services/api';
import { formatDonation } from '../components/DonationPicker';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const START_YEAR = 2026;

function buildYearList(lunarYr) {
  const now = new Date().getFullYear();
  const max = Math.max(now, lunarYr || now);
  const years = [];
  for (let y = max; y >= START_YEAR; y--) years.push(y);
  return years;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [saoHanStats, setSaoHanStats] = useState(null);
  const [lunarYear, setLunarYearState] = useState(null);
  const [yearInput, setYearInput] = useState('');
  const [filterYear, setFilterYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingYear, setSettingYear] = useState(false);
  const [toast, setToast] = useState(null);

  const yearList = buildYearList(lunarYear);

  const flash = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadSaoHanStats = useCallback(() => {
    getSaoHanStats().then(setSaoHanStats).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getLunarYear()])
      .then(([s, c]) => {
        setSummary(s);
        setLunarYearState(c.year);
        setYearInput(String(c.year));
        setFilterYear(c.year);
      })
      .catch(() => flash('Không thể tải tổng quan.', 'error'))
      .finally(() => setLoading(false));
    loadSaoHanStats();
  }, [flash, loadSaoHanStats]);

  async function handleFilterYearChange(y) {
    setFilterYear(y);
    try {
      const s = await getDashboardSummary(y);
      setSummary(s);
    } catch {
      flash('Không thể tải dữ liệu', 'error');
    }
  }

  async function handleSetYear() {
    const y = Number(yearInput);
    if (!y || y < 1900 || y > 2100) {
      flash('Vui lòng nhập năm hợp lệ (1900–2100).', 'error');
      return;
    }
    setSettingYear(true);
    try {
      await setLunarYear(y);
      setLunarYearState(y);
      setFilterYear(y);
      const updated = await getDashboardSummary(y);
      setSummary(updated);
      loadSaoHanStats();
      flash(`Đã đặt năm âm lịch: ${y}`, 'success');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSettingYear(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-amber-900">Tổng quan</h1>
        <p className="text-amber-600 text-sm mt-1">
          Năm âm lịch: <span className="font-bold">{lunarYear}</span>
        </p>
      </div>

      {/* Lunar year setter */}
      <section className="bg-white rounded-2xl border border-amber-100 p-5">
        <h2 className="text-sm font-semibold text-amber-700 mb-3">Đặt năm âm lịch</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            min="1900"
            max="2100"
            className="flex-1 sm:max-w-48 rounded-xl border border-amber-200 px-4 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetYear()}
          />
          <button
            onClick={handleSetYear}
            disabled={settingYear || Number(yearInput) === lunarYear}
            className="px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-40 transition-colors"
          >
            {settingYear ? 'Đang lưu…' : 'Áp dụng'}
          </button>
        </div>
        <p className="text-xs text-amber-500 mt-2">
          Toàn bộ tính toán Sao/Hạn trong hệ thống sẽ dùng năm này.
        </p>
      </section>

      {/* Stats with year filter */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-amber-900">Thống kê</h2>
          <select
            className="rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={filterYear || ''}
            onChange={(e) => handleFilterYearChange(Number(e.target.value))}
          >
            {yearList.map((y) => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard label="Gia đình" value={summary?.familyCount ?? 0} color="amber" />
          <StatCard label="Thành viên" value={summary?.totalMembers ?? 0} color="blue" />
          <StatCard
            label="Cầu An"
            value={summary?.cauAnCount ?? 0}
            sub={formatDonation(summary?.totalCauAnDonation ?? 0)}
            color="emerald"
          />
          <StatCard
            label="Cầu Siêu"
            value={summary?.cauSieuCount ?? 0}
            sub={formatDonation(summary?.totalCauSieuDonation ?? 0)}
            color="purple"
          />
          <StatCard
            label="Tổng cúng dường"
            value={formatDonation((summary?.totalCauAnDonation ?? 0) + (summary?.totalCauSieuDonation ?? 0))}
            color="amber"
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      {/* Sao/Hạn distribution */}
      {saoHanStats && (saoHanStats.totalAlive > 0 || saoHanStats.totalDeceased > 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-900">Phân bố Sao / Hạn</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sao distribution */}
            <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/60">
                <h3 className="text-sm font-semibold text-amber-800">Cửu Diệu Tinh (Sao)</h3>
              </div>
              <div className="p-4 space-y-3">
                {saoHanStats.saoAlive.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-2">
                      Hiện tiền ({saoHanStats.totalAlive})
                    </p>
                    <div className="space-y-1.5">
                      {saoHanStats.saoAlive.map((s) => (
                        <SaoHanBar
                          key={s.name}
                          name={s.name}
                          count={s.count}
                          total={saoHanStats.totalAlive}
                          type="sao"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {saoHanStats.saoDeceased.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-purple-600 mb-2">
                      Vãng sanh ({saoHanStats.totalDeceased})
                    </p>
                    <div className="space-y-1.5">
                      {saoHanStats.saoDeceased.map((s) => (
                        <SaoHanBar
                          key={s.name}
                          name={s.name}
                          count={s.count}
                          total={saoHanStats.totalDeceased}
                          type="sao"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hạn distribution */}
            <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/60">
                <h3 className="text-sm font-semibold text-amber-800">Bát Hạn (Hạn)</h3>
              </div>
              <div className="p-4 space-y-3">
                {saoHanStats.hanAlive.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-2">
                      Hiện tiền ({saoHanStats.totalAlive})
                    </p>
                    <div className="space-y-1.5">
                      {saoHanStats.hanAlive.map((h) => (
                        <SaoHanBar
                          key={h.name}
                          name={h.name}
                          count={h.count}
                          total={saoHanStats.totalAlive}
                          type="han"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {saoHanStats.hanDeceased.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-purple-600 mb-2">
                      Vãng sanh ({saoHanStats.totalDeceased})
                    </p>
                    <div className="space-y-1.5">
                      {saoHanStats.hanDeceased.map((h) => (
                        <SaoHanBar
                          key={h.name}
                          name={h.name}
                          count={h.count}
                          total={saoHanStats.totalDeceased}
                          type="han"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/families"
          className="bg-white rounded-2xl border border-amber-100 p-5 hover:shadow-md transition-shadow group"
        >
          <h3 className="font-semibold text-amber-900 group-hover:text-amber-700">Quản lý gia đình</h3>
          <p className="text-sm text-amber-500 mt-1">Xem và quản lý danh sách gia đình</p>
        </Link>
        <Link
          to="/cau-an"
          className="bg-white rounded-2xl border border-emerald-100 p-5 hover:shadow-md transition-shadow group"
        >
          <h3 className="font-semibold text-emerald-800 group-hover:text-emerald-600">Cầu An</h3>
          <p className="text-sm text-emerald-500 mt-1">Danh sách cầu an theo năm</p>
        </Link>
        <Link
          to="/cau-sieu"
          className="bg-white rounded-2xl border border-purple-100 p-5 hover:shadow-md transition-shadow group"
        >
          <h3 className="font-semibold text-purple-800 group-hover:text-purple-600">Cầu Siêu</h3>
          <p className="text-sm text-purple-500 mt-1">Danh sách cầu siêu theo năm</p>
        </Link>
        <Link
          to="/import"
          className="bg-white rounded-2xl border border-amber-100 p-5 hover:shadow-md transition-shadow group"
        >
          <h3 className="font-semibold text-amber-900 group-hover:text-amber-700">Nhập liệu</h3>
          <p className="text-sm text-amber-500 mt-1">Thêm thành viên qua văn bản hoặc ảnh OCR</p>
        </Link>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

const palette = {
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  blue: 'bg-sky-50 border-sky-200 text-sky-900',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
};

function StatCard({ label, value, sub, color, className = '' }) {
  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${palette[color]} ${className}`}>
      <p className="text-[10px] sm:text-xs font-medium opacity-70">{label}</p>
      <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums truncate">{value}</p>
      {sub && <p className="text-[10px] sm:text-xs font-medium opacity-60 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

const GOOD_SAO = new Set(['Thủy Diệu', 'Thái Dương', 'Thái Âm', 'Mộc Đức']);
const GOOD_HAN = new Set(['Bình An']);

function SaoHanBar({ name, count, total, type }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const isGood = type === 'sao' ? GOOD_SAO.has(name) : GOOD_HAN.has(name);
  const barColor = isGood ? 'bg-emerald-400' : type === 'sao' ? 'bg-red-400' : 'bg-orange-400';
  const textColor = isGood ? 'text-emerald-700' : type === 'sao' ? 'text-red-700' : 'text-orange-700';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-medium w-24 sm:w-28 truncate shrink-0 ${textColor}`}>
        {name}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 sm:h-5 relative overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-700">
          {count} ({pct}%)
        </span>
      </div>
    </div>
  );
}
