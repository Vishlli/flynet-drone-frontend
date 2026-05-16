import React, { useEffect, useState } from 'react';
import { getMissions, getDrones, getAlerts } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

const Reports = () => {
  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, dRes, aRes] = await Promise.all([getMissions(), getDrones(), getAlerts()]);
        setMissions(mRes.data);
        setDrones(dRes.data);
        setAlerts(aRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const exportMissionsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Flynet Drone System — Mission Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      head: [['ID', 'Title', 'Drone', 'Priority', 'Status', 'Start Time']],
      body: missions.map(m => [
        m.id,
        m.title,
        m.drone_name || 'Unassigned',
        m.priority,
        m.status,
        m.start_time ? new Date(m.start_time).toLocaleString() : 'N/A'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] }
    });
    doc.save('flynet_mission_report.pdf');
  };

  const exportDronesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Flynet Drone System — Drone Registry Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      head: [['ID', 'Name', 'Model', 'Status', 'Battery', 'Max Speed', 'Max Altitude']],
      body: drones.map(d => [
        d.id,
        d.name,
        d.model,
        d.status,
        `${d.battery}%`,
        `${d.max_speed} km/h`,
        `${d.max_altitude}m`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] }
    });
    doc.save('flynet_drone_report.pdf');
  };

  const exportMissionsCSV = () => {
    const csv = Papa.unparse(missions.map(m => ({
      ID: m.id,
      Title: m.title,
      Drone: m.drone_name || 'Unassigned',
      Priority: m.priority,
      Status: m.status,
      StartTime: m.start_time ? new Date(m.start_time).toLocaleString() : 'N/A',
      EndTime: m.end_time ? new Date(m.end_time).toLocaleString() : 'N/A'
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flynet_missions.csv';
    a.click();
  };

  const exportDronesCSV = () => {
    const csv = Papa.unparse(drones.map(d => ({
      ID: d.id,
      Name: d.name,
      Model: d.model,
      Status: d.status,
      Battery: `${d.battery}%`,
      MaxSpeed: `${d.max_speed} km/h`,
      MaxAltitude: `${d.max_altitude}m`,
      PayloadCapacity: `${d.payload_capacity}kg`
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flynet_drones.csv';
    a.click();
  };

  const exportAlertsCSV = () => {
    const csv = Papa.unparse(alerts.map(a => ({
      ID: a.id,
      Type: a.type,
      Message: a.message,
      Drone: a.drone_name || 'N/A',
      Read: a.is_read ? 'Yes' : 'No',
      CreatedAt: new Date(a.created_at).toLocaleString()
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flynet_alerts.csv';
    a.click();
  };

  const ReportCard = ({ title, description, onPDF, onCSV }) => (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="flex gap-3">
        {onPDF && (
          <button
            onClick={onPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            Export PDF
          </button>
        )}
        {onCSV && (
          <button
            onClick={onCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            Export CSV
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="Mission Report"
          description={`${missions.length} missions on record. Export full mission log with status and assignments.`}
          onPDF={exportMissionsPDF}
          onCSV={exportMissionsCSV}
        />
        <ReportCard
          title="Drone Registry Report"
          description={`${drones.length} drones registered. Export full drone specs and current status.`}
          onPDF={exportDronesPDF}
          onCSV={exportDronesCSV}
        />
        <ReportCard
          title="Alerts Log"
          description={`${alerts.length} alerts recorded. Export full alert history.`}
          onCSV={exportAlertsCSV}
        />
      </div>
    </div>
  );
};

export default Reports;