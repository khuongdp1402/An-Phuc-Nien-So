import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  getPrayerRecords, createPrayerRecord, updatePrayerRecord,
  deletePrayerRecord, getLunarYear,
} from '../services/api';
import FamilyAutocomplete from '../components/FamilyAutocomplete';
import DonationPicker, { formatDonation } from '../components/DonationPicker';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const START_YEAR = 2026;
const PAGE_SIZE = 20;

function buildYearList(lunarYr) {
  const now = new Date().getFullYear();
  const max = Math.max(now, lunarYr || now);
  const years = [];
  for (let y = max; y >= START_YEAR; y--) years.push(y);
  return years;
}

export default function PrayerRecordPage({ type, label, accent }) {
  const [params, setParams] = useSearchParams();
  const paramYear = params.get('year') ? Number(params.get('year')) : null;

  const [lunarYear, setLunarYearState] = useState(null);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonation, setTotalDonation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDonation, setEditDonation] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  const effectiveYear = paramYear || lunarYear || new Date().getFullYear();
  const yearList = buildYearList(lunarYear);

  const flash = useCallback((msg, t = 'info') => {
    setToast({ msg, type: t });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    getLunarYear().then((r) => setLunarYearState(r.year)).catch(() => {});
  }, []);

  const load = useCallback((p = 1) => {
    setLoading(true);
    getPrayerRecords(effectiveYear, type, p, PAGE_SIZE)
      .then((res) => {
        setRecords(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
        setTotalDonation(res.totalDonation ?? 0);
        setPage(res.page);
      })
      .catch(() => flash('Không thể tải danh sách', 'error'))
      .finally(() => setLoading(false));
  }, [effectiveYear, type, flash]);

  useEffect(() => { load(1); }, [load]);

  function changeYear(y) {
    setParams({ year: y });
  }

  function handlePageChange(p) {
    load(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleAdd(family, donation, notes) {
    try {
      await createPrayerRecord({
        familyId: family.id,
        year: effectiveYear,
        type,
        donationAmount: donation,
        notes: notes || null,
      });
      setShowAdd(false);
      flash('Đã thêm thành công', 'success');
      load(page);
    } catch (err) {
      flash(err.message, 'error');
    }
  }

  async function handleUpdate(id) {
    try {
      await updatePrayerRecord(id, { donationAmount: editDonation, notes: editNotes || null });
      setEditingId(null);
      flash('Đã cập nhật', 'success');
      load(page);
    } catch (err) {
      flash(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
    try {
      await deletePrayerRecord(id);
      flash('Đã xóa', 'success');
      load(page);
    } catch (err) {
      flash(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Header + Year + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className={`text-2xl font-bold ${accent === 'emerald' ? 'text-emerald-800' : 'text-purple-800'}`}>
          Danh sách {label}
        </h1>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <label className="text-sm text-amber-600 font-medium shrink-0">Năm:</label>
            <select
              className="rounded-xl border border-amber-200 bg-white px-2.5 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={effectiveYear}
              onChange={(e) => changeYear(Number(e.target.value))}
            >
              {yearList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className={`shrink-0 inline-flex items-center gap-1 px-3 sm:px-4 py-2 text-white text-sm font-semibold rounded-xl transition-colors ${
              accent === 'emerald'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Thêm gia đình</span>
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <AddRecordForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Số gia đình" value={totalCount} />
        <StatCard label="Tổng cúng dường" value={formatDonation(totalDonation)} />
      </div>

      {/* Records */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-amber-600" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-amber-500">
          <p className="text-lg font-medium">Chưa có bản ghi nào cho năm {effectiveYear}</p>
          <p className="text-sm mt-1">Nhấn "Thêm gia đình" để bắt đầu</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-amber-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-amber-700 bg-amber-50/60 border-b border-amber-100">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Gia chủ</th>
                    <th className="px-4 py-3 font-semibold">Địa chỉ</th>
                    <th className="px-4 py-3 font-semibold text-center">Thành viên</th>
                    <th className="px-4 py-3 font-semibold text-right">Cúng dường</th>
                    <th className="px-4 py-3 font-semibold">Ghi chú</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} className="border-b border-amber-50 hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 text-amber-400 tabular-nums">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-3">
                        <Link to={`/families/${r.familyId}`} className="font-medium text-amber-800 hover:text-amber-600">
                          {r.familyName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.familyAddress || '—'}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{r.memberCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {editingId === r.id ? (
                          <DonationPicker value={editDonation} onChange={setEditDonation} />
                        ) : (
                          formatDonation(r.donationAmount)
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {editingId === r.id ? (
                          <input
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Ghi chú"
                          />
                        ) : (
                          r.notes || '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === r.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleUpdate(r.id)} className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Lưu</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs font-medium text-gray-600 border rounded-lg hover:bg-gray-50">Hủy</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingId(r.id); setEditDonation(r.donationAmount); setEditNotes(r.notes || ''); }} className="p-1 text-amber-500 hover:text-amber-700" title="Sửa"><PencilIcon /></button>
                            <button onClick={() => handleDelete(r.id)} className="p-1 text-red-400 hover:text-red-600" title="Xóa"><TrashIcon /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50/60 font-semibold text-amber-800">
                    <td colSpan={4} className="px-4 py-3 text-right">Tổng cộng:</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatDonation(totalDonation)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {records.map((r, i) => (
              <div key={r.id} className="bg-white rounded-2xl border border-amber-100 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/families/${r.familyId}`} className="font-semibold text-amber-800 hover:text-amber-600 text-sm">
                      {(page - 1) * PAGE_SIZE + i + 1}. {r.familyName}
                    </Link>
                    <p className="text-xs text-amber-500 mt-0.5">{r.familyAddress || 'Chưa có địa chỉ'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(r.id); setEditDonation(r.donationAmount); setEditNotes(r.notes || ''); }} className="p-1 text-amber-500"><PencilIcon /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1 text-red-400"><TrashIcon /></button>
                  </div>
                </div>
                {editingId === r.id ? (
                  <div className="space-y-2 pt-1">
                    <DonationPicker value={editDonation} onChange={setEditDonation} />
                    <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Ghi chú" />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(r.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg">Lưu</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 border rounded-lg">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{r.memberCount} thành viên</span>
                    <span className="font-semibold text-amber-800">{formatDonation(r.donationAmount)}</span>
                  </div>
                )}
                {r.notes && editingId !== r.id && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
              </div>
            ))}
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-sm text-amber-600">Tổng cúng dường</p>
              <p className="text-lg font-bold text-amber-900">{formatDonation(totalDonation)}</p>
            </div>
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

/* ── AddRecordForm ────────────────────────────────────────────────── */

function AddRecordForm({ onSubmit, onCancel }) {
  const [family, setFamily] = useState(null);
  const [donation, setDonation] = useState(null);
  const [notes, setNotes] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!family) return;
    onSubmit(family, donation, notes);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
      <h3 className="text-base font-semibold text-amber-800">Thêm gia đình vào danh sách</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tìm gia đình *</label>
          {family ? (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-amber-200 px-4 py-2.5">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{family.headOfHouseholdName}</p>
                <p className="text-xs text-amber-500">{family.address || 'Chưa có địa chỉ'}</p>
              </div>
              <button type="button" onClick={() => setFamily(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Đổi</button>
            </div>
          ) : (
            <FamilyAutocomplete onSelect={setFamily} placeholder="Nhập tên gia chủ, địa chỉ..." />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tiền cúng dường</label>
            <DonationPicker value={donation} onChange={setDonation} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <input className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú thêm..." />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={!family} className="px-5 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors">Thêm</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Hủy</button>
      </div>
    </form>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-4">
      <p className="text-xs text-amber-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-amber-900 mt-1">{value}</p>
    </div>
  );
}

function PencilIcon() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>);
}

function TrashIcon() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
}
