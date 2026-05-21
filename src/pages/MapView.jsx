import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getDrones } from '../services/api';
import socket from '../services/socket';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = () => {
  const [drones, setDrones] = useState([]);
  const [telemetryMap, setTelemetryMap] = useState({});

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
      setTelemetryMap(prev => ({ ...prev, [data.droneId]: data }));
    });

    return () => {
      socket.off('drone-telemetry');
      socket.disconnect();
    };
  }, []);

  const getDronePosition = (drone) => {
    const live = telemetryMap[drone.id];
    if (live) return [live.latitude, live.longitude];
    return [parseFloat(drone.latitude), parseFloat(drone.longitude)];
  };

  const centerLat = drones.length > 0
    ? drones.reduce((sum, d) => sum + parseFloat(d.latitude), 0) / drones.length
    : 13.0827;
  const centerLng = drones.length > 0
    ? drones.reduce((sum, d) => sum + parseFloat(d.longitude), 0) / drones.length
    : 80.2707;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Live Map View</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {drones.map(drone => (
          <div key={drone.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
            <p className="text-white font-semibold text-sm">{drone.name}</p>
            <p className="text-gray-400 text-xs">{drone.model}</p>
            <p className="text-xs mt-1">
              <span className={`px-2 py-0.5 rounded font-semibold ${
                drone.computed_status === 'active' ? 'bg-green-900 text-green-300' :
                drone.status === 'maintenance' ? 'bg-red-900 text-red-300' :
                'bg-gray-700 text-gray-300'
              }`}>{drone.computed_status || drone.status}</span>
            </p>
            {telemetryMap[drone.id] && (
              <p className="text-green-400 text-xs mt-1">Battery: {telemetryMap[drone.id].battery}%</p>
            )}
          </div>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-800" style={{ height: '550px' }}>
        <MapContainer
          center={[centerLat, centerLng]}
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
                  <p>Status: {drone.computed_status || drone.status}</p>
                  <p>Battery: {telemetryMap[drone.id]?.battery ?? drone.battery}%</p>
                  {telemetryMap[drone.id] && (
                    <>
                      <p>Speed: {telemetryMap[drone.id].speed} km/h</p>
                      <p>Altitude: {telemetryMap[drone.id].altitude}m</p>
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