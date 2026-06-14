import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    axios.get(`${API_URL}/regions`).then(res => setRegions(res.data));
  }, []);

  useEffect(() => {
    const url = selectedRegion ? `${API_URL}/dashboard?region=${selectedRegion}` : `${API_URL}/dashboard`;
    axios.get(url).then(res => setStats(res.data)).catch(console.error);
  }, [selectedRegion]);

  if (!stats) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Tableau de bord SEWASH</h2>
      <div>
        <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>
          <option value="">Toutes les régions</option>
          {regions.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
        </select>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>📊 Total plaintes : {stats.totalComplaints}</li>
        <li>✅ Taux résolution : {stats.resolutionRate}%</li>
        <li>👥 PAP enregistrés : {stats.totalPaps}</li>
        <li>💰 PAP indemnisés : {stats.indemnifiedPaps}</li>
        <li>🚰 Bornes actives : {stats.activeBornes} / {stats.totalBornes}</li>
      </ul>
      <button onClick={() => window.open(`${API_URL}/export/pdf?region=${selectedRegion}`)}>📄 PDF</button>
      <button onClick={() => window.open(`${API_URL}/export/excel?region=${selectedRegion}`)}>📊 Excel</button>
    </div>
  );
}
export default Dashboard;