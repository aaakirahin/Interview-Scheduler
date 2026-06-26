import { AlertCircle } from 'lucide-react';

interface ConflictModalProps {
  onResolution: (clearSlots: boolean) => void;
}

export function ConflictModal({ onResolution }: ConflictModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Existing Bookings Detected</h3>
            <p className="text-sm text-gray-600">
              You have existing committed slots. Uploading new interviewer data may affect availability calculations.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onResolution(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Keep Existing Slots
          </button>
          <button
            onClick={() => onResolution(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All Slots
          </button>
        </div>
      </div>
    </div>
  );
}
