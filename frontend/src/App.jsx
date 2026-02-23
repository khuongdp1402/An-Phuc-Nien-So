import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import FamilyListPage from './pages/FamilyListPage';
import FamilyDetailPage from './pages/FamilyDetailPage';
import FamilyFormPage from './pages/FamilyFormPage';
import PrayerRecordPage from './pages/PrayerRecordPage';
import ImportPage from './pages/ImportPage';
import PrintPage from './pages/PrintPage';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isPrint = pathname === '/in';

  if (isPrint) return <PrintPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/families" element={<FamilyListPage />} />
        <Route path="/families/new" element={<FamilyFormPage />} />
        <Route path="/families/:id" element={<FamilyDetailPage />} />
        <Route path="/families/:id/edit" element={<FamilyFormPage />} />
        <Route path="/cau-an" element={<PrayerRecordPage type="CauAn" label="Cầu An" accent="emerald" />} />
        <Route path="/cau-sieu" element={<PrayerRecordPage type="CauSieu" label="Cầu Siêu" accent="purple" />} />
        <Route path="/import" element={<ImportPage />} />
      </Routes>
    </AppLayout>
  );
}
