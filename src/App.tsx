import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MeetingDetails from './pages/MeetingDetails';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import AudioRoom from './pages/AudioRoom';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="meetings/:id" element={<MeetingDetails />} />
          <Route path="profile" element={<Profile />} />
          <Route path="meetings/:id" element={<MeetingDetails />} />
          <Route path="meetings/:id/room" element={<AudioRoom />} />
           {/* NOUVELLE LIGNE ICI */}
        </Route>
      </Routes>
    </Router>
  );
}

// function DashboardRouter() {
//   const userStr = localStorage.getItem('adc_user');
//   if (!userStr) return <Navigate to="/login" replace />;
  
//   const user = JSON.parse(userStr);
//   if (user.role === 'admin') {
//     return <AdminDashboard />;
//   }
//   return <MemberDashboard />;
// }
function DashboardRouter() {
  const userStr = localStorage.getItem('adc_user');
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  // 👉 Si c'est un admin OU un chef, on lui montre l'interface de gestion
  if (user.role === 'admin' || user.role === 'chef') {
    return <AdminDashboard />;
  }
  // Sinon, c'est un membre simple
  return <MemberDashboard />;
}
