import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import FamilyListPage from './pages/FamilyListPage';
import FamilyDetailPage from './pages/FamilyDetailPage';
import FamilyFormPage from './pages/FamilyFormPage';
import PrayerRecordPage from './pages/PrayerRecordPage';
import ImportPage from './pages/ImportPage';
import PrintPage from './pages/PrintPage';
import LoginPage from './pages/LoginPage';
import { getCurrentAccount } from './services/api';

import TempleListPage from './pages/TempleListPage';
import TempleFormPage from './pages/TempleFormPage';
import AccountListPage from './pages/AccountListPage';
import AccountFormPage from './pages/AccountFormPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

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
  const account = getCurrentAccount();
  const { pathname } = useLocation();
  const isSuper = account?.role === 'SuperAdmin' || account?.Role === 'SuperAdmin';

  if (pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (pathname === '/in') return <PrintPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/families" element={<FamilyListPage />} />
        <Route path="/families/new" element={<FamilyFormPage />} />
        <Route path="/families/:id" element={<FamilyDetailPage />} />
        <Route path="/families/:id/edit" element={<FamilyFormPage />} />
        <Route path="/cau-an" element={<PrayerRecordPage type="CauAn" label="Cầu An" accent="emerald" />} />
        <Route path="/cau-sieu" element={<PrayerRecordPage type="CauSieu" label="Cầu Siêu" accent="purple" />} />
        <Route path="/import" element={<ImportPage />} />

        {/* SuperAdmin only routes */}
        {isSuper && (
          <>
            <Route path="/temples" element={<TempleListPage />} />
            <Route path="/temples/new" element={<TempleFormPage />} />
            <Route path="/temples/:id/edit" element={<TempleFormPage />} />
            <Route path="/accounts" element={<AccountListPage />} />
            <Route path="/accounts/new" element={<AccountFormPage />} />
            <Route path="/accounts/:id/edit" element={<AccountFormPage />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
