import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/dashboard-stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <div>Chargement...</div>;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const exportPDF = () => window.open('http://localhost:5000/api/export/pdf');
const exportExcel = () => window.open('http://localhost:5000/api/export/excel');

<button onClick={exportPDF}>📄 Exporter PDF</button>
<button onClick={exportExcel}>📊 Exporter Excel</button>
  return (
    <div>
      <h2>Tableau de bord SEWASH</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div className="card">Total plaintes : {stats.totalComplaints}</div>
        <div className="card">Taux résolution : {stats.resolutionRate}%</div>
        <div className="card">PAP recensés : {stats.totalPaps}</div>
        <div className="card">PAP indemnisés : {stats.indemnifiedPaps}</div>
        <div className="card">Bornes totales : {stats.totalBornes}</div>
        <div className="card">Bornes actives : {stats.activeBornes}</div>
<div style={{ marginTop: '30px', textAlign: 'center' }}>
  <button onClick={() => window.open('http://localhost:5000/api/export/pdf')} style={{ marginRight: '15px', padding: '10px 20px', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
    📄 Exporter PDF
  </button>
  <button onClick={() => window.open('http://localhost:5000/api/export/excel')} style={{ padding: '10px 20px', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
    📊 Exporter Excel
  </button>
</div>
      </div>

      <h3>Plaintes par type</h3>
      <PieChart width={400} height={400}>
        <Pie data={stats.complaintsByType} dataKey="count" nameKey="complaint_type" cx="50%" cy="50%" outerRadius={100} label>
          {stats.complaintsByType.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>

      <h3>Évolution mensuelle des plaintes</h3>
      <BarChart width={600} height={300} data={stats.monthlyComplaints.map(m => ({ month: m.month.slice(0,7), count: parseInt(m.count) }))}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#82ca9d" />
      </BarChart>
    </div>
  );
}

export default Dashboard;