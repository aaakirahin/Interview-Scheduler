import { Download, Upload } from 'lucide-react';

interface HeaderProps {
  onDownloadCandidatesTemplate: () => void;
  onDownloadInterviewersTemplate: () => void;
  onUploadCandidatesFile: (file: File) => void;
  onUploadInterviewersFile: (file: File) => void;
}

export function Header({
  onDownloadCandidatesTemplate,
  onDownloadInterviewersTemplate,
  onUploadCandidatesFile,
  onUploadInterviewersFile
}: HeaderProps) {
  const handleCandidatesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCandidatesFile(file);
      e.target.value = '';
    }
  };

  const handleInterviewersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadInterviewersFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Interview Scheduler</h1>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Candidates</h2>
            <button
              onClick={onDownloadCandidatesTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
            >
              <Download size={18} />
              Download Candidates Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer w-fit">
              <Upload size={18} />
              Upload Candidates
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleCandidatesFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Interviewers</h2>
            <button
              onClick={onDownloadInterviewersTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
            >
              <Download size={18} />
              Download Interviewers Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer w-fit">
              <Upload size={18} />
              Upload Interviewers
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInterviewersFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
