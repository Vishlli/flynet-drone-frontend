import React, { useState } from 'react';
import { createUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const UserManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('admin');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createUser({ name: form.name, email: form.email, password: form.password, role: activeTab });
      setSuccess(`${activeTab === 'admin' ? 'Admin' : 'Operator'} account for ${form.email} created successfully.`);
      setForm({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
      <p className="text-gray-400 text-sm mb-6">Create admin or operator accounts directly. Users created here do not need to register.</p>

      <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6 max-w-lg">
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-2 text-sm font-semibold transition ${activeTab === 'admin' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          Add Admin
        </button>
        <button
          onClick={() => setActiveTab('operator')}
          className={`flex-1 py-2 text-sm font-semibold transition ${activeTab === 'operator' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          Add Operator
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 shadow-lg max-w-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          {activeTab === 'admin' ? 'Create Admin Account' : 'Create Operator Account'}
        </h3>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-400 text-sm mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Full name" required />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="user@flynet.com" required />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="••••••••" required />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className={`text-white font-semibold py-2 rounded-lg transition ${activeTab === 'admin' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
            {loading ? 'Creating...' : `Create ${activeTab === 'admin' ? 'Admin' : 'Operator'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;