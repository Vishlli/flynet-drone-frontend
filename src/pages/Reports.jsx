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

  const totalMissions = missions.length;
  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const inProgressMissions = missions.filter(m => m.status === 'in-progress').length;
  const pendingMissions = missions.filter(m => m.status === 'pending').length;
  const highPriorityMissions = missions.filter(m => m.priority === 'high').length;
  const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  const totalDrones = drones.length;
  const activeDrones = drones.filter(d => d.computed_status === 'active').length;
  const idleDrones = totalDrones - activeDrones;
  const avgBattery = totalDrones > 0
    ? Math.round(drones.reduce((sum, d) => sum + parseInt(d.battery), 0) / totalDrones)
    : 0;

  const totalAlerts = alerts.length;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const lowBatteryAlerts = alerts.filter(a => a.type === 'low-battery').length;

  const addHeader = (doc, title, subtitle) => {
    doc.setFillColor(22, 82, 48);
    doc.rect(0, 0, 220, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FLYNET TECHNOLOGIES', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Drone Fleet Management System', 14, 21);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Confidential`, 14, 28);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 44);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 51);
    doc.setDrawColor(22, 82, 48);
    doc.setLineWidth(0.8);
    doc.line(14, 54, 196, 54);
  };

  const addSectionTitle = (doc, text, y) => {
    doc.setFillColor(240, 248, 244);
    doc.rect(14, y - 5, 182, 9, 'F');
    doc.setTextColor(22, 82, 48);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(text, 16, y + 1);
    doc.setTextColor(0, 0, 0);
    return y + 10;
  };

  const addMetricRow = (doc, metrics, y) => {
    const boxW = 42;
    const boxH = 20;
    const gap = 4;
    metrics.forEach((m, i) => {
      const x = 14 + i * (boxW + gap);
      doc.setFillColor(248, 252, 250);
      doc.setDrawColor(200, 230, 210);
      doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(m.label, x + boxW / 2, y + 7, { align: 'center' });
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 82, 48);
      doc.text(String(m.value), x + boxW / 2, y + 15, { align: 'center' });
    });
    return y + boxH + 6;
  };

  const addFooter = (doc) => {
    const pageH = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, 196, pageH - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('Flynet Technologies — This document is confidential and intended for authorized personnel only.', 14, pageH - 8);
    doc.text(`Page 1`, 196, pageH - 8, { align: 'right' });
  };

  const exportMissionsPDF = () => {
    const doc = new jsPDF();
    addHeader(doc, 'Mission Operations Report', `Reporting Period: All Time   |   Total Records: ${totalMissions}`);

    let y = 62;
    y = addSectionTitle(doc, 'MISSION PERFORMANCE OVERVIEW', y);
    y = addMetricRow(doc, [
      { label: 'Total Missions', value: totalMissions },
      { label: 'Completed', value: completedMissions },
      { label: 'In Progress', value: inProgressMissions },
      { label: 'Pending Approval', value: pendingMissions },
    ], y);
    y = addMetricRow(doc, [
      { label: 'Completion Rate', value: `${completionRate}%` },
      { label: 'High Priority', value: highPriorityMissions },
      { label: 'Low Priority', value: missions.filter(m => m.priority === 'low').length },
      { label: 'Medium Priority', value: missions.filter(m => m.priority === 'medium').length },
    ], y);

    y += 4;
    y = addSectionTitle(doc, 'MISSION LOG — DETAILED RECORDS', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Mission Title', 'Assigned Drone', 'Created By', 'Priority', 'Status', 'Start Time', 'End Time', 'Target Location']],
      body: missions.map((m, i) => [
        i + 1,
        m.title,
        m.drone_name || 'Unassigned',
        m.assigned_by_name || 'N/A',
        m.priority.charAt(0).toUpperCase() + m.priority.slice(1),
        m.status.charAt(0).toUpperCase() + m.status.slice(1),
        m.start_time ? new Date(m.start_time).toLocaleString() : '—',
        m.end_time ? new Date(m.end_time).toLocaleString() : '—',
        m.location_lat && m.location_lng
          ? `${parseFloat(m.location_lat).toFixed(4)}°N, ${parseFloat(m.location_lng).toFixed(4)}°E`
          : '—'
      ]),
      styles: { fontSize: 7.5, cellPadding: 3 },
      headStyles: { fillColor: [22, 82, 48], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 250, 247] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 32 },
        4: { cellWidth: 18 },
        5: { cellWidth: 20 },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = data.cell.raw;
          if (val === 'Completed') data.cell.styles.textColor = [22, 82, 48];
          else if (val === 'In-progress') data.cell.styles.textColor = [37, 99, 235];
          else data.cell.styles.textColor = [180, 130, 0];
        }
        if (data.column.index === 4 && data.section === 'body') {
          const val = data.cell.raw;
          if (val === 'High') data.cell.styles.textColor = [200, 30, 30];
          else if (val === 'Medium') data.cell.styles.textColor = [180, 130, 0];
          else data.cell.styles.textColor = [22, 82, 48];
        }
      }
    });

    addFooter(doc);
    doc.save('flynet_mission_report.pdf');
  };

  const exportDronesPDF = () => {
    const doc = new jsPDF();
    addHeader(doc, 'Drone Fleet Registry Report', `Reporting Period: All Time   |   Fleet Size: ${totalDrones} Drones`);

    let y = 62;
    y = addSectionTitle(doc, 'FLEET HEALTH OVERVIEW', y);
    y = addMetricRow(doc, [
      { label: 'Total Drones', value: totalDrones },
      { label: 'Active (On Mission)', value: activeDrones },
      { label: 'Idle', value: idleDrones },
      { label: 'Avg Battery Level', value: `${avgBattery}%` },
    ], y);

    y += 4;
    y = addSectionTitle(doc, 'BATTERY STATUS SUMMARY', y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const critical = drones.filter(d => parseInt(d.battery) < 20).length;
    const low = drones.filter(d => parseInt(d.battery) >= 20 && parseInt(d.battery) < 50).length;
    const good = drones.filter(d => parseInt(d.battery) >= 50).length;
    doc.text(`Critical (<20%): ${critical} drone(s)   |   Low (20–49%): ${low} drone(s)   |   Good (≥50%): ${good} drone(s)`, 16, y);
    y += 10;

    y = addSectionTitle(doc, 'DRONE REGISTRY — DETAILED RECORDS', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Drone Name', 'Model', 'Status', 'Battery', 'Max Speed', 'Max Altitude', 'Payload Cap.', 'GPS Coordinates', 'Registered On']],
      body: drones.map((d, i) => [
        i + 1,
        d.name,
        d.model,
        (d.computed_status || d.status).charAt(0).toUpperCase() + (d.computed_status || d.status).slice(1),
        `${d.battery}%`,
        `${d.max_speed} km/h`,
        `${d.max_altitude} m`,
        `${d.payload_capacity} kg`,
        `${parseFloat(d.latitude).toFixed(4)}°N, ${parseFloat(d.longitude).toFixed(4)}°E`,
        new Date(d.created_at).toLocaleDateString()
      ]),
      styles: { fontSize: 7.5, cellPadding: 3 },
      headStyles: { fillColor: [22, 82, 48], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 250, 247] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 },
        4: { cellWidth: 16 },
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const val = parseInt(data.cell.raw);
          if (val < 20) data.cell.styles.textColor = [200, 30, 30];
          else if (val < 50) data.cell.styles.textColor = [180, 130, 0];
          else data.cell.styles.textColor = [22, 82, 48];
        }
      }
    });

    addFooter(doc);
    doc.save('flynet_drone_report.pdf');
  };

  const exportFullPDF = () => {
    const doc = new jsPDF();
    addHeader(doc, 'Flynet Fleet Operations — Full Report', `Comprehensive Overview   |   Generated: ${new Date().toLocaleDateString()}`);

    let y = 62;
    y = addSectionTitle(doc, 'EXECUTIVE SUMMARY', y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const summaryText = `The Flynet drone fleet currently operates ${totalDrones} registered drone(s) with an average battery level of ${avgBattery}%. Out of ${totalMissions} total missions, ${completedMissions} have been completed (${completionRate}% completion rate), ${inProgressMissions} are currently in progress, and ${pendingMissions} are awaiting admin approval. ${highPriorityMissions} high-priority mission(s) have been recorded. The alert system has logged ${totalAlerts} alert(s), of which ${unreadAlerts} remain unread.`;
    const lines = doc.splitTextToSize(summaryText, 180);
    doc.text(lines, 16, y);
    y += lines.length * 5 + 6;

    y = addSectionTitle(doc, 'MISSION METRICS', y);
    y = addMetricRow(doc, [
      { label: 'Total', value: totalMissions },
      { label: 'Completed', value: completedMissions },
      { label: 'In Progress', value: inProgressMissions },
      { label: 'Pending', value: pendingMissions },
    ], y);

    y = addSectionTitle(doc, 'FLEET METRICS', y);
    y = addMetricRow(doc, [
      { label: 'Total Drones', value: totalDrones },
      { label: 'Active', value: activeDrones },
      { label: 'Idle', value: idleDrones },
      { label: 'Avg Battery', value: `${avgBattery}%` },
    ], y);

    y = addSectionTitle(doc, 'ALERT METRICS', y);
    y = addMetricRow(doc, [
      { label: 'Total Alerts', value: totalAlerts },
      { label: 'Unread', value: unreadAlerts },
      { label: 'Low Battery', value: lowBatteryAlerts },
      { label: 'Read', value: totalAlerts - unreadAlerts },
    ], y);

    y += 4;
    y = addSectionTitle(doc, 'MISSION LOG', y);
    autoTable(doc, {
      startY: y,
      head: [['Title', 'Drone', 'Priority', 'Status', 'Start Time']],
      body: missions.map(m => [
        m.title,
        m.drone_name || 'Unassigned',
        m.priority.charAt(0).toUpperCase() + m.priority.slice(1),
        m.status.charAt(0).toUpperCase() + m.status.slice(1),
        m.start_time ? new Date(m.start_time).toLocaleString() : '—'
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [22, 82, 48], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 250, 247] },
    });

    addFooter(doc);
    doc.save('flynet_full_report.pdf');
  };

  const exportMissionsCSV = () => {
    const csv = Papa.unparse(missions.map(m => ({
      ID: m.id, Title: m.title, Description: m.description || 'N/A',
      Drone: m.drone_name || 'Unassigned', AssignedBy: m.assigned_by_name || 'N/A',
      Priority: m.priority, Status: m.status,
      StartTime: m.start_time ? new Date(m.start_time).toLocaleString() : 'N/A',
      EndTime: m.end_time ? new Date(m.end_time).toLocaleString() : 'N/A',
      Latitude: m.location_lat || 'N/A', Longitude: m.location_lng || 'N/A',
      CreatedAt: new Date(m.created_at).toLocaleString()
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flynet_missions.csv';
    a.click();
  };

  const exportDronesCSV = () => {
    const csv = Papa.unparse(drones.map(d => ({
      ID: d.id, Name: d.name, Model: d.model,
      Status: d.computed_status || d.status, Battery: `${d.battery}%`,
      MaxSpeed: `${d.max_speed} km/h`, MaxAltitude: `${d.max_altitude}m`,
      PayloadCapacity: `${d.payload_capacity}kg`,
      Latitude: parseFloat(d.latitude).toFixed(6), Longitude: parseFloat(d.longitude).toFixed(6),
      RegisteredAt: new Date(d.created_at).toLocaleString()
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flynet_drones.csv';
    a.click();
  };

  const exportAlertsCSV = () => {
    const csv = Papa.unparse(alerts.map(a => ({
      ID: a.id, Type: a.type, Message: a.message,
      Drone: a.drone_name || 'N/A', Read: a.is_read ? 'Yes' : 'No',
      CreatedAt: new Date(a.created_at).toLocaleString()
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flynet_alerts.csv';
    a.click();
  };

  const StatBox = ({ label, value, color }) => (
    <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${color}`}>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );

  const ReportCard = ({ title, description, stats, exports }) => (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map((s, i) => <StatBox key={i} label={s.label} value={s.value} color={s.color || 'border-green-500'} />)}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {exports.map((e, i) => (
          <button key={i} onClick={e.fn}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${e.color}`}>
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Reports</h2>
      <p className="text-gray-400 text-sm mb-6">Generate and export professional PDF reports or raw CSV data.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReportCard
          title="Mission Operations Report"
          description="Detailed mission log with priorities, statuses, assignments, timings, and coordinates."
          stats={[
            { label: 'Total Missions', value: totalMissions, color: 'border-blue-500' },
            { label: 'Completion Rate', value: `${completionRate}%`, color: 'border-green-500' },
            { label: 'In Progress', value: inProgressMissions, color: 'border-yellow-500' },
            { label: 'High Priority', value: highPriorityMissions, color: 'border-red-500' },
          ]}
          exports={[
            { label: '↓ Export PDF', fn: exportMissionsPDF, color: 'bg-green-600 hover:bg-green-700' },
            { label: '↓ Export CSV', fn: exportMissionsCSV, color: 'bg-blue-600 hover:bg-blue-700' },
          ]}
        />
        <ReportCard
          title="Drone Fleet Registry Report"
          description="Complete drone specs, battery levels, GPS positions, statuses, and registration dates."
          stats={[
            { label: 'Total Drones', value: totalDrones, color: 'border-blue-500' },
            { label: 'Active (On Mission)', value: activeDrones, color: 'border-green-500' },
            { label: 'Idle', value: idleDrones, color: 'border-gray-500' },
            { label: 'Avg Battery', value: `${avgBattery}%`, color: avgBattery < 30 ? 'border-red-500' : 'border-yellow-500' },
          ]}
          exports={[
            { label: '↓ Export PDF', fn: exportDronesPDF, color: 'bg-green-600 hover:bg-green-700' },
            { label: '↓ Export CSV', fn: exportDronesCSV, color: 'bg-blue-600 hover:bg-blue-700' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard
          title="Full Fleet Operations Report"
          description="Comprehensive single-document report covering executive summary, all metrics, and mission log."
          stats={[
            { label: 'Total Records', value: totalMissions + totalDrones + totalAlerts, color: 'border-purple-500' },
            { label: 'Unread Alerts', value: unreadAlerts, color: 'border-red-500' },
            { label: 'Low Battery Alerts', value: lowBatteryAlerts, color: 'border-yellow-500' },
            { label: 'Report Coverage', value: 'All Time', color: 'border-green-500' },
          ]}
          exports={[
            { label: '↓ Export Full PDF', fn: exportFullPDF, color: 'bg-purple-600 hover:bg-purple-700' },
          ]}
        />
        <ReportCard
          title="Alerts Log"
          description="Complete alert history with drone names, types, read status, and timestamps."
          stats={[
            { label: 'Total Alerts', value: totalAlerts, color: 'border-blue-500' },
            { label: 'Unread', value: unreadAlerts, color: 'border-red-500' },
            { label: 'Low Battery', value: lowBatteryAlerts, color: 'border-yellow-500' },
            { label: 'Acknowledged', value: totalAlerts - unreadAlerts, color: 'border-green-500' },
          ]}
          exports={[
            { label: '↓ Export CSV', fn: exportAlertsCSV, color: 'bg-blue-600 hover:bg-blue-700' },
          ]}
        />
      </div>
    </div>
  );
};

export default Reports;