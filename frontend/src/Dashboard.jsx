import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Tableau de bord SEWASH</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>📊 Total plaintes : {stats.totalComplaints}</li>
        <li>✅ Taux résolution : {stats.resolutionRate}%</li>
        <li>👥 PAP enregistrés : {stats.totalPaps}</li>
        <li>💰 PAP indemnisés : {stats.indemnifiedPaps}</li>
        <li>🚰 Bornes actives : {stats.activeBornes} / {stats.totalBornes}</li>
      </ul>

      {/* Boutons d'exportation */}
      <div style={{ marginTop: '30px' }}>
        <button onClick={() => window.open('http://localhost:5000/api/export/pdf')} style={{ marginRight: '10px', padding: '8px 16px' }}>
          📄 Exporter PDF
        </button>
        <button onClick={() => window.open('http://localhost:5000/api/export/excel')} style={{ padding: '8px 16px' }}>
          📊 Exporter Excel
        </button>
      </div>
    </div>
  );
}

export default Dashboard;