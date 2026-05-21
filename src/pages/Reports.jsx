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

  const addPDFHeader = (doc, title) => {
    doc.setFillColor(26, 107, 60);
    doc.rect(0, 0, 220, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FLYNET TECHNOLOGIES', 14, 11);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Drone Fleet Management System', 14, 18);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 38);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 45);
    doc.setDrawColor(26, 107, 60);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);
  };

  const exportMissionsPDF = () => {
    const doc = new jsPDF();
    addPDFHeader(doc, 'Mission Report');

    const completed = missions.filter(m => m.status === 'completed').length;
    const inProgress = missions.filter(m => m.status === 'in-progress').length;
    const pending = missions.filter(m => m.status === 'pending').length;
    const high = missions.filter(m => m.priority === 'high').length;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Missions: ${missions.length}   Completed: ${completed}   In Progress: ${inProgress}   Pending: ${pending}   High Priority: ${high}`, 14, 63);

    autoTable(doc, {
      startY: 68,
      head: [['ID', 'Title', 'Drone', 'Assigned By', 'Priority', 'Status', 'Start Time', 'End Time', 'Location']],
      body: missions.map(m => [
        m.id,
        m.title,
        m.drone_name || 'Unassigned',
        m.assigned_by_name || 'N/A',
        m.priority.toUpperCase(),
        m.status.toUpperCase(),
        m.start_time ? new Date(m.start_time).toLocaleString() : 'N/A',
        m.end_time ? new Date(m.end_time).toLocaleString() : 'N/A',
        m.location_lat && m.location_lng ? `${parseFloat(m.location_lat).toFixed(4)}, ${parseFloat(m.location_lng).toFixed(4)}` : 'N/A'
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 107, 60], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 250, 247] },
      columnStyles: { 1: { cellWidth: 30 } }
    });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Flynet Technologies — Confidential', 14, doc.internal.pageSize.height - 10);
    doc.save('flynet_mission_report.pdf');
  };

  const exportDronesPDF = () => {
    const doc = new jsPDF();
    addPDFHeader(doc, 'Drone Registry Report');

    const active = drones.filter(d => d.computed_status === 'active').length;
    const avgBattery = drones.length > 0
      ? Math.round(drones.reduce((sum, d) => sum + parseInt(d.battery), 0) / drones.length)
      : 0;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fleet Summary', 14, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Drones: ${drones.length}   Active: ${active}   Idle: ${drones.length - active}   Average Battery: ${avgBattery}%`, 14, 63);

    autoTable(doc, {
      startY: 68,
      head: [['ID', 'Name', 'Model', 'Status', 'Battery', 'Max Speed', 'Max Altitude', 'Payload', 'Lat', 'Lng', 'Registered']],
      body: drones.map(d => [
        d.id,
        d.name,
        d.model,
        (d.computed_status || d.status).toUpperCase(),
        `${d.battery}%`,
        `${d.max_speed} km/h`,
        `${d.max_altitude}m`,
        `${d.payload_capacity}kg`,
        parseFloat(d.latitude).toFixed(4),
        parseFloat(d.longitude).toFixed(4),
        new Date(d.created_at).toLocaleDateString()
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [26, 107, 60], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 250, 247] }
    });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Flynet Technologies — Confidential', 14, doc.internal.pageSize.height - 10);
    doc.save('flynet_drone_report.pdf');
  };

  const exportMissionsCSV = () => {
    const csv = Papa.unparse(missions.map(m => ({
      ID: m.id,
      Title: m.title,
      Description: m.description || 'N/A',
      Drone: m.drone_name || 'Unassigned',
      AssignedBy: m.assigned_by_name || 'N/A',
      Priority: m.priority,
      Status: m.status,
      StartTime: m.start_time ? new Date(m.start_time).toLocaleString() : 'N/A',
      EndTime: m.end_time ? new Date(m.end_time).toLocaleString() : 'N/A',
      Latitude: m.location_lat || 'N/A',
      Longitude: m.location_lng || 'N/A',
      CreatedAt: new Date(m.created_at).toLocaleString()
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
      Status: d.computed_status || d.status,
      Battery: `${d.battery}%`,
      MaxSpeed: `${d.max_speed} km/h`,
      MaxAltitude: `${d.max_altitude}m`,
      PayloadCapacity: `${d.payload_capacity}kg`,
      Latitude: parseFloat(d.latitude).toFixed(6),
      Longitude: parseFloat(d.longitude).toFixed(6),
      RegisteredAt: new Date(d.created_at).toLocaleString()
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

  const ReportCard = ({ title, description, stats, onPDF, onCSV }) => (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-3">{description}</p>
      {stats && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="text-gray-500 text-xs">{s.label}</p>
              <p className="text-white font-semibold text-sm">{s.value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        {onPDF && (
          <button onClick={onPDF} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
            Export PDF
          </button>
        )}
        {onCSV && (
          <button onClick={onCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
            Export CSV
          </button>
        )}
      </div>
    </div>
  );

  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const activeDrones = drones.filter(d => d.computed_status === 'active').length;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="Mission Report"
          description="Full mission log with assignments, priority, status, timing, and coordinates."
          stats={[
            { label: 'Total Missions', value: missions.length },
            { label: 'Completed', value: completedMissions },
            { label: 'In Progress', value: missions.filter(m => m.status === 'in-progress').length },
            { label: 'Pending', value: missions.filter(m => m.status === 'pending').length },
          ]}
          onPDF={exportMissionsPDF}
          onCSV={exportMissionsCSV}
        />
        <ReportCard
          title="Drone Registry Report"
          description="Full drone specs, status, battery, GPS coordinates, and registration details."
          stats={[
            { label: 'Total Drones', value: drones.length },
            { label: 'Active', value: activeDrones },
            { label: 'Idle', value: drones.length - activeDrones },
            { label: 'Avg Battery', value: drones.length > 0 ? `${Math.round(drones.reduce((s, d) => s + parseInt(d.battery), 0) / drones.length)}%` : 'N/A' },
          ]}
          onPDF={exportDronesPDF}
          onCSV={exportDronesCSV}
        />
        <ReportCard
          title="Alerts Log"
          description="Complete alert history including type, drone, read status, and timestamp."
          stats={[
            { label: 'Total Alerts', value: alerts.length },
            { label: 'Unread', value: unreadAlerts },
            { label: 'Read', value: alerts.length - unreadAlerts },
            { label: 'Low Battery Alerts', value: alerts.filter(a => a.type === 'low-battery').length },
          ]}
          onCSV={exportAlertsCSV}
        />
      </div>
    </div>
  );
};

export default Reports;