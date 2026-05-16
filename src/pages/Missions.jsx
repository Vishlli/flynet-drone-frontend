import React, { useEffect, useState } from 'react';
import { getMissions, createMission, deleteMission, updateMission, getDrones } from '../services/api';

const Missions = () => {
  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', drone_id: '',
    start_time: '', end_time: '', location_lat: '', location_lng: ''
  });

  const fetchAll = async () => {
    try {
      const [mRes, dRes] = await Promise.all([getMissions(), getDrones()]);
      setMissions(mRes.data);
      setDrones(dRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMission(form);
      setForm({ title: '', description: '', priority: 'medium', drone_id: '', start_time: '', end_time: '', location_lat: '', location_lng: '' });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (mission, newStatus) => {
    try {
      await updateMission(mission.id, { ...mission, status: newStatus });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mission?')) return;
    try {
      await deleteMission(id);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Mission Control</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ New Mission'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Mission</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Mission Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Northern Patrol"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Assign Drone</label>
              <select
                value={form.drone_id}
                onChange={(e) => setForm({ ...form, drone_id: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              >
                <option value="">Select a drone</option>
                {drones.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mission details"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Start Time</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">End Time</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Latitude</label>
              <input
                type="text"
                value={form.location_lat}
                onChange={(e) => setForm({ ...form, location_lat: e.target.value })}
                placeholder="e.g. 13.0827"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Longitude</label>
              <input
                type="text"
                value={form.location_lng}
                onChange={(e) => setForm({ ...form, location_lng: e.target.value })}
                placeholder="e.g. 80.2707"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition"
              >
                {loading ? 'Creating...' : 'Create Mission'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {missions.map(mission => (
          <div key={mission.id} className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 hover:border-green-400 transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{mission.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{mission.description}</p>
                <p className="text-gray-500 text-xs mt-2">Drone: {mission.drone_name || 'Unassigned'}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  mission.priority === 'high' ? 'bg-red-900 text-red-300' :
                  mission.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-green-900 text-green-300'
                }`}>{mission.priority}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  mission.status === 'completed' ? 'bg-green-900 text-green-300' :
                  mission.status === 'in-progress' ? 'bg-blue-900 text-blue-300' :
                  'bg-yellow-900 text-yellow-300'
                }`}>{mission.status}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleStatusChange(mission, 'in-progress')}
                className="bg-blue-900 hover:bg-blue-700 text-blue-300 px-3 py-1 rounded text-sm transition"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleStatusChange(mission, 'completed')}
                className="bg-green-900 hover:bg-green-700 text-green-300 px-3 py-1 rounded text-sm transition"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleDelete(mission.id)}
                className="bg-red-900 hover:bg-red-700 text-red-300 px-3 py-1 rounded text-sm transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Missions;