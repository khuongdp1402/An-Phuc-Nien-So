const SAO_NAM = [
  'La Hầu', 'Thổ Tú', 'Thủy Diệu', 'Thái Bạch', 'Thái Dương',
  'Vân Hớn', 'Kế Đô', 'Thái Âm', 'Mộc Đức',
];

const SAO_NU = [
  'Kế Đô', 'Vân Hớn', 'Mộc Đức', 'Thái Âm', 'Thổ Tú',
  'La Hầu', 'Thái Dương', 'Thái Bạch', 'Thủy Diệu',
];

const HAN_NAM = [
  'Huỳnh Tuyền', 'Tam Kheo', 'Ngũ Mộ', 'Thiên Tinh',
  'Tán Tận', 'Thiên La', 'Địa Võng', 'Diêm Vương',
];

const HAN_NU = [
  'Tán Tận', 'Thiên Tinh', 'Ngũ Mộ', 'Tam Kheo',
  'Huỳnh Tuyền', 'Diêm Vương', 'Địa Võng', 'Thiên La',
];

export function calcSaoHan(birthYear, isMale, currentYear) {
  const tuoiMu = currentYear - birthYear + 1;
  if (tuoiMu <= 0) return { tuoiMu, sao: '—', han: '—' };

  // Dưới 10 tuổi: không sao không hạn. 10 tuổi: chỉ sao, không hạn. >= 11 tuổi: có cả sao và hạn.
  let sao;
  if (tuoiMu < 10) {
    sao = '—';
  } else {
    const saoArr = isMale ? SAO_NAM : SAO_NU;
    sao = saoArr[(tuoiMu - 1) % saoArr.length];
  }

  let han;
  if (tuoiMu <= 10) {
    han = '—';
  } else {
    const hanArr = isMale ? HAN_NAM : HAN_NU;
    if (tuoiMu <= 17) {
      han = hanArr[tuoiMu - 10 - 1]; // 11 -> 0, 12 -> 1, ...
    } else {
      const col = Math.floor((tuoiMu - 18) / 9) + 2;
      const pos = (tuoiMu - 18) % 9;
      const hanIndex = pos < col ? pos : pos - 1;
      han = hanArr[hanIndex % hanArr.length];
    }
  }

  return { tuoiMu, sao, han };
}

/** Áp dụng quy tắc hiển thị: tuổi &lt; 10 không hiện sao, tuổi ≤ 10 không hiện hạn. Dùng khi hiển thị dữ liệu từ API (đã lưu sao thật cho ≤9). */
export function displaySaoHan(sao, han, tuoiMu) {
  const t = tuoiMu != null ? Number(tuoiMu) : null;
  return {
    displaySao: t != null && t < 10 ? '—' : (sao ?? '—'),
    displayHan: t != null && t <= 10 ? '—' : (han ?? '—'),
  };
}
