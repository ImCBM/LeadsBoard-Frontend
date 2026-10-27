import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import TagsPage from './pages/TagsPage';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface-container-lowest)',
            color: 'var(--on-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--outline-variant)',
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#1fa97d', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#c13f2c', secondary: '#ffffff' },
          },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="tags" element={<TagsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
