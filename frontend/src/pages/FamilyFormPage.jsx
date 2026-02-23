import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createFamily, getFamilyDetail, updateFamily, getLunarYear } from '../services/api';
import { calcSaoHan } from '../services/lunar';
import { SaoBadge, HanBadge } from '../components/SaoBadge';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const EMPTY_MEMBER = () => ({
  _key: crypto.randomUUID(),
  name: '',
  birthYear: '',
  age: '',
  gender: true,
  dharmaName: '',
  isAlive: true,
});

function detectGender(name) {
  const lower = name.toLowerCase();
  const words = lower.split(/\s+/);
  if (words.includes('thị')) return false;
  if (words.includes('thi')) return false;
  if (words.includes('văn')) return true;
  if (words.includes('van')) return true;
  return null;
}

export default function FamilyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [editHeadName, setEditHeadName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [members, setMembers] = useState([EMPTY_MEMBER()]);
  const [lunarYear, setLunarYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const headName = isEdit ? editHeadName : (members[0]?.name ?? '');

  const setHeadName = useCallback((name) => {
    if (isEdit) {
      setEditHeadName(name);
    } else {
      setMembers((prev) => {
        const updated = [...prev];
        const first = { ...updated[0], name };
        const g = detectGender(name);
        if (g !== null) first.gender = g;
        updated[0] = first;
        return updated;
      });
    }
  }, [isEdit]);

  const flash = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    getLunarYear()
      .then((r) => setLunarYear(r.year))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getFamilyDetail(id)
      .then((f) => {
        setEditHeadName(f.headOfHouseholdName);
        setAddress(f.address ?? '');
        setPhone(f.phoneNumber ?? '');
        setMembers(
          f.members.map((m) => ({
            _key: m.id,
            _id: m.id,
            name: m.name,
            birthYear: String(m.birthYear),
            age: String(lunarYear - m.birthYear + 1),
            gender: m.gender,
            dharmaName: m.dharmaName ?? '',
            isAlive: m.isAlive,
          })),
        );
      })
      .catch(() => flash('Không thể tải thông tin gia đình', 'error'))
      .finally(() => setLoading(false));
  }, [id, isEdit, flash, lunarYear]);

  const updateMember = useCallback((key, field, value) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m._key !== key) return m;
        const updated = { ...m, [field]: value };

        if (field === 'name') {
          const g = detectGender(value);
          if (g !== null) updated.gender = g;
        }
        if (field === 'birthYear' && value) {
          const yr = parseInt(value, 10);
          if (!isNaN(yr) && yr > 1800 && yr < 2200)
            updated.age = String(lunarYear - yr + 1);
        }
        if (field === 'age' && value) {
          const a = parseInt(value, 10);
          if (!isNaN(a) && a > 0)
            updated.birthYear = String(lunarYear - a + 1);
        }
        return updated;
      }),
    );
  }, [lunarYear]);

  const addRow = useCallback(() => {
    setMembers((prev) => [...prev, EMPTY_MEMBER()]);
  }, []);

  const removeRow = useCallback((key) => {
    setMembers((prev) => {
      if (prev.length <= 1) return prev;
      if (prev[0]._key === key) return prev;
      return prev.filter((m) => m._key !== key);
    });
  }, []);

  const previews = useMemo(
    () =>
      members.map((m) => {
        const yr = parseInt(m.birthYear, 10);
        if (!yr || yr < 1800) return null;
        return calcSaoHan(yr, m.gender, lunarYear);
      }),
    [members, lunarYear],
  );

  async function handleSubmit(e) {
    e.preventDefault();

    if (!headName.trim()) {
      flash('Vui lòng nhập tên chủ hộ', 'error');
      return;
    }
    if (!members[0]?.birthYear) {
      flash('Vui lòng nhập năm sinh hoặc tuổi cho chủ hộ', 'error');
      return;
    }
    const validMembers = members.filter((m) => m.name.trim() && m.birthYear);
    if (validMembers.length === 0) {
      flash('Vui lòng thêm ít nhất 1 thành viên hợp lệ', 'error');
      return;
    }

    const payload = {
      headOfHouseholdName: headName.trim(),
      address: address.trim() || null,
      phoneNumber: phone.trim() || null,
      members: validMembers.map((m) => ({
        name: m.name.trim(),
        birthYear: parseInt(m.birthYear, 10),
        gender: m.gender,
        dharmaName: m.dharmaName.trim() || null,
        isAlive: m.isAlive,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateFamily(id, {
          headOfHouseholdName: payload.headOfHouseholdName,
          address: payload.address,
          phoneNumber: payload.phoneNumber,
        });
        navigate(`/families/${id}`);
      } else {
        const created = await createFamily(payload);
        navigate(`/families/${created.id}`);
      }
    } catch (err) {
      flash(err.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div>
        <Link to="/families" className="text-sm text-amber-600 hover:text-amber-800 transition-colors">
          &larr; Danh sách gia đình
        </Link>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-amber-900">
          {isEdit ? 'Chỉnh sửa gia đình' : 'Thêm gia đình mới'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Family info ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-amber-100 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-amber-800">Thông tin gia đình</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chủ hộ <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input
              className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
            />
          </div>
        </div>

        {/* ── Members list ────────────────────────────────────────── */}
        {!isEdit && (
          <div className="bg-white rounded-2xl border border-amber-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-800">
                Danh sách thành viên
                <span className="ml-2 text-sm font-normal text-amber-500">
                  (Năm {lunarYear})
                </span>
              </h2>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Thêm dòng
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-amber-700 bg-amber-50/60 border-b border-amber-100">
                    <th className="px-3 py-2.5 font-semibold w-[200px]">Họ tên *</th>
                    <th className="px-3 py-2.5 font-semibold w-[90px]">Năm sinh</th>
                    <th className="px-3 py-2.5 font-semibold w-[70px]">Tuổi</th>
                    <th className="px-3 py-2.5 font-semibold w-[80px] text-center">Giới tính</th>
                    <th className="px-3 py-2.5 font-semibold w-[150px]">Pháp danh</th>
                    <th className="px-3 py-2.5 font-semibold w-[80px] text-center">Hiện tiền</th>
                    <th className="px-3 py-2.5 font-semibold text-center">Sao</th>
                    <th className="px-3 py-2.5 font-semibold text-center">Hạn</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => {
                    const p = previews[idx];
                    const isHead = idx === 0;
                    return (
                      <tr key={m._key} className={`border-b border-amber-50 ${isHead ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            {isHead && (
                              <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                Chủ hộ
                              </span>
                            )}
                            <input
                              className={`w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${isHead ? 'bg-amber-50/60 text-amber-800 font-medium' : ''}`}
                              value={m.name}
                              onChange={(e) => isHead ? setHeadName(e.target.value) : updateMember(m._key, 'name', e.target.value)}
                              placeholder={isHead ? 'Tên chủ hộ' : 'Họ và tên'}
                            />
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
                            value={m.birthYear}
                            onChange={(e) => updateMember(m._key, 'birthYear', e.target.value)}
                            placeholder="1990"
                            min="1800"
                            max="2200"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
                            value={m.age}
                            onChange={(e) => updateMember(m._key, 'age', e.target.value)}
                            placeholder="Tuổi"
                            min="1"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <select
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            value={m.gender ? 'male' : 'female'}
                            onChange={(e) => updateMember(m._key, 'gender', e.target.value === 'male')}
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            value={m.dharmaName}
                            onChange={(e) => updateMember(m._key, 'dharmaName', e.target.value)}
                            placeholder="Pháp danh"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <AliveToggle
                            value={m.isAlive}
                            onChange={(v) => updateMember(m._key, 'isAlive', v)}
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {p ? <SaoBadge value={p.sao} /> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {p ? <HanBadge value={p.han} /> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {!isHead && (
                            <button
                              type="button"
                              onClick={() => removeRow(m._key)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                              title="Xóa dòng"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-4">
              {members.map((m, idx) => {
                const p = previews[idx];
                const isHead = idx === 0;
                return (
                  <div key={m._key} className={`rounded-xl border p-4 space-y-3 ${isHead ? 'border-amber-300 bg-amber-50/60' : 'border-amber-100 bg-amber-50/30'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-500">#{idx + 1}</span>
                        {isHead && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                            Chủ hộ
                          </span>
                        )}
                      </div>
                      {!isHead && (
                        <button
                          type="button"
                          onClick={() => removeRow(m._key)}
                          className="text-red-400 hover:text-red-600 p-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <input
                      className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${isHead ? 'font-medium text-amber-800' : ''}`}
                      value={m.name}
                      onChange={(e) => isHead ? setHeadName(e.target.value) : updateMember(m._key, 'name', e.target.value)}
                      placeholder={isHead ? 'Tên chủ hộ *' : 'Họ và tên *'}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-amber-500 uppercase">Năm sinh</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                          value={m.birthYear}
                          onChange={(e) => updateMember(m._key, 'birthYear', e.target.value)}
                          placeholder="1990"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-500 uppercase">Tuổi mụ</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                          value={m.age}
                          onChange={(e) => updateMember(m._key, 'age', e.target.value)}
                          placeholder="Tuổi"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-500 uppercase">Giới tính</label>
                        <select
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          value={m.gender ? 'male' : 'female'}
                          onChange={(e) => updateMember(m._key, 'gender', e.target.value === 'male')}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        value={m.dharmaName}
                        onChange={(e) => updateMember(m._key, 'dharmaName', e.target.value)}
                        placeholder="Pháp danh"
                      />
                      <AliveToggle
                        value={m.isAlive}
                        onChange={(v) => updateMember(m._key, 'isAlive', v)}
                      />
                    </div>

                    {p && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-amber-500">Tuổi mụ: <strong>{p.tuoiMu}</strong></span>
                        <SaoBadge value={p.sao} />
                        <HanBadge value={p.han} />
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addRow}
                className="w-full py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors"
              >
                + Thêm thành viên
              </button>
            </div>
          </div>
        )}

        {/* ── Submit ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Spinner className="h-4 w-4 text-white" />}
            {isEdit ? 'Cập nhật' : 'Lưu gia đình'}
          </button>
          <Link
            to="/families"
            className="text-center px-5 py-2.5 text-sm font-medium text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
          >
            Hủy
          </Link>
        </div>
      </form>
    </div>
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
