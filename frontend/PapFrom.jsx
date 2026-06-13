import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PapForm() {
  const [communes, setCommunes] = useState([]);
  const [pap, setPap] = useState({
    full_name: '',
    phone: '',
    id_card_number: '',
    commune_id: '',
    lat: '',
    lng: '',
    has_title: false,
    is_vulnerable: false,
    vulnerability_type: ''
  });
  const [biens, setBiens] = useState([]);
  const [currentBien, setCurrentBien] = useState({ bien_type: '', surface_m2: '', description: '' });
const [bienPhoto, setBienPhoto] = useState(null);
const handleBienPhoto = (e) => setBienPhoto(e.target.files[0]);
  useEffect(() => {
    axios.get('http://localhost:5000/api/communes')
      .then(res => setCommunes(res.data));
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setPap(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      }, () => alert('Impossible d’obtenir la position'));
    } else {
      alert('Géolocalisation non supportée');
    }
  };

  const addBien = () => {
    if (currentBien.bien_type && currentBien.surface_m2) {
      setBiens([...biens, currentBien]);
      setCurrentBien({ bien_type: '', surface_m2: '', description: '' });
    } else {
      alert('Veuillez renseigner le type et la surface du bien');
    }
  };

  const submitPap = async () => {
    try {
      const resPap = await axios.post('http://localhost:5000/api/pap', pap);
      const papId = resPap.data.id;
      for (let bien of biens) {
        await axios.post('http://localhost:5000/api/biens', { ...bien, pap_id: papId });
      }
      alert('PAP et biens enregistrés avec succès');
      // Réinitialiser
      setPap({ full_name: '', phone: '', id_card_number: '', commune_id: '', lat: '', lng: '', has_title: false, is_vulnerable: false, vulnerability_type: '' });
      setBiens([]);
    } catch (err) {
      alert('Erreur lors de l’enregistrement');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Recensement des Personnes Affectées (PAP)</h2>
      <div>
        <input placeholder="Nom complet" value={pap.full_name} onChange={e => setPap({...pap, full_name: e.target.value})} />
        <input placeholder="Téléphone" value={pap.phone} onChange={e => setPap({...pap, phone: e.target.value})} />
        <input placeholder="Numéro CNI" value={pap.id_card_number} onChange={e => setPap({...pap, id_card_number: e.target.value})} />
        <select value={pap.commune_id} onChange={e => setPap({...pap, commune_id: e.target.value})}>
          <option value="">Commune</option>
          {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" onClick={getLocation}>📍 Obtenir position GPS</button>
        {pap.lat && <span>Lat: {pap.lat}, Lng: {pap.lng}</span>}
        <label>
          <input type="checkbox" checked={pap.has_title} onChange={e => setPap({...pap, has_title: e.target.checked})} /> Titre foncier
        </label>
        <label>
          <input type="checkbox" checked={pap.is_vulnerable} onChange={e => setPap({...pap, is_vulnerable: e.target.checked, vulnerability_type: ''})} /> Personne vulnérable
        </label>
        {pap.is_vulnerable && (
          <input placeholder="Type de vulnérabilité" value={pap.vulnerability_type} onChange={e => setPap({...pap, vulnerability_type: e.target.value})} />
        )}
      </div>

      <h3>Ajouter un bien affecté</h3>
      <div>
        <select value={currentBien.bien_type} onChange={e => setCurrentBien({...currentBien, bien_type: e.target.value})}>
          <option value="">Type de bien</option>
          <option value="terrain">Terrain</option>
          <option value="construction">Construction</option>
          <option value="culture">Culture</option>
          <option value="commerce_informel">Commerce informel</option>
        </select>
        <input placeholder="Surface (m²)" value={currentBien.surface_m2} onChange={e => setCurrentBien({...currentBien, surface_m2: e.target.value})} />
        <input placeholder="Description" value={currentBien.description} onChange={e => setCurrentBien({...currentBien, description: e.target.value})} />
        <button type="button" onClick={addBien}>➕ Ajouter bien</button>
      </div>

      <ul>
        {biens.map((b, idx) => <li key={idx}>{b.bien_type} - {b.surface_m2} m² - {b.description}</li>)}
      </ul>

      <button onClick={submitPap}>💾 Enregistrer PAP</button>
    </div>
  );
}

export default PapForm;