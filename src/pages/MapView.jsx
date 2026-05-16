import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getDrones } from '../services/api';
import socket from '../services/socket';
import 'leaflet/dist/leaflet.css';

// fix leaflet default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = () => {
  const [drones, setDrones] = useState([]);
  const [telemetry, setTelemetry] = useState({});

  useEffect(() => {
    const fetchDrones = async () => {
      try {
        const res = await getDrones();
        setDrones(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDrones();

    socket.connect();
    socket.on('drone-telemetry', (data) => {
      setTelemetry(prev => ({ ...prev, [data.droneId]: data }));
    });

    return () => {
      socket.off('drone-telemetry');
      socket.disconnect();
    };
  }, []);

  const getDronePosition = (drone) => {
    const live = telemetry[drone.id];
    if (live) return [live.latitude, live.longitude];
    return [parseFloat(drone.latitude), parseFloat(drone.longitude)];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Live Map View</h2>
      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-800" style={{ height: '600px' }}>
        <MapContainer
          center={[13.0827, 80.2707]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {drones.map(drone => (
            <Marker key={drone.id} position={getDronePosition(drone)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{drone.name}</p>
                  <p>Model: {drone.model}</p>
                  <p>Status: {drone.status}</p>
                  <p>Battery: {telemetry[drone.id]?.battery ?? drone.battery}%</p>
                  {telemetry[drone.id] && (
                    <>
                      <p>Speed: {telemetry[drone.id].speed} km/h</p>
                      <p>Altitude: {telemetry[drone.id].altitude}m</p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;