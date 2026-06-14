import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ComplaintForm() {
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [form, setForm] = useState({
    complaint_type: 'eau',
    description: '',
    commune_id: '',
    is_vbg: false,
    vbg_confidential_data: ''
  });
  const [photo, setPhoto] = useState(null);
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
    setForm(prev => ({ ...prev, commune_id: '' }));
  }, [selectedRegion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => setPhoto(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/complaints`, form);
      const complaintId = res.data.id;
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        await axios.post(`${API_URL}/complaints/${complaintId}/photo`, formData);
      }
      alert('Plainte envoyée avec succès. Merci.');
      setForm({ complaint_type: 'eau', description: '', commune_id: '', is_vbg: false, vbg_confidential_data: '' });
      setSelectedRegion('');
      setPhoto(null);
    } catch (err) {
      alert('Erreur lors de l’envoi. Veuillez réessayer.');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Déposer une plainte</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Région :</label>
          <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} required>
            <option value="">-- Sélectionnez une région --</option>
            {regions.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label>Commune :</label>
          <select name="commune_id" value={form.commune_id} onChange={handleChange} required disabled={!selectedRegion}>
            <option value="">-- Choisissez une commune --</option>
            {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label>Type de plainte :</label>
          <select name="complaint_type" value={form.complaint_type} onChange={handleChange}>
            <option value="eau">Problème d’eau (qualité, coupure)</option>
            <option value="indemnisation">Indemnisation</option>
            <option value="nuisance">Nuisance (bruit, poussière)</option>
            <option value="vbh">Violence / harcèlement</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label>Description :</label>
          <textarea name="description" rows="4" cols="50" value={form.description} onChange={handleChange} required />
        </div>
        <div>
          <label>Photo (optionnelle) :</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <label>
            <input type="checkbox" name="is_vbg" checked={form.is_vbg} onChange={handleChange} />
            Cette plainte concerne une violence basée sur le genre (VBG)
          </label>
        </div>
        {form.is_vbg && (
          <div>
            <label>Informations confidentielles (VBG) :</label>
            <textarea name="vbg_confidential_data" rows="3" cols="50" value={form.vbg_confidential_data} onChange={handleChange} />
            <small>Ces données seront visibles uniquement par les spécialistes VBG.</small>
          </div>
        )}
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
}

export default ComplaintForm;