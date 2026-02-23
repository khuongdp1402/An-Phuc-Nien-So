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

  const saoArr = isMale ? SAO_NAM : SAO_NU;
  const sao = saoArr[(tuoiMu - 1) % saoArr.length];

  let han;
  if (tuoiMu < 10) {
    han = 'Bình An';
  } else {
    const hanArr = isMale ? HAN_NAM : HAN_NU;
    if (tuoiMu <= 17) {
      han = hanArr[tuoiMu - 10];
    } else {
      const col = Math.floor((tuoiMu - 18) / 9) + 2;
      const pos = (tuoiMu - 18) % 9;
      const hanIndex = pos < col ? pos : pos - 1;
      han = hanArr[hanIndex % hanArr.length];
    }
  }

  return { tuoiMu, sao, han };
}
