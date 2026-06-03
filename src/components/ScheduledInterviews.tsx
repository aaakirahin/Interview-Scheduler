import { Download, Trash2 } from 'lucide-react';
import { CommittedSlot } from '../types';

declare const XLSX: any;

interface ScheduledInterviewsProps {
  slots: CommittedSlot[];
  onUnassign: (slot: CommittedSlot) => void;
}

export function ScheduledInterviews({ slots, onUnassign }: ScheduledInterviewsProps) {
  const handleExportToExcel = () => {
    const data = [
      ['Candidate', 'Date', 'Time', 'Panel', 'Backups'],
      ...slots.map(slot => [
        slot.candidate,
        slot.date,
        `${slot.startTime} – ${slot.endTime}`,
        slot.assignedPanel.join(', '),
        slot.displayBackups.join(', ') || '—'
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scheduled Interviews');
    XLSX.writeFile(wb, 'scheduled_interviews.xlsx');
  };

  if (slots.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Scheduled Interviews</h2>
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg">No interviews scheduled yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Scheduled Interviews</h2>
        <button
          onClick={handleExportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          Export to Excel
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Candidate</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Panel</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Backups</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{slot.candidate}</td>
                <td className="px-6 py-3 text-sm text-gray-900">{slot.date}</td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {slot.startTime} – {slot.endTime}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">{slot.assignedPanel.join(', ')}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{slot.displayBackups.join(', ') || '—'}</td>
                <td className="px-6 py-3 text-sm">
                  <button
                    onClick={() => onUnassign(slot)}
                    className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                    Unassign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
