import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPrintData } from '../services/api';
import { formatDonation } from '../components/DonationPicker';
import Spinner from '../components/Spinner';
import logo from '../assets/logo.png';

const TYPE_LABELS = {
  CauAn: 'SỔ CẦU AN ĐẦU NĂM',
  CauSieu: 'SỔ CẦU SIÊU ĐẦU NĂM',
};

const MAX_ROWS = 19;

export default function PrintPage() {
  const [params] = useSearchParams();
  const year = Number(params.get('year'));
  const type = params.get('type') || 'CauAn';
  const recordId = params.get('recordId') || null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!year) { setError('Thiếu tham số năm'); setLoading(false); return; }
    getPrintData(year, type, recordId)
      .then(setData)
      .catch(() => setError('Không thể tải dữ liệu in'))
      .finally(() => setLoading(false));
  }, [year, type, recordId]);

  useEffect(() => {
    if (data && !printTriggered.current) {
      printTriggered.current = true;
      setTimeout(() => window.print(), 500);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Spinner className="h-8 w-8 text-amber-600" />
        <span className="ml-3 text-amber-700">Đang tải dữ liệu in...</span>
      </div>
    );
  }

  if (error || !data?.items?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white gap-4">
        <p className="text-red-600 font-medium">{error || 'Không có dữ liệu để in'}</p>
        <Link to={type === 'CauAn' ? '/cau-an' : '/cau-sieu'} className="text-amber-600 underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const label = TYPE_LABELS[type] || 'SỔ CẦU AN ĐẦU NĂM';

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link
          to={type === 'CauAn' ? '/cau-an' : '/cau-sieu'}
          className="text-sm text-amber-600 hover:text-amber-800"
        >
          &larr; Quay lại
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{data.items.length} phiếu</span>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
          >
            In / Tải PDF
          </button>
        </div>
      </div>

      {/* Print pages */}
      <div className="print-container">
        {data.items.map((family, pageIdx) => (
          <div key={family.id} className="print-page">
            <FormTemplate
              family={family}
              year={year}
              label={label}
              pageIdx={pageIdx}
              totalPages={data.items.length}
            />
          </div>
        ))}
      </div>

      <style>{printStyles}</style>
    </>
  );
}

function FormTemplate({ family, year, label }) {
  const emptyRows = Math.max(0, MAX_ROWS - family.members.length);

  return (
    <div className="form-sheet">
      {/* Header */}
      <div className="form-header">
        <div className="form-logo-col">
          <img src={logo} alt="" className="form-logo" />
        </div>
        <div className="form-title-col">
          <p className="form-org">BAN TRỊ SỰ PHẬT GIÁO</p>
          <p className="form-temple">CHÙA TÂY TRÚC</p>
          <p className="form-subtitle">{label}</p>
        </div>
        <div className="form-logo-col" />
      </div>

      {/* Family info */}
      <div className="form-info">
        <div className="form-info-row">
          <span className="form-label">Trại chủ:</span>
          <span className="form-value form-dotted">{family.familyName}</span>
          <span className="form-label" style={{ marginLeft: 'auto' }}>Tổ thọ:</span>
          <span className="form-value form-dotted" style={{ width: '60px' }}>
            {family.members.length > 0 ? family.members.length : ''}
          </span>
        </div>
        <div className="form-info-row">
          <span className="form-label">Pháp danh:</span>
          <span className="form-value form-dotted">
            {family.members[0]?.dharmaName || ''}
          </span>
        </div>
        <div className="form-info-row">
          <span className="form-label">Địa chỉ:</span>
          <span className="form-value form-dotted">{family.familyAddress || ''}</span>
        </div>
      </div>

      {/* Table */}
      <table className="form-table">
        <thead>
          <tr>
            <th className="col-stt">STT</th>
            <th className="col-name">HỌ TÊN</th>
            <th className="col-dharma">PHÁP DANH</th>
            <th className="col-age">TUỔI</th>
            <th className="col-sao">SAO</th>
            <th className="col-han">HẠN</th>
          </tr>
        </thead>
        <tbody>
          {family.members.map((m, i) => (
            <tr key={i}>
              <td className="col-stt">{i + 1}</td>
              <td className="col-name">{m.name}</td>
              <td className="col-dharma">{m.dharmaName || ''}</td>
              <td className="col-age">{m.tuoiMu}</td>
              <td className="col-sao">{m.sao}</td>
              <td className="col-han">{m.han}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="col-stt">{family.members.length + i + 1}</td>
              <td className="col-name" />
              <td className="col-dharma" />
              <td className="col-age" />
              <td className="col-sao" />
              <td className="col-han" />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer - donation */}
      {family.donationAmount > 0 && (
        <div className="form-footer">
          <span className="form-donation">{formatDonation(family.donationAmount)}</span>
        </div>
      )}
    </div>
  );
}

const printStyles = `
  /* ── Screen preview ─────────────────────────────────── */
  .print-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .print-page {
    background: white;
    margin-bottom: 30px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    border-radius: 4px;
    overflow: hidden;
  }

  /* ── Form sheet ─────────────────────────────────────── */
  .form-sheet {
    width: 100%;
    padding: 20mm 15mm 15mm 15mm;
    font-family: 'Times New Roman', Times, serif;
    font-size: 13px;
    color: #000;
    box-sizing: border-box;
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin-bottom: 12px;
  }
  .form-logo-col {
    width: 60px;
    flex-shrink: 0;
  }
  .form-logo {
    width: 50px;
    height: 50px;
    object-fit: contain;
    border-radius: 50%;
  }
  .form-title-col {
    flex: 1;
  }
  .form-org {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .form-temple {
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
    margin: 2px 0;
  }
  .form-subtitle {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    margin-top: 4px;
    letter-spacing: 1px;
  }

  .form-info {
    margin-bottom: 10px;
  }
  .form-info-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 13px;
  }
  .form-label {
    font-style: italic;
    white-space: nowrap;
  }
  .form-value {
    font-weight: 500;
  }
  .form-dotted {
    flex: 1;
    border-bottom: 1px dotted #666;
    padding-bottom: 1px;
    min-width: 40px;
  }

  /* ── Table ──────────────────────────────────────────── */
  .form-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .form-table th,
  .form-table td {
    border: 1px solid #333;
    padding: 3px 5px;
    text-align: center;
    vertical-align: middle;
    height: 22px;
  }
  .form-table thead th {
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    background: #f9f5ef;
  }
  .col-stt { width: 30px; }
  .col-name { width: 160px; text-align: left; padding-left: 8px !important; }
  .col-dharma { width: 100px; }
  .col-age { width: 45px; }
  .col-sao { width: 85px; }
  .col-han { width: 85px; }

  .form-table thead th.col-name { text-align: center; }

  .form-footer {
    margin-top: 8px;
    text-align: left;
    font-size: 14px;
    font-weight: 600;
    font-style: italic;
    color: #333;
  }
  .form-donation {
    color: #b91c1c;
  }

  /* ── Print styles ───────────────────────────────────── */
  @media print {
    @page {
      size: A5 portrait;
      margin: 8mm;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print\\:hidden { display: none !important; }
    .print-container {
      max-width: none;
      margin: 0;
      padding: 0;
    }
    .print-page {
      page-break-after: always;
      box-shadow: none;
      border-radius: 0;
      margin: 0;
    }
    .print-page:last-child {
      page-break-after: auto;
    }
    .form-sheet {
      padding: 6mm 8mm 8mm 8mm;
    }
    .form-table thead th {
      background: #f5f0e5 !important;
    }
  }
`;
