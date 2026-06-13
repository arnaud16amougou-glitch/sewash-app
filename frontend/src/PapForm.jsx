import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PapForm() {
  const [communes, setCommunes] = useState([]);
  const [pap, setPap] = useState({
    full_name: '', phone: '', id_card_number: '', commune_id: '',
    lat: '', lng: '', has_title: false, is_vulnerable: false, vulnerability_type: ''
  });
  const [biens, setBiens] = useState([]);
  const [currentBien, setCurrentBien] = useState({ bien_type: '', surface_m2: '', description: '' });

  useEffect(() => {
    axios.get('http://localhost:5000/api/communes').then(res => setCommunes(res.data));
  }, []);

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
      const resPap = await axios.post('http://localhost:5000/api/pap', pap);
      for (let bien of biens) {
        await axios.post('http://localhost:5000/api/biens', { ...bien, pap_id: resPap.data.id });
      }
      alert('PAP enregistré');
      setPap({ full_name: '', phone: '', id_card_number: '', commune_id: '', lat: '', lng: '', has_title: false, is_vulnerable: false, vulnerability_type: '' });
      setBiens([]);
    } catch (err) {
      alert('Erreur');
    }
  };

  return (
    <div>
      <h2>Recensement PAP</h2>
      <input placeholder="Nom complet" value={pap.full_name} onChange={e => setPap({...pap, full_name: e.target.value})} />
      <input placeholder="Téléphone" value={pap.phone} onChange={e => setPap({...pap, phone: e.target.value})} />
      <input placeholder="CNI" value={pap.id_card_number} onChange={e => setPap({...pap, id_card_number: e.target.value})} />
      <select value={pap.commune_id} onChange={e => setPap({...pap, commune_id: e.target.value})}>
        <option value="">Commune</option>
        {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button onClick={getLocation}>📍 Position GPS</button>
      {pap.lat && <span>Lat: {pap.lat}, Lng: {pap.lng}</span>}
      <label><input type="checkbox" checked={pap.has_title} onChange={e => setPap({...pap, has_title: e.target.checked})} /> Titre foncier</label>
      <label><input type="checkbox" checked={pap.is_vulnerable} onChange={e => setPap({...pap, is_vulnerable: e.target.checked})} /> Vulnérable</label>
      {pap.is_vulnerable && <input placeholder="Type vulnérabilité" value={pap.vulnerability_type} onChange={e => setPap({...pap, vulnerability_type: e.target.value})} />}
      
      <h3>Ajouter un bien</h3>
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
      <ul>{biens.map((b, i) => <li key={i}>{b.bien_type} - {b.surface_m2} m² - {b.description}</li>)}</ul>
      <button onClick={submitPap}>Enregistrer PAP</button>
    </div>
  );
}

export default PapForm;