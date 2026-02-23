const GOOD_SAO = new Set(['Thủy Diệu', 'Thái Dương', 'Thái Âm', 'Mộc Đức']);
const GOOD_HAN = new Set(['Bình An']);

export function SaoBadge({ value }) {
  const good = GOOD_SAO.has(value);
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
      good ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
    }`}>
      {value}
    </span>
  );
}

export function HanBadge({ value }) {
  const good = GOOD_HAN.has(value);
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
      good ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
    }`}>
      {value}
    </span>
  );
}
