import React, { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SpecialistDashboard from './pages/SpecialistDashboard';
import Sidebar from './components/Sidebar';
import { Activity } from 'lucide-react';
import Consultations from './pages/Consultations';
import Reminders from './pages/Reminders';
import History from './pages/History';
import Profile from './pages/Profile';
import ReminderNotification from './components/common/ReminderNotification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOtp from './pages/VerifyOtp';
import FindDoctor from './pages/FindDoctor';
import { PublicLayout, Landing, Features, About, Contact } from './pages/PublicPages';
import { initializePushNotifications } from './services/notificationService';
import { Toaster } from 'react-hot-toast';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
};

// Layout Component for authenticated users
const DashboardLayout = ({ children }) => {
  useEffect(() => {
    // Only ask for permissions and setup when user is definitely logged in
    initializePushNotifications();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <ReminderNotification />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Mobile Header (Hidden on generic desktop view for now as Sidebar manages it) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// App Content
const AppContent = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* ... keeping public and admin dashboards the same ... */}
      {/* Public Landing Pages */}
      <Route element={user ? <Navigate to={`/${user.role === 'company_admin' ? 'admin' : user.role}`} replace /> : <PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      
      {/* Public Auth Routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />
      <Route path="/verify-otp" element={user ? <Navigate to="/" replace /> : <VerifyOtp />} />
      
      {/* Protected Dashboards */}
      <Route path="/patient" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout><PatientDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DashboardLayout><DoctorDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <DashboardLayout><AdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/laboratorist" element={
        <ProtectedRoute allowedRoles={['laboratorist']}>
          <DashboardLayout><SpecialistDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/radiologist" element={
        <ProtectedRoute allowedRoles={['radiologist']}>
          <DashboardLayout><SpecialistDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Additional Common Protected Routes */}
      <Route path="/consultations" element={
        <ProtectedRoute>
          <DashboardLayout><Consultations /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/find-doctor" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout><FindDoctor /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reminders" element={
        <ProtectedRoute>
          <DashboardLayout><Reminders /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <DashboardLayout><History /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctors" element={
        <ProtectedRoute allowedRoles={['company_admin']}>
          <DashboardLayout><AdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout><Profile /></DashboardLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
