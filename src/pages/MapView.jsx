import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getDrones, getMissions } from '../services/api';
import socket from '../services/socket';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const MapView = () => {
  const [drones, setDrones] = useState([]);
  const [missions, setMissions] = useState([]);
  const [telemetryMap, setTelemetryMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, mRes] = await Promise.all([getDrones(), getMissions()]);
        setDrones(dRes.data);
        setMissions(mRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    socket.connect();
    socket.on('drone-telemetry', (data) => {
      setTelemetryMap(prev => ({ ...prev, [data.droneId]: data }));
    });

    return () => {
      socket.off('drone-telemetry');
      socket.disconnect();
    };
  }, []);

  const getActiveMission = (droneId) => {
    return missions.find(m => m.drone_id === droneId && m.status === 'in-progress');
  };

  const getDronePosition = (drone) => {
    const activeMission = getActiveMission(drone.id);
    if (activeMission && activeMission.location_lat && activeMission.location_lng) {
      return [parseFloat(activeMission.location_lat), parseFloat(activeMission.location_lng)];
    }
    const live = telemetryMap[drone.id];
    if (live) return [live.latitude, live.longitude];
    return [parseFloat(drone.latitude), parseFloat(drone.longitude)];
  };

  const getDroneIcon = (drone) => {
    const activeMission = getActiveMission(drone.id);
    if (activeMission) return redIcon;
    if (drone.computed_status === 'active') return greenIcon;
    return greyIcon;
  };

  const centerLat = drones.length > 0
    ? drones.reduce((sum, d) => sum + parseFloat(d.latitude), 0) / drones.length
    : 13.0827;
  const centerLng = drones.length > 0
    ? drones.reduce((sum, d) => sum + parseFloat(d.longitude), 0) / drones.length
    : 80.2707;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Live Map View</h2>

      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span><span className="text-gray-400">On Mission</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span><span className="text-gray-400">Active</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block"></span><span className="text-gray-400">Idle</span></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {drones.map(drone => {
          const activeMission = getActiveMission(drone.id);
          return (
            <div key={drone.id} className={`bg-gray-900 rounded-lg p-3 border ${activeMission ? 'border-red-500' : 'border-gray-800'}`}>
              <p className="text-white font-semibold text-sm">{drone.name}</p>
              <p className="text-gray-400 text-xs">{drone.model}</p>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold mt-1 inline-block ${
                activeMission ? 'bg-red-900 text-red-300' :
                drone.computed_status === 'active' ? 'bg-green-900 text-green-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {activeMission ? 'On Mission' : drone.computed_status || drone.status}
              </span>
              {activeMission && <p className="text-red-400 text-xs mt-1 truncate">{activeMission.title}</p>}
              {telemetryMap[drone.id] && <p className="text-green-400 text-xs mt-1">Battery: {telemetryMap[drone.id].battery}%</p>}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-800" style={{ height: '520px' }}>
        <MapContainer center={[centerLat, centerLng]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {drones.map(drone => {
            const activeMission = getActiveMission(drone.id);
            return (
              <Marker key={drone.id} position={getDronePosition(drone)} icon={getDroneIcon(drone)}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{drone.name}</p>
                    <p>Model: {drone.model}</p>
                    <p>Status: {activeMission ? 'On Mission' : drone.computed_status || drone.status}</p>
                    {activeMission && <p>Mission: {activeMission.title}</p>}
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
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;