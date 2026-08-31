import { Routes, Route, Navigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import AskData from '@/pages/AskData';
import DataSources from '@/pages/DataSources';
import QueryHistory from '@/pages/QueryHistory';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Layout = ({ children }: { children: React.ReactElement }) => (
  <div className="flex h-screen overflow-hidden bg-background">
    <AppSidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="container mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ask-data"
        element={
          <ProtectedRoute>
            <Layout>
              <AskData />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/data-sources"
        element={
          <ProtectedRoute>
            <Layout>
              <DataSources />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/query-history"
        element={
          <ProtectedRoute>
            <Layout>
              <QueryHistory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
