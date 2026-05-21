import React, { useEffect, useState } from 'react';
import { getDrones, getMissions } from '../services/api';
import socket from '../services/socket';

const StatCard = ({ title, value, color, icon }) => (
  <div className={`bg-gray-900 rounded-xl p-6 border-l-4 ${color} shadow-lg`}>
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [drones, setDrones] = useState([]);
  const [missions, setMissions] = useState([]);
  const [telemetryMap, setTelemetryMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const droneRes = await getDrones();
        const missionRes = await getMissions();
        setDrones(droneRes.data);
        setMissions(missionRes.data);
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

  const activeDrones = drones.filter(d => d.computed_status === 'active').length;
  const pendingMissions = missions.filter(m => m.status === 'pending').length;
  const completedMissions = missions.filter(m => m.status === 'completed').length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Fleet Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Drones" value={drones.length} color="border-green-400" icon="🚁" />
        <StatCard title="Active Drones" value={activeDrones} color="border-blue-400" icon="✈️" />
        <StatCard title="Pending Missions" value={pendingMissions} color="border-yellow-400" icon="⏳" />
        <StatCard title="Completed Missions" value={completedMissions} color="border-purple-400" icon="✅" />
      </div>

      {Object.values(telemetryMap).length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 mb-8 shadow-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-4">🔴 Live Telemetry</h3>
          <div className="flex flex-col gap-4">
            {Object.values(telemetryMap).map(telemetry => (
              <div key={telemetry.droneId} className="bg-gray-800 rounded-lg p-4">
                <p className="text-white font-semibold mb-3">{telemetry.droneName} <span className="text-gray-400 text-sm">(Drone #{telemetry.droneId})</span></p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs">Battery</p>
                    <p className="text-xl font-bold text-green-400">{telemetry.battery}%</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs">Altitude</p>
                    <p className="text-xl font-bold text-blue-400">{telemetry.altitude}m</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs">Speed</p>
                    <p className="text-xl font-bold text-yellow-400">{telemetry.speed} km/h</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs">Status</p>
                    <p className="text-xl font-bold text-purple-400">{telemetry.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Missions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Drone</th>
                <th className="text-left py-2">Priority</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {missions.slice(0, 5).map(m => (
                <tr key={m.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                  <td className="py-3">{m.title}</td>
                  <td className="py-3">{m.drone_name || 'Unassigned'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      m.priority === 'high' ? 'bg-red-900 text-red-300' :
                      m.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>{m.priority}</span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      m.status === 'completed' ? 'bg-green-900 text-green-300' :
                      m.status === 'in-progress' ? 'bg-blue-900 text-blue-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;