import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import Login from './Login';
import Map from './Map';
import ComplaintForm from './ComplaintForm';
import PapForm from './PapForm';
import AdminUsers from './AdminUsers';
import Dashboard from './Dashboard';

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div>
      <nav style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}>
        <a href="/dashboard" style={{ marginRight: '15px' }}>📊 Tableau de bord</a>
        <a href="/map" style={{ marginRight: '15px' }}>🗺️ Carte des bornes</a>
        <a href="/plainte" style={{ marginRight: '15px' }}>📝 Déposer une plainte</a>
        <a href="/pap" style={{ marginRight: '15px' }}>👥 Recensement PAP</a>
        <a href="/admin/users">👤 Gestion utilisateurs</a>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/map" element={<PrivateRoute><Map /></PrivateRoute>} />
        <Route path="/plainte" element={<PrivateRoute><ComplaintForm /></PrivateRoute>} />
        <Route path="/pap" element={<PrivateRoute><PapForm /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;