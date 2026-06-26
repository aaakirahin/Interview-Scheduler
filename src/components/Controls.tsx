interface ControlsProps {
  candidates: string[];
  selectedCandidate: string;
  onCandidateChange: (candidate: string) => void;
  minDuration: number;
  onDurationChange: (duration: number) => void;
  reserveBackups: boolean;
  onReserveBackupsChange: (value: boolean) => void;
}

export function Controls({
  candidates,
  selectedCandidate,
  onCandidateChange,
  minDuration,
  onDurationChange,
  reserveBackups,
  onReserveBackupsChange
}: ControlsProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Candidate
            </label>
            <select
              value={selectedCandidate}
              onChange={(e) => onCandidateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a candidate --</option>
              {candidates.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Duration
            </label>
            <select
              value={minDuration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
              <option value={90}>90 mins</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <input
              type="checkbox"
              id="reserve-backups"
              checked={reserveBackups}
              onChange={(e) => onReserveBackupsChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="reserve-backups" className="text-sm font-medium text-gray-700 cursor-pointer">
              Also reserve backups
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
