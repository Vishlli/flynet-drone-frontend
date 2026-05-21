import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    socket.connect();
    socket.on('new-alert', () => {
      setUnreadCount(prev => prev + 1);
    });
    return () => {
      socket.off('new-alert');
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/drones', label: 'Drones' },
    { to: '/missions', label: 'Missions' },
    { to: '/map', label: 'Map' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/reports', label: 'Reports' },
    ...(isAdmin ? [{ to: '/users', label: 'Users' }] : []),
  ];

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-bold text-xl">🚁 Flynet</span>
          <span className="text-gray-400 text-sm hidden sm:block">Drone Management</span>
          {isAdmin && <span className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded ml-2">Admin</span>}
        </div>

        <div className="hidden lg:flex gap-6 items-center">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="hover:text-green-400 transition text-sm">{link.label}</Link>
          ))}
          <Link to="/alerts" className="hover:text-green-400 transition relative text-sm">
            Alerts
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-3 ml-4">
            <span className="text-gray-400 text-sm">{user?.name}</span>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition">
              Logout
            </button>
          </div>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-gray-400 hover:text-white focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden mt-4 flex flex-col gap-3 border-t border-gray-800 pt-4">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="hover:text-green-400 transition text-sm" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link to="/alerts" className="hover:text-green-400 transition text-sm flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            Alerts
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
            )}
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <span className="text-gray-400 text-sm">{user?.name}</span>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;