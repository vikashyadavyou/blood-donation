import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import LiveDisplay from './pages/LiveDisplay';

/**
 * Root application component with client-side routing.
 *
 * Routes:
 *   /admin   → Admin Dashboard (Screening + Donation Bed desks)
 *   /display → Live HUD Display screen for TV casting
 *   /        → Redirects to /display
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/display" element={<LiveDisplay />} />
        <Route path="*" element={<Navigate to="/display" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
