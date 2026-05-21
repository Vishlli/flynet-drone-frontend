import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAs, setLoginAs] = useState('operator');
  const { login } = useAuth();
  const navigate = useNavigate();

  const isAdmin = loginAs === 'admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({ email, password });
      if (isAdmin && res.data.user.role !== 'admin') {
        setError('This account does not have admin privileges.');
        setLoading(false);
        return;
      }
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className={`p-8 rounded-xl shadow-2xl w-full max-w-md border ${isAdmin ? 'bg-gray-900 border-green-600' : 'bg-gray-900 border-gray-800'}`}>
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold ${isAdmin ? 'text-green-400' : 'text-blue-400'}`}>🚁 Flynet</h1>
          <p className="text-gray-400 mt-1">Drone Fleet Management System</p>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6">
          <button
            onClick={() => setLoginAs('operator')}
            className={`flex-1 py-2 text-sm font-semibold transition ${!isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Operator Login
          </button>
          <button
            onClick={() => setLoginAs('admin')}
            className={`flex-1 py-2 text-sm font-semibold transition ${isAdmin ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Admin Login
          </button>
        </div>

        {isAdmin && (
          <div className="bg-green-950 border border-green-700 text-green-300 text-xs rounded-lg px-3 py-2 mb-4">
            Admin access is restricted. Only authorized personnel can log in as admin.
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isAdmin ? 'focus:ring-green-400' : 'focus:ring-blue-400'}`}
              placeholder="you@flynet.com"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isAdmin ? 'focus:ring-green-400' : 'focus:ring-blue-400'}`}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`font-semibold py-2 rounded-lg transition mt-2 text-white ${isAdmin ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {loading ? 'Logging in...' : `Login as ${isAdmin ? 'Admin' : 'Operator'}`}
          </button>
          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;