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
  const [reportType, setReportType] = useState('');
  const [reportText, setReportText] = useState('');

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

  const missionStatusData = [
    { name: 'Pending', value: missions.filter(m => m.status === 'pending').length },
    { name: 'In Progress', value: missions.filter(m => m.status === 'in-progress').length },
    { name: 'Completed', value: missions.filter(m => m.status === 'completed').length },
  ].filter(d => d.value > 0);

  const priorityData = [
    { priority: 'Low', count: missions.filter(m => m.priority === 'low').length },
    { priority: 'Medium', count: missions.filter(m => m.priority === 'medium').length },
    { priority: 'High', count: missions.filter(m => m.priority === 'high').length },
  ];

  const batteryData = drones.map(d => ({
    name: d.name,
    battery: parseInt(d.battery),
  }));

  const flightHoursData = drones.map(d => ({
    name: d.name,
    hours: Math.floor(Math.random() * 50) + 10,
  }));

  const generateReport = () => {
    const totalMissions = missions.length;
    const completed = missions.filter(m => m.status === 'completed').length;
    const inProgress = missions.filter(m => m.status === 'in-progress').length;
    const pending = missions.filter(m => m.status === 'pending').length;
    const highPriority = missions.filter(m => m.priority === 'high').length;
    const totalDrones = drones.length;
    const activeDrones = drones.filter(d => d.computed_status === 'active').length;
    const avgBattery = drones.length > 0
      ? Math.round(drones.reduce((sum, d) => sum + parseInt(d.battery), 0) / drones.length)
      : 0;

    if (reportType === 'executive') {
      setReportText(`EXECUTIVE SUMMARY — FLYNET DRONE FLEET
Date: ${new Date().toLocaleDateString()}

Fleet Status: ${totalDrones} drones registered, ${activeDrones} currently active. Average battery level across the fleet is ${avgBattery}%.

Mission Performance: ${totalMissions} total missions on record. ${completed} missions completed (${totalMissions > 0 ? Math.round((completed / totalMissions) * 100) : 0}% completion rate), ${inProgress} currently in progress, and ${pending} awaiting approval.

Priority Distribution: ${highPriority} high-priority missions have been logged, indicating ${highPriority > totalMissions / 2 ? 'a high-intensity operational period requiring close monitoring.' : 'a balanced operational workload.'}

Recommendation: ${avgBattery < 50 ? 'Battery levels are below optimal. Schedule charging cycles before deploying additional missions.' : 'Fleet battery levels are healthy. Operations can proceed at full capacity.'} ${pending > 3 ? 'There are several pending missions awaiting admin approval — review and approve to maintain operational momentum.' : 'Mission approval pipeline is clear.'}`);
    }

    if (reportType === 'operational') {
      setReportText(`OPERATIONAL REPORT — FLYNET DRONE FLEET
Date: ${new Date().toLocaleDateString()}

DRONE INVENTORY
Total Registered: ${totalDrones}
Active: ${activeDrones}
Idle: ${totalDrones - activeDrones}
Average Battery: ${avgBattery}%
${drones.map(d => `- ${d.name} (${d.model}): Battery ${d.battery}%, Status ${d.computed_status || d.status}, Max Speed ${d.max_speed} km/h, Max Altitude ${d.max_altitude}m`).join('\n')}

MISSION STATUS BREAKDOWN
Total Missions: ${totalMissions}
Completed: ${completed}
In Progress: ${inProgress}
Pending Approval: ${pending}
High Priority: ${highPriority}

OPERATIONAL NOTES
${inProgress > 0 ? `${inProgress} mission(s) are currently active. Ensure drone operators are monitoring telemetry in real time.` : 'No missions are currently in progress.'}
${pending > 0 ? `${pending} mission(s) are awaiting admin approval. Delay in approval may impact operational timelines.` : 'All submitted missions have been reviewed.'}
${avgBattery < 30 ? 'CRITICAL: Average battery level is critically low. Ground all non-essential operations immediately.' : avgBattery < 60 ? 'WARNING: Battery levels are moderate. Plan charging schedules before next mission cycle.' : 'Battery levels are sufficient for continued operations.'}`);
    }

    if (reportType === 'recommendation') {
      setReportText(`STRATEGIC RECOMMENDATIONS — FLYNET DRONE FLEET
Date: ${new Date().toLocaleDateString()}

FLEET HEALTH ASSESSMENT
Current fleet size of ${totalDrones} drone(s) with an average battery of ${avgBattery}% is ${totalDrones < 3 ? 'relatively small for sustained multi-mission operations. Consider registering additional drones to improve redundancy.' : 'adequate for current operational demands.'}

MISSION PIPELINE RECOMMENDATIONS
${pending > 2 ? '1. Priority Action: Multiple missions are pending approval. Admin should review and approve or reject them promptly to avoid operational backlogs.' : '1. Mission pipeline is healthy with no significant backlog.'}
${highPriority > 0 ? `2. ${highPriority} high-priority mission(s) detected. Assign your highest-capacity drones (maximum speed and altitude) to these missions first.` : '2. No high-priority missions currently. Use this period for maintenance and charging.'}
${completed > 0 ? `3. ${completed} mission(s) completed successfully. Export the mission report for record-keeping and performance review.` : '3. No missions completed yet. Begin by creating and approving initial missions to establish baseline performance metrics.'}

DRONE USAGE RECOMMENDATIONS
${drones.filter(d => parseInt(d.battery) < 30).map(d => `- ${d.name} battery is at ${d.battery}% — recharge before next deployment.`).join('\n') || '- All drones are at acceptable battery levels.'}
${activeDrones === 0 && totalDrones > 0 ? '- No drones are currently active. Approve pending missions to begin active operations.' : ''}

NEXT STEPS
1. Review and approve all pending missions
2. Monitor live telemetry on the Dashboard for active drones
3. Export operational reports weekly for performance tracking
4. Add more drones to the registry to scale fleet capacity`);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Generate Fleet Report</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { key: 'executive', label: 'Executive Summary' },
            { key: 'operational', label: 'Operational Report' },
            { key: 'recommendation', label: 'Strategic Recommendations' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setReportType(key)}
              className={`px-4 py-2 rounded-lg text-sm transition font-semibold ${
                reportType === key
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={generateReport}
          disabled={!reportType}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg text-sm transition mb-4"
        >
          Generate Report
        </button>
        {reportText && (
          <div className="bg-gray-800 rounded-lg p-4 mt-2">
            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">{reportText}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;