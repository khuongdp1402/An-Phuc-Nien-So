import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFamilyDetail, deleteFamily, addMember, updateMember, deleteMember, getLunarYear, getFamilyPrayerRecords } from '../services/api';
import { calcSaoHan } from '../services/lunar';
import { SaoBadge, HanBadge } from '../components/SaoBadge';
import { formatDonation } from '../components/DonationPicker';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'alive', label: 'Cầu An' },
  { key: 'deceased', label: 'Cầu Siêu' },
];

export default function FamilyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [lunarYear, setLunarYear] = useState(new Date().getFullYear());
  const [prayerRecords, setPrayerRecords] = useState([]);
  const [prPage, setPrPage] = useState(1);
  const [prTotalCount, setPrTotalCount] = useState(0);
  const [prTotalPages, setPrTotalPages] = useState(1);

  const flash = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadPrayerRecords = useCallback((p = 1) => {
    getFamilyPrayerRecords(id, p, 10)
      .then((res) => {
        setPrayerRecords(res.items);
        setPrTotalCount(res.totalCount);
        setPrTotalPages(res.totalPages);
        setPrPage(res.page);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    getLunarYear().then((r) => setLunarYear(r.year)).catch(() => {});
    loadPrayerRecords(1);
  }, [id, loadPrayerRecords]);

  const load = useCallback(
    (year) => {
      setLoading(true);
      getFamilyDetail(id, year)
        .then(setFamily)
        .catch(() => flash('Không thể tải thông tin gia đình', 'error'))
        .finally(() => setLoading(false));
    },
    [id, flash],
  );

  useEffect(() => { load(); }, [load]);

  const handleDeleteFamily = async () => {
    try {
      await deleteFamily(id);
      navigate('/families');
    } catch {
      flash('Xóa gia đình thất bại', 'error');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return;
    try {
      await deleteMember(id, memberId);
      flash('Đã xóa thành viên', 'success');
      load();
    } catch {
      flash('Xóa thành viên thất bại', 'error');
    }
  };

  const members = family?.members ?? [];
  const filtered =
    filter === 'alive' ? members.filter((m) => m.isAlive)
    : filter === 'deceased' ? members.filter((m) => !m.isAlive)
    : members;

  const aliveCount = members.filter((m) => m.isAlive).length;
  const deceasedCount = members.filter((m) => !m.isAlive).length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-amber-600" />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="text-center py-16 text-red-500">
        <p className="text-lg font-medium">Không tìm thấy gia đình</p>
        <Link to="/families" className="text-sm text-amber-600 underline mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Back + Header */}
      <div>
        <Link to="/families" className="text-sm text-amber-600 hover:text-amber-800 transition-colors">
          &larr; Danh sách gia đình
        </Link>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-amber-900 truncate">{family.headOfHouseholdName}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-amber-600">
              {family.address && <span className="truncate max-w-[200px] sm:max-w-none">{family.address}</span>}
              {family.phoneNumber && <span>{family.phoneNumber}</span>}
              <span className="text-amber-400">Năm {family.year}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to={`/families/${id}/edit`}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <PencilIcon />
              <span className="hidden sm:inline">Sửa</span>
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <TrashIcon />
              <span className="hidden sm:inline">Xóa</span>
            </button>
            <button
              onClick={() => load()}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600">
              Bạn có chắc muốn xóa gia đình <strong>{family.headOfHouseholdName}</strong> cùng tất cả thành viên?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteFamily}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs + Add member button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? members.length : f.key === 'alive' ? aliveCount : deceasedCount;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  filter === f.key
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                {f.label}
                <span className="ml-1 sm:ml-1.5 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { setAddingMember(true); setEditingMember(null); }}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Thêm thành viên</span>
        </button>
      </div>

      {/* Add / Edit member form */}
      {(addingMember || editingMember) && (
        <MemberForm
          lunarYear={lunarYear}
          familyId={id}
          member={editingMember}
          onSaved={() => { setAddingMember(false); setEditingMember(null); load(); flash('Đã lưu thành viên', 'success'); }}
          onCancel={() => { setAddingMember(false); setEditingMember(null); }}
          onError={(msg) => flash(msg, 'error')}
        />
      )}

      {/* Members list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-amber-500">
          <p className="font-medium">Không có thành viên trong danh mục này</p>
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
                    <th className="px-4 py-3 font-semibold">Họ tên</th>
                    <th className="px-4 py-3 font-semibold">Pháp danh</th>
                    <th className="px-4 py-3 font-semibold text-center">Giới tính</th>
                    <th className="px-4 py-3 font-semibold text-center">Năm sinh</th>
                    <th className="px-4 py-3 font-semibold text-center">Tuổi Mụ</th>
                    <th className="px-4 py-3 font-semibold">Sao</th>
                    <th className="px-4 py-3 font-semibold">Hạn</th>
                    <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id} className="border-b border-amber-50 hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 text-amber-400 tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                      <td className="px-4 py-3 text-gray-600">{m.dharmaName || '—'}</td>
                      <td className="px-4 py-3 text-center">{m.gender ? 'Nam' : 'Nữ'}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{m.birthYear || '—'}</td>
                      <td className="px-4 py-3 text-center tabular-nums font-medium">{m.tuoiMu}</td>
                      <td className="px-4 py-3"><SaoBadge value={m.sao} /></td>
                      <td className="px-4 py-3"><HanBadge value={m.han} /></td>
                      <td className="px-4 py-3 text-center"><StatusPill alive={m.isAlive} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingMember(m); setAddingMember(false); }}
                            className="p-1 text-amber-500 hover:text-amber-700 transition-colors"
                            title="Sửa"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-amber-100 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    {m.dharmaName && (
                      <p className="text-xs text-amber-600 mt-0.5">{m.dharmaName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusPill alive={m.isAlive} />
                    <button
                      onClick={() => { setEditingMember(m); setAddingMember(false); }}
                      className="p-1 text-amber-500 hover:text-amber-700"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(m.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <MiniStat label="Tuổi Mụ" value={m.tuoiMu} />
                  <MiniStat label="Năm sinh" value={m.birthYear || '—'} />
                  <MiniStat label="Giới tính" value={m.gender ? 'Nam' : 'Nữ'} />
                </div>

                <div className="flex items-center gap-2">
                  <SaoBadge value={m.sao} />
                  <HanBadge value={m.han} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Prayer / Donation history */}
      {prTotalCount > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100">
            <h2 className="text-lg font-semibold text-amber-900">
              Lịch sử cầu an / cầu siêu
              <span className="text-sm font-normal text-amber-500 ml-2">({prTotalCount} bản ghi)</span>
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-amber-700 bg-amber-50/60 border-b border-amber-100">
                  <th className="px-4 py-2.5 font-semibold">Năm</th>
                  <th className="px-4 py-2.5 font-semibold">Loại</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Cúng dường</th>
                  <th className="px-4 py-2.5 font-semibold">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {prayerRecords.map((r) => (
                  <tr key={r.id} className="border-b border-amber-50 hover:bg-amber-50/40">
                    <td className="px-4 py-2.5 tabular-nums font-medium">{r.year}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        r.type === 'CauAn'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {r.type === 'CauAn' ? 'Cầu An' : 'Cầu Siêu'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatDonation(r.donationAmount)}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-amber-50">
            {prayerRecords.map((r) => (
              <div key={r.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold text-amber-800">{r.year}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      r.type === 'CauAn'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {r.type === 'CauAn' ? 'Cầu An' : 'Cầu Siêu'}
                    </span>
                  </div>
                  <span className="tabular-nums font-semibold text-amber-900">{formatDonation(r.donationAmount)}</span>
                </div>
                {r.notes && <p className="text-xs text-gray-500">{r.notes}</p>}
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-amber-100">
            <Pagination
              page={prPage}
              totalPages={prTotalPages}
              totalCount={prTotalCount}
              pageSize={10}
              onPageChange={loadPrayerRecords}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MemberForm — inline add/edit ─────────────────────────────────── */

function detectGender(name) {
  const lower = name.toLowerCase();
  const words = lower.split(/\s+/);
  if (words.includes('thị') || words.includes('thi')) return false;
  if (words.includes('văn') || words.includes('van')) return true;
  return null;
}

function MemberForm({ lunarYear, familyId, member, onSaved, onCancel, onError }) {
  const isEdit = Boolean(member?.id);
  const [name, setName] = useState(member?.name ?? '');
  const [birthYear, setBirthYear] = useState(member?.birthYear ? String(member.birthYear) : '');
  const [age, setAge] = useState(member?.tuoiMu ? String(member.tuoiMu) : '');
  const [gender, setGender] = useState(member?.gender ?? true);
  const [dharmaName, setDharmaName] = useState(member?.dharmaName ?? '');
  const [isAlive, setIsAlive] = useState(member?.isAlive ?? true);
  const [saving, setSaving] = useState(false);

  const yr = parseInt(birthYear, 10);
  const preview = yr > 1800 ? calcSaoHan(yr, gender, lunarYear) : null;

  function onNameChange(v) {
    setName(v);
    const g = detectGender(v);
    if (g !== null) setGender(g);
  }

  function onBirthYearChange(v) {
    setBirthYear(v);
    const y = parseInt(v, 10);
    if (y > 1800 && y < 2200) setAge(String(lunarYear - y + 1));
  }

  function onAgeChange(v) {
    setAge(v);
    const a = parseInt(v, 10);
    if (a > 0) setBirthYear(String(lunarYear - a + 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !birthYear) {
      onError('Vui lòng nhập họ tên và năm sinh');
      return;
    }

    const payload = {
      name: name.trim(),
      birthYear: parseInt(birthYear, 10),
      gender,
      dharmaName: dharmaName.trim() || null,
      isAlive,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateMember(familyId, member.id, payload);
      } else {
        await addMember(familyId, payload);
      }
      onSaved();
    } catch (err) {
      onError(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
      <h3 className="text-base font-semibold text-amber-800">
        {isEdit ? 'Sửa thành viên' : 'Thêm thành viên mới'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên *</label>
          <input
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nguyễn Văn B"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Năm sinh</label>
            <input
              type="number"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={birthYear}
              onChange={(e) => onBirthYearChange(e.target.value)}
              placeholder="1990"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tuổi mụ</label>
            <input
              type="number"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={age}
              onChange={(e) => onAgeChange(e.target.value)}
              placeholder="Tuổi"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Giới tính</label>
            <select
              className="w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={gender ? 'male' : 'female'}
              onChange={(e) => setGender(e.target.value === 'male')}
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hiện tiền</label>
            <div className="pt-1.5">
              <AliveToggle value={isAlive} onChange={setIsAlive} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pháp danh</label>
          <input
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={dharmaName}
            onChange={(e) => setDharmaName(e.target.value)}
            placeholder="Thiện Đức"
          />
        </div>
      </div>

      {/* Sao/Han preview */}
      {preview && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-amber-600">
            Tuổi mụ: <strong className="text-amber-900">{preview.tuoiMu}</strong>
          </span>
          <SaoBadge value={preview.sao} />
          <HanBadge value={preview.han} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {saving && <Spinner className="h-4 w-4 text-white" />}
          {isEdit ? 'Cập nhật' : 'Thêm'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

/* ── Small components ─────────────────────────────────────────────── */

function StatusPill({ alive }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      alive ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
    }`}>
      {alive ? 'Hiện tiền' : 'Vãng sanh'}
    </span>
  );
}

function AliveToggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="group relative inline-flex items-center gap-1.5 shrink-0"
      title={value ? 'Hiện tiền' : 'Vãng sanh'}
    >
      <span
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${
          value ? 'bg-emerald-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${
            value ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className={`text-xs font-medium whitespace-nowrap ${
        value ? 'text-emerald-700' : 'text-gray-500'
      }`}>
        {value ? 'Hiện tiền' : 'Vãng sanh'}
      </span>
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-amber-50/60 rounded-lg py-1.5">
      <p className="text-[10px] text-amber-500 uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-gray-800 tabular-nums">{value}</p>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
