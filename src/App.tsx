import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { Results } from './components/Results';
import {
  downloadCandidatesTemplate,
  downloadInterviewersTemplate,
  parseCandidatesFile,
  parseInterviewersFile
} from './utils/excelUtils';
import { findMatches, checkSkippedInterviewers } from './utils/matchingUtils';
import { Candidate, Interviewer, MatchResult, NoMatchResult } from './types';

function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [minDuration, setMinDuration] = useState<number>(30);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [noMatch, setNoMatch] = useState<NoMatchResult | undefined>();
  const [notification, setNotification] = useState<string>('');
  const [skippedInterviewers, setSkippedInterviewers] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleDownloadCandidatesTemplate = () => {
    downloadCandidatesTemplate();
  };

  const handleDownloadInterviewersTemplate = () => {
    downloadInterviewersTemplate();
  };

  const handleUploadCandidatesFile = async (file: File) => {
    try {
      const parsedCandidates = await parseCandidatesFile(file);
      setCandidates(parsedCandidates);
      setSelectedCandidate('');
      setMatches([]);
      setNoMatch(undefined);
      showNotification(`Loaded ${parsedCandidates.length} candidates`);
    } catch (error) {
      showNotification('Error parsing candidates file. Please check the format.');
      console.error(error);
    }
  };

  const handleUploadInterviewersFile = async (file: File) => {
    try {
      const parsedInterviewers = await parseInterviewersFile(file);
      setInterviewers(parsedInterviewers);
      setSelectedCandidate('');
      setMatches([]);
      setNoMatch(undefined);
      showNotification(`Loaded ${parsedInterviewers.length} interviewers`);

      const skipped = checkSkippedInterviewers(parsedInterviewers);
      setSkippedInterviewers(skipped);
    } catch (error) {
      showNotification('Error parsing interviewers file. Please check the format.');
      console.error(error);
    }
  };

  const handleCandidateChange = (candidateName: string) => {
    setSelectedCandidate(candidateName);
  };

  const handleDurationChange = (duration: number) => {
    setMinDuration(duration);
  };

  useEffect(() => {
    if (selectedCandidate && candidates.length > 0 && interviewers.length > 0) {
      const candidate = candidates.find(c => c.name === selectedCandidate);
      if (candidate) {
        const result = findMatches(candidate, interviewers, minDuration);
        setMatches(result.matches);
        setNoMatch(result.noMatch);
      }
    } else {
      setMatches([]);
      setNoMatch(undefined);
    }
  }, [selectedCandidate, minDuration, candidates, interviewers]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onDownloadCandidatesTemplate={handleDownloadCandidatesTemplate}
        onDownloadInterviewersTemplate={handleDownloadInterviewersTemplate}
        onUploadCandidatesFile={handleUploadCandidatesFile}
        onUploadInterviewersFile={handleUploadInterviewersFile}
      />

      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {notification}
        </div>
      )}

      {candidates.length > 0 && (
        <Controls
          candidates={candidates.map(c => c.name)}
          selectedCandidate={selectedCandidate}
          onCandidateChange={handleCandidateChange}
          minDuration={minDuration}
          onDurationChange={handleDurationChange}
        />
      )}

      <Results
        candidateName={selectedCandidate}
        matches={matches}
        noMatch={noMatch}
        skippedInterviewers={skippedInterviewers}
      />
    </div>
  );
}

export default App;
