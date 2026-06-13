import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'camwater',
    full_name: '',
    email: '',
    phone: ''
  });
  const [editingId, setEditingId] = useState(null);

  const loadUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/users/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        if (!form.password) {
          alert('Le mot de passe est requis pour créer un utilisateur');
          return;
        }
        await axios.post('http://localhost:5000/api/users', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setForm({ username: '', password: '', role: 'camwater', full_name: '', email: '', phone: '' });
      setEditingId(null);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Erreur lors de l’enregistrement');
    }
  };

  const handleEdit = (user) => {
    setForm({
      username: user.username,
      password: '',
      role: user.role,
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setEditingId(user.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    loadUsers();
  };

  return (
    <div>
      <h2>Gestion des utilisateurs (admin)</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>{editingId ? 'Modifier' : 'Ajouter'} un utilisateur</h3>
        <input name="username" placeholder="Nom d’utilisateur *" value={form.username} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Mot de passe * (laisser vide si modification)" value={form.password} onChange={handleChange} required={!editingId} />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="camwater">CAMWATER</option>
          <option value="admin">Administrateur</option>
          <option value="mairie">Mairie</option>
          <option value="entreprise">Entreprise</option>
          <option value="consultant">Consultant</option>
        </select>
        <input name="full_name" placeholder="Nom complet" value={form.full_name} onChange={handleChange} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="phone" placeholder="Téléphone" value={form.phone} onChange={handleChange} />
        <button type="submit">{editingId ? 'Mettre à jour' : 'Créer'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ username: '', password: '', role: 'camwater', full_name: '', email: '', phone: '' }); }}>Annuler</button>}
      </form>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>ID</th><th>Nom utilisateur</th><th>Rôle</th><th>Nom complet</th><th>Email</th><th>Téléphone</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>
                <button onClick={() => handleEdit(user)}>✏️</button>
                <button onClick={() => handleDelete(user.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsers;