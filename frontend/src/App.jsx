import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import Login from './Login';
import Map from './Map';
import ComplaintForm from './ComplaintForm';
import PapForm from './PapForm';
import Dashboard from './Dashboard';
import AdminUsers from './AdminUsers';
function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div>
      <nav style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}>
        <a href="/map" style={{ marginRight: '15px' }}>Carte des bornes</a>
        <a href="/plainte" style={{ marginRight: '15px' }}>Déposer une plainte</a>
        <a href="/pap">Recensement PAP</a>
      </nav>
<a href="/dashboard" style={{ marginRight: '15px' }}>📊 Tableau de bord</a>
<a href="/admin/users" style={{ marginRight: '15px' }}>👥 Gestion utilisateurs</a>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/map" element={<PrivateRoute><Map /></PrivateRoute>} />
        <Route path="/plainte" element={<PrivateRoute><ComplaintForm /></PrivateRoute>} />
        <Route path="/pap" element={<PrivateRoute><PapForm /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/map" />} />
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
<Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
      </Routes>
    </div>
  );
}

export default App;