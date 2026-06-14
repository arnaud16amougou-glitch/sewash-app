import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

function Map() {
  const [bornes, setBornes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/regions`)
      .then(res => setRegions(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedRegion ? `${API_URL}/bornes?region=${selectedRegion}` : `${API_URL}/bornes`;
    axios.get(url)
      .then(res => {
        setBornes(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedRegion]);

  const centerByRegion = {
    EX: [10.6, 14.3],
    NO: [9.3, 13.4],
    AD: [7.3, 13.5],
    CE: [3.9, 11.5],
    LT: [4.1, 9.7]
  };
  const defaultCenter = [4.1, 9.7];
  const center = selectedRegion && centerByRegion[selectedRegion] ? centerByRegion[selectedRegion] : defaultCenter;

  if (loading) return <div>Chargement de la carte...</div>;

  return (
    <div>
      <h2>Cartographie des bornes-fontaines SEWASH</h2>
      <div style={{ marginBottom: '10px' }}>
        <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>
          <option value="">Toutes les régions</option>
          {regions.map(r => (
            <option key={r.id} value={r.code}>{r.name}</option>
          ))}
        </select>
      </div>
      <MapContainer center={center} zoom={10} style={{ height: '500px', width: '100%', marginTop: '10px' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {bornes.map(borne => (
          <Marker key={borne.id} position={[borne.lat, borne.lng]}>
            <Popup>
              <strong>{borne.code}</strong><br />
              Région : {borne.region_name}<br />
              Commune : {borne.commune_name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;