import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PapForm() {
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [pap, setPap] = useState({
    full_name: '', phone: '', id_card_number: '', commune_id: '',
    lat: '', lng: '', has_title: false, is_vulnerable: false, vulnerability_type: ''
  });
  const [biens, setBiens] = useState([]);
  const [currentBien, setCurrentBien] = useState({ bien_type: '', surface_m2: '', description: '' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    axios.get(`${API_URL}/regions`).then(res => setRegions(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      axios.get(`${API_URL}/communes?region=${selectedRegion}`).then(res => setCommunes(res.data)).catch(console.error);
    } else {
      setCommunes([]);
    }
    setPap(prev => ({ ...prev, commune_id: '' }));
  }, [selectedRegion]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setPap(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      }, () => alert('Position non obtenue'));
    } else alert('Géolocalisation non supportée');
  };

  const addBien = () => {
    if (currentBien.bien_type && currentBien.surface_m2) {
      setBiens([...biens, currentBien]);
      setCurrentBien({ bien_type: '', surface_m2: '', description: '' });
    } else alert('Type et surface requis');
  };

  const submitPap = async () => {
    try {
      const resPap = await axios.post(`${API_URL}/pap`, pap);
      for (let bien of biens) {
        await axios.post(`${API_URL}/biens`, { ...bien, pap_id: resPap.data.id });
      }
      alert('PAP enregistré');
      setPap({ full_name: '', phone: '', id_card_number: '', commune_id: '', lat: '', lng: '', has_title: false, is_vulnerable: false, vulnerability_type: '' });
      setBiens([]);
      setSelectedRegion('');
    } catch (err) {
      alert('Erreur');
    }
  };

  return (
    <div>
      <h2>Recensement PAP</h2>
      <div>
        <label>Région :</label>
        <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} required>
          <option value="">-- Sélectionnez une région --</option>
          {regions.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
        </select>
      </div>
      <div>
        <label>Commune :</label>
        <select value={pap.commune_id} onChange={e => setPap({...pap, commune_id: e.target.value})} required disabled={!selectedRegion}>
          <option value="">-- Choisissez une commune --</option>
          {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input placeholder="Nom complet" value={pap.full_name} onChange={e => setPap({...pap, full_name: e.target.value})} />
      <input placeholder="Téléphone" value={pap.phone} onChange={e => setPap({...pap, phone: e.target.value})} />
      <input placeholder="CNI" value={pap.id_card_number} onChange={e => setPap({...pap, id_card_number: e.target.value})} />
      <button onClick={getLocation}>📍 Position GPS</button>
      {pap.lat && <span>Lat: {pap.lat}, Lng: {pap.lng}</span>}
      <div>
        <label><input type="checkbox" checked={pap.has_title} onChange={e => setPap({...pap, has_title: e.target.checked})} /> Titre foncier</label>
        <label><input type="checkbox" checked={pap.is_vulnerable} onChange={e => setPap({...pap, is_vulnerable: e.target.checked})} /> Vulnérable</label>
        {pap.is_vulnerable && <input placeholder="Type vulnérabilité" value={pap.vulnerability_type} onChange={e => setPap({...pap, vulnerability_type: e.target.value})} />}
      </div>
      <h3>Ajouter un bien</h3>
      <div>
        <select value={currentBien.bien_type} onChange={e => setCurrentBien({...currentBien, bien_type: e.target.value})}>
          <option value="">Type</option>
          <option value="terrain">Terrain</option>
          <option value="construction">Construction</option>
          <option value="culture">Culture</option>
          <option value="commerce_informel">Commerce informel</option>
        </select>
        <input placeholder="Surface (m²)" value={currentBien.surface_m2} onChange={e => setCurrentBien({...currentBien, surface_m2: e.target.value})} />
        <input placeholder="Description" value={currentBien.description} onChange={e => setCurrentBien({...currentBien, description: e.target.value})} />
        <button onClick={addBien}>Ajouter bien</button>
      </div>
      <ul>{biens.map((b, i) => <li key={i}>{b.bien_type} - {b.surface_m2} m² - {b.description}</li>)}</ul>
      <button onClick={submitPap}>Enregistrer PAP</button>
    </div>
  );
}

export default PapForm;