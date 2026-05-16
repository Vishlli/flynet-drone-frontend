import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { getMissions, getDrones } from '../services/api';

const COLORS = ['#4ade80', '#60a5fa', '#facc15', '#f87171', '#a78bfa'];

const Analytics = () => {
  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, dRes] = await Promise.all([getMissions(), getDrones()]);
        setMissions(mRes.data);
        setDrones(dRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // mission status breakdown for pie chart
  const missionStatusData = [
    { name: 'Pending', value: missions.filter(m => m.status === 'pending').length },
    { name: 'In Progress', value: missions.filter(m => m.status === 'in-progress').length },
    { name: 'Completed', value: missions.filter(m => m.status === 'completed').length },
  ].filter(d => d.value > 0);

  // mission priority breakdown for bar chart
  const priorityData = [
    { priority: 'Low', count: missions.filter(m => m.priority === 'low').length },
    { priority: 'Medium', count: missions.filter(m => m.priority === 'medium').length },
    { priority: 'High', count: missions.filter(m => m.priority === 'high').length },
  ];

  // drone battery levels for bar chart
  const batteryData = drones.map(d => ({
    name: d.name,
    battery: parseInt(d.battery),
  }));

  // simulated flight hours per drone for line chart
  const flightHoursData = drones.map((d, i) => ({
    name: d.name,
    hours: Math.floor(Math.random() * 50) + 10,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Mission Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={missionStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {missionStatusData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Missions by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="priority" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="count" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Drone Battery Levels</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={batteryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="battery" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Simulated Flight Hours per Drone</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={flightHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#facc15" strokeWidth={2} dot={{ fill: '#facc15' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default Analytics;