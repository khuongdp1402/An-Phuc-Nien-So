import { useState } from 'react';

const PRESETS = [
  { label: '10,000', value: 10000 },
  { label: '20,000', value: 20000 },
  { label: '30,000', value: 30000 },
  { label: '50,000', value: 50000 },
  { label: '100,000', value: 100000 },
  { label: '200,000', value: 200000 },
  { label: '500,000', value: 500000 },
  { label: '1,000,000', value: 1000000 },
  { label: '2,000,000', value: 2000000 },
  { label: '5,000,000', value: 5000000 },
];

export default function DonationPicker({ value, onChange }) {
  const [custom, setCustom] = useState(false);

  const isPreset = PRESETS.some((p) => p.value === value);
  const showCustom = custom || (value && !isPreset);

  function handleSelect(e) {
    const v = e.target.value;
    if (v === 'custom') {
      setCustom(true);
      return;
    }
    if (v === '') {
      setCustom(false);
      onChange(null);
      return;
    }
    setCustom(false);
    onChange(Number(v));
  }

  function handleCustomInput(e) {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw ? Number(raw) : null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="min-w-0 flex-1 sm:flex-none rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={showCustom ? 'custom' : (value ?? '')}
        onChange={handleSelect}
      >
        <option value="">Chọn số tiền</option>
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}đ</option>
        ))}
        <option value="custom">Nhập số khác...</option>
      </select>

      {showCustom && (
        <input
          type="text"
          inputMode="numeric"
          className="w-full sm:w-36 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={value ? Number(value).toLocaleString('vi-VN') : ''}
          onChange={handleCustomInput}
          placeholder="Nhập số tiền"
          autoFocus
        />
      )}

      {value > 0 && !showCustom && (
        <span className="text-xs text-amber-600">{Number(value).toLocaleString('vi-VN')}đ</span>
      )}
    </div>
  );
}

export function formatDonation(amount) {
  if (!amount) return '—';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
}
