import { useState, useRef, useCallback } from 'react';
import { processText, ocrImage, saveImport } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const EMPTY_ROW = () => ({
  name: '',
  birthYear: '',
  gender: true,
  dharmaName: '',
  isAlive: true,
});

export default function ImportPage() {
  const [tab, setTab] = useState('text');
  const [rawText, setRawText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [members, setMembers] = useState([]);
  const [ocrText, setOcrText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [familyName, setFamilyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const fileRef = useRef(null);
  const dragCounter = useRef(0);
  const [dragging, setDragging] = useState(false);

  const flash = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  function handleFile(file) {
    if (!file?.type.startsWith('image/')) {
      flash('Vui lòng chọn file ảnh.', 'error');
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function onDragEnter(e) {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }

  function onDrop(e) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleParse() {
    setLoading(true);
    setMembers([]);
    setOcrText('');
    try {
      let res;
      if (tab === 'text') {
        if (!rawText.trim()) { flash('Vui lòng nhập nội dung.', 'error'); return; }
        res = await processText(rawText);
      } else {
        if (!imageFile) { flash('Vui lòng chọn ảnh.', 'error'); return; }
        res = await ocrImage(imageFile);
        setOcrText(res.extractedText ?? '');
      }

      if (res.headOfHouseholdName && !familyName) setFamilyName(res.headOfHouseholdName);
      if (res.address && !address) setAddress(res.address);

      const rows = (res.members ?? []).map((m) => ({
        name: m.name ?? '',
        birthYear: m.birthYear ?? '',
        gender: m.gender ?? true,
        dharmaName: m.dharmaName ?? '',
        isAlive: m.isAlive ?? true,
      }));
      setMembers(rows.length ? rows : [EMPTY_ROW()]);
      if (rows.length === 0) flash('Không nhận diện được thành viên. Vui lòng thêm thủ công.', 'error');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function updateRow(idx, field, value) {
    setMembers((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function removeRow(idx) {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  }

  function addRow() {
    setMembers((prev) => [...prev, EMPTY_ROW()]);
  }

  async function handleSave() {
    const valid = members.filter((m) => m.name.trim());
    if (valid.length === 0) { flash('Cần ít nhất một thành viên có họ tên.', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        headOfHouseholdName: familyName || valid[0].name,
        address: address || null,
        phoneNumber: phone || null,
        members: valid.map((m) => ({
          name: m.name,
          birthYear: m.birthYear ? Number(m.birthYear) : null,
          gender: m.gender,
          dharmaName: m.dharmaName || null,
          isAlive: m.isAlive,
        })),
      };
      const res = await saveImport(payload);
      flash(`Đã lưu ${res.memberCount} thành viên vào gia đình.`, 'success');
      setMembers([]);
      setFamilyName('');
      setAddress('');
      setPhone('');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} />

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-900">Nhập liệu</h1>
        <span className="text-xs sm:text-sm text-amber-600 bg-amber-100 px-2.5 sm:px-3 py-1 rounded-full font-medium shrink-0">
          OCR + Văn bản
        </span>
      </div>

      {/* Input Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="flex border-b border-amber-100">
          <button
            onClick={() => setTab('text')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'text' ? 'text-amber-900 bg-amber-50 border-b-2 border-amber-600' : 'text-amber-500 hover:text-amber-700'}`}
          >
            Nhập văn bản
          </button>
          <button
            onClick={() => setTab('image')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'image' ? 'text-amber-900 bg-amber-50 border-b-2 border-amber-600' : 'text-amber-500 hover:text-amber-700'}`}
          >
            Tải ảnh lên (OCR)
          </button>
        </div>

        <div className="p-6">
          {tab === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-2">
                Dán dữ liệu thành viên — mỗi người một dòng
              </label>
              <textarea
                rows={8}
                className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-gray-800 placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                placeholder={"Nguyễn Văn A, SN 1990, Nam, PD: Thiện Đức\nTrần Thị B, sinh năm 1985, Nữ\nLê Văn C, 2000, Nam, đã mất"}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>
          ) : (
            <div
              onDragEnter={onDragEnter}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-amber-500 bg-amber-50' : 'border-amber-200 hover:border-amber-400'}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {preview ? (
                <div className="space-y-4">
                  <img src={preview} alt="preview" className="mx-auto max-h-64 rounded-lg shadow" />
                  <button onClick={() => fileRef.current?.click()} className="text-sm text-amber-600 underline">
                    Chọn ảnh khác
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <svg className="mx-auto h-10 w-10 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-amber-700 font-medium">Kéo thả ảnh vào đây</p>
                  <p className="text-amber-400 text-sm">hoặc</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Chọn tập tin
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={loading}
            className="mt-5 w-full py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner /> Đang xử lý…</> : tab === 'text' ? 'Phân tích văn bản' : 'Phân tích ảnh'}
          </button>

          {ocrText && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-amber-600 font-medium">Xem văn bản OCR trích xuất</summary>
              <pre className="mt-2 whitespace-pre-wrap bg-amber-50 rounded-lg p-3 text-gray-700 border border-amber-100">{ocrText}</pre>
            </details>
          )}
        </div>
      </section>

      {/* Results Table */}
      {members.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 space-y-6">
          <h2 className="text-lg font-bold text-amber-900">Kiểm tra & chỉnh sửa</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldInput label="Tên gia chủ" value={familyName} onChange={setFamilyName} placeholder="Tự động từ thành viên đầu tiên" />
            <FieldInput label="Địa chỉ" value={address} onChange={setAddress} />
            <FieldInput label="Số điện thoại" value={phone} onChange={setPhone} />
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-amber-700 border-b border-amber-100">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2">Họ tên</th>
                  <th className="pb-2 pr-2 w-28">Năm sinh</th>
                  <th className="pb-2 pr-2 w-28">Giới tính</th>
                  <th className="pb-2 pr-2">Pháp danh</th>
                  <th className="pb-2 pr-2 w-24 text-center">Hiện tiền</th>
                  <th className="pb-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={i} className="border-b border-amber-50 hover:bg-amber-50/50">
                    <td className="py-2 pr-2 text-amber-400 tabular-nums">{i + 1}</td>
                    <td className="py-2 pr-2">
                      <input className="w-full rounded-lg border border-amber-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400" value={m.name} onChange={(e) => updateRow(i, 'name', e.target.value)} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" className="w-full rounded-lg border border-amber-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400" value={m.birthYear} onChange={(e) => updateRow(i, 'birthYear', e.target.value)} />
                    </td>
                    <td className="py-2 pr-2">
                      <select className="w-full rounded-lg border border-amber-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" value={m.gender ? 'true' : 'false'} onChange={(e) => updateRow(i, 'gender', e.target.value === 'true')}>
                        <option value="true">Nam</option>
                        <option value="false">Nữ</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input className="w-full rounded-lg border border-amber-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400" value={m.dharmaName} onChange={(e) => updateRow(i, 'dharmaName', e.target.value)} />
                    </td>
                    <td className="py-2 pr-2 text-center">
                      <input type="checkbox" className="w-4 h-4 accent-amber-600 rounded" checked={m.isAlive} onChange={(e) => updateRow(i, 'isAlive', e.target.checked)} />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 transition-colors" title="Xóa">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-4">
            {members.map((m, i) => (
              <div key={i} className="border border-amber-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">#{i + 1}</span>
                  <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs">Xóa</button>
                </div>
                <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" placeholder="Họ tên" value={m.name} onChange={(e) => updateRow(i, 'name', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="rounded-lg border border-amber-200 px-3 py-2 text-sm" placeholder="Năm sinh" value={m.birthYear} onChange={(e) => updateRow(i, 'birthYear', e.target.value)} />
                  <select className="rounded-lg border border-amber-200 px-3 py-2 text-sm bg-white" value={m.gender ? 'true' : 'false'} onChange={(e) => updateRow(i, 'gender', e.target.value === 'true')}>
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>
                <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" placeholder="Pháp danh" value={m.dharmaName} onChange={(e) => updateRow(i, 'dharmaName', e.target.value)} />
                <label className="flex items-center gap-2 text-sm text-amber-700">
                  <input type="checkbox" className="w-4 h-4 accent-amber-600 rounded" checked={m.isAlive} onChange={(e) => updateRow(i, 'isAlive', e.target.checked)} />
                  Hiện tiền
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button onClick={addRow} className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors order-2 sm:order-1">
              + Thêm dòng
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {saving ? <><Spinner /> Đang lưu…</> : 'Lưu vào hệ thống'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-amber-700 mb-1">{label}</label>
      <input
        className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
