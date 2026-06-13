import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ComplaintForm() {
  const [communes, setCommunes] = useState([]);
  const [form, setForm] = useState({
    complaint_type: 'eau',
    description: '',
    commune_id: '',
    is_vbg: false,
    vbg_confidential_data: ''
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/communes')
      .then(res => setCommunes(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
const [photos, setPhotos] = useState([]);

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('photo', file);
  // Après création de la plainte, on récupère son id
  // On suppose que `complaintId` est disponible (stocké après soumission)
  await axios.post(`http://localhost:5000/api/complaints/${complaintId}/photo`, formData);
  setPhotos([...photos, URL.createObjectURL(file)]);
};

// Dans le formulaire :
<input type="file" accept="image/*" onChange={handleFileChange} />
<div>
  {photos.map((p, idx) => <img key={idx} src={p} alt="aperçu" width="100" />)}
</div>
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/complaints', form);
      alert('Plainte envoyée avec succès. Merci.');
      setForm(prev => ({ ...prev, description: '', vbg_confidential_data: '' }));
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
          <label>Commune :</label>
          <select name="commune_id" value={form.commune_id} onChange={handleChange} required>
            <option value="">-- Choisissez --</option>
            {communes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Description :</label>
          <textarea name="description" rows="4" cols="50" value={form.description} onChange={handleChange} required />
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