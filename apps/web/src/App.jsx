import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WalletAdapterProvider } from './providers/WalletProvider.jsx'
import LandingPage from './pages/Landing/LandingPage.jsx'
import DashboardPage from './pages/Dashboard/DashboardPage.jsx'
import WalletDetailPage from './pages/WalletDetail/WalletDetailPage.jsx'
import AuditLogPage from './pages/AuditLog/AuditLogPage.jsx'
import DocsPage from './pages/Docs/DocsPage.jsx'
import ApiSettings from './pages/Dashboard/ApiSettings.jsx'
import AppLayout from './layouts/AppLayout.jsx'

export default function App() {
  return (
    <WalletAdapterProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid #f3f4f6',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
          }}
        />
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* App routes with sidebar layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wallet/:id" element={<WalletDetailPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/settings" element={<ApiSettings />} />
            <Route path="/demo" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </WalletAdapterProvider>
  )
}
