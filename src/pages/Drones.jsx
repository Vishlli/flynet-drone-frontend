import React, { useEffect, useState } from 'react';
import { getDrones, createDrone, deleteDrone } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Drones = () => {
  const [drones, setDrones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({
    name: '', model: '', max_altitude: '', max_speed: '', payload_capacity: ''
  });

  const fetchDrones = async () => {
    try {
      const res = await getDrones();
      setDrones(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchDrones(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createDrone(form);
      setForm({ name: '', model: '', max_altitude: '', max_speed: '', payload_capacity: '' });
      setShowForm(false);
      fetchDrones();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this drone?')) return;
    try {
      await deleteDrone(id);
      fetchDrones();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Drone Registry</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ Add Drone'}
        </button>
      </div>

      {!isAdmin && (
        <div className="bg-yellow-900 border border-yellow-600 text-yellow-300 rounded-lg px-4 py-3 mb-6 text-sm">
          You can add drones. Only admins can delete or update drone records.
        </div>
      )}

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Register New Drone</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Drone Name', key: 'name', placeholder: 'e.g. Falcon-2' },
              { label: 'Model', key: 'model', placeholder: 'e.g. FN-X300' },
              { label: 'Max Altitude (m)', key: 'max_altitude', placeholder: 'e.g. 500' },
              { label: 'Max Speed (km/h)', key: 'max_speed', placeholder: 'e.g. 80' },
              { label: 'Payload Capacity (kg)', key: 'payload_capacity', placeholder: 'e.g. 5' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-gray-400 text-sm mb-1 block">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition"
              >
                {loading ? 'Registering...' : 'Register Drone'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drones.map(drone => (
          <div key={drone.id} className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 hover:border-green-400 transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{drone.name}</h3>
                <p className="text-gray-400 text-sm">{drone.model}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                drone.computed_status === 'active' ? 'bg-green-900 text-green-300' :
                drone.status === 'maintenance' ? 'bg-red-900 text-red-300' :
                'bg-gray-700 text-gray-300'
              }`}>{drone.computed_status || drone.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Battery</p>
                <p className="text-white font-semibold">{drone.battery}%</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Max Speed</p>
                <p className="text-white font-semibold">{drone.max_speed} km/h</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Max Altitude</p>
                <p className="text-white font-semibold">{drone.max_altitude}m</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Payload</p>
                <p className="text-white font-semibold">{drone.payload_capacity}kg</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(drone.id)}
                className="w-full bg-red-900 hover:bg-red-700 text-red-300 py-2 rounded-lg text-sm transition"
              >
                Delete Drone
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drones;