import React, { useEffect, useState } from 'react';
import { getAlerts, markAsRead, markAllAsRead, deleteAlert } from '../services/api';
import socket from '../services/socket';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();

    socket.connect();
    socket.on('new-alert', (alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    return () => {
      socket.off('new-alert');
      socket.disconnect();
    };
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await Promise.all(alerts.map(a => deleteAlert(a.id)));
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Alerts</h2>
          {unreadCount > 0 && (
            <p className="text-red-400 text-sm mt-1">{unreadCount} unread alert{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleMarkAllRead}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            Mark All as Read
          </button>
          <button
            onClick={handleDeleteAll}
            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            Delete All
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {alerts.length === 0 && (
          <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-400">
            No alerts at the moment.
          </div>
        )}
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`bg-gray-900 rounded-xl p-5 shadow-lg border ${alert.is_read ? 'border-gray-800' : 'border-red-500'} transition`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-400 font-semibold text-sm uppercase">{alert.type}</span>
                  {!alert.is_read && (
                    <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded">New</span>
                  )}
                </div>
                <p className="text-white">{alert.message}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {alert.drone_name && `Drone: ${alert.drone_name} · `}
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="bg-blue-900 hover:bg-blue-700 text-blue-300 px-3 py-1 rounded text-sm transition"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="bg-red-900 hover:bg-red-700 text-red-300 px-3 py-1 rounded text-sm transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;