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

function Map() {
  const [bornes, setBornes] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/bornes')
      .then(response => setBornes(response.data))
      .catch(error => console.error('Erreur bornes:', error));
  }, []);

  const center = [4.051, 9.767];

  return (
    <div>
      <h2>Bornes-fontaines à Douala</h2>
      <MapContainer center={center} zoom={13} style={{ height: '500px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {bornes.map(borne => (
          <Marker key={borne.id} position={[borne.lat, borne.lng]}>
            <Popup>
              <strong>{borne.code}</strong><br />
              Statut : {borne.status}<br />
              <button onClick={() => window.open(`http://localhost:5000/api/bornes/${borne.code}/qrcode`, '_blank')}>
                Voir QR code
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;