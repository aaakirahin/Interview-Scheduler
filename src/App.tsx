import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { Results } from './components/Results';
import { ScheduledInterviews } from './components/ScheduledInterviews';
import { ConflictModal } from './components/ConflictModal';
import {
  downloadCandidatesTemplate,
  downloadInterviewersTemplate,
  parseCandidatesFile,
  parseInterviewersFile
} from './utils/excelUtils';
import { findMatches, checkSkippedInterviewers } from './utils/matchingUtils';
import { Candidate, Interviewer, MatchResult, NoMatchResult, CommittedSlot, TimeInterval } from './types';

function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [minDuration, setMinDuration] = useState<number>(30);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [noMatch, setNoMatch] = useState<NoMatchResult | undefined>();
  const [notification, setNotification] = useState<string>('');
  const [skippedInterviewers, setSkippedInterviewers] = useState<string[]>([]);
  const [committedSlots, setCommittedSlots] = useState<CommittedSlot[]>([]);
  const [bookedIntervals, setBookedIntervals] = useState<{ [interviewerName: string]: TimeInterval[] }>({});
  const [reserveBackups, setReserveBackups] = useState<boolean>(false);
  const [showScheduled, setShowScheduled] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [assignedSlotForCandidate, setAssignedSlotForCandidate] = useState<string>('');

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedSlots = localStorage.getItem('committedSlots');
    const savedBooked = localStorage.getItem('bookedIntervals');
    if (savedSlots) setCommittedSlots(JSON.parse(savedSlots));
    if (savedBooked) setBookedIntervals(JSON.parse(savedBooked));
  }, []);

  // Save to localStorage whenever slots change
  useEffect(() => {
    localStorage.setItem('committedSlots', JSON.stringify(committedSlots));
    localStorage.setItem('bookedIntervals', JSON.stringify(bookedIntervals));
  }, [committedSlots, bookedIntervals]);

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

      // Check for conflicts with existing bookings
      if (committedSlots.length > 0) {
        setShowConflictModal(true);
        // Store the new interviewers temporarily
        sessionStorage.setItem('pendingInterviewers', JSON.stringify(parsedInterviewers));
        return;
      }

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

  const handleConflictResolution = (clearSlots: boolean) => {
    const pendingInterviewers = JSON.parse(sessionStorage.getItem('pendingInterviewers') || '[]');
    sessionStorage.removeItem('pendingInterviewers');

    if (clearSlots) {
      setCommittedSlots([]);
      setBookedIntervals({});
    }

    setInterviewers(pendingInterviewers);
    setSelectedCandidate('');
    setMatches([]);
    setNoMatch(undefined);
    showNotification(`Loaded ${pendingInterviewers.length} interviewers`);

    const skipped = checkSkippedInterviewers(pendingInterviewers);
    setSkippedInterviewers(skipped);
    setShowConflictModal(false);
  };

  const handleCandidateChange = (candidateName: string) => {
    setSelectedCandidate(candidateName);
    setAssignedSlotForCandidate(committedSlots.find(s => s.candidate === candidateName)?.startTime || '');
  };

  const handleDurationChange = (duration: number) => {
    setMinDuration(duration);
  };

  const handleAssignSlot = (match: MatchResult) => {
    const newSlot: CommittedSlot = {
      candidate: selectedCandidate,
      date: match.date,
      startTime: match.startTime,
      endTime: match.endTime,
      assignedPanel: match.assignedPanel,
      displayBackups: match.displayBackups
    };

    // Parse time to minutes for interval storage
    const [startHour, startMin] = match.startTime.split(':').map(Number);
    const [endHour, endMin] = match.endTime.split(':').map(Number);
    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;
    const dateKey = match.date.split(' ')[1] + '/' + new Date().getFullYear();

    const newBookedIntervals = { ...bookedIntervals };

    // Add panel members
    for (const interviewer of match.assignedPanel) {
      if (!newBookedIntervals[interviewer]) {
        newBookedIntervals[interviewer] = [];
      }
      newBookedIntervals[interviewer].push({
        date: dateKey,
        start_mins: startMins,
        end_mins: endMins
      });
    }

    // Add backups if reserve toggle is ON
    if (reserveBackups) {
      for (const backup of match.displayBackups) {
        if (!newBookedIntervals[backup]) {
          newBookedIntervals[backup] = [];
        }
        newBookedIntervals[backup].push({
          date: dateKey,
          start_mins: startMins,
          end_mins: endMins
        });
      }
    }

    setCommittedSlots([...committedSlots, newSlot]);
    setBookedIntervals(newBookedIntervals);
    setAssignedSlotForCandidate(match.startTime);
    showNotification(`Interview scheduled for ${selectedCandidate}`);
  };

  const handleUnassignSlot = (slot: CommittedSlot) => {
    const updatedSlots = committedSlots.filter(s => !(s.candidate === slot.candidate && s.startTime === slot.startTime));
    setCommittedSlots(updatedSlots);

    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;
    const dateKey = slot.date.split(' ')[1] + '/' + new Date().getFullYear();

    const newBookedIntervals = { ...bookedIntervals };

    // Remove panel and backup intervals
    for (const interviewer of [...slot.assignedPanel, ...slot.displayBackups]) {
      if (newBookedIntervals[interviewer]) {
        newBookedIntervals[interviewer] = newBookedIntervals[interviewer].filter(
          interval => !(interval.date === dateKey && interval.start_mins === startMins && interval.end_mins === endMins)
        );
        if (newBookedIntervals[interviewer].length === 0) {
          delete newBookedIntervals[interviewer];
        }
      }
    }

    setBookedIntervals(newBookedIntervals);
    if (slot.candidate === selectedCandidate) {
      setAssignedSlotForCandidate('');
    }
    showNotification(`Unassigned interview for ${slot.candidate}`);
  };

  useEffect(() => {
    if (selectedCandidate && candidates.length > 0 && interviewers.length > 0) {
      const candidate = candidates.find(c => c.name === selectedCandidate);
      if (candidate) {
        if (candidate.availability.length === 0) {
          setMatches([]);
          setNoMatch({ bestSingleInterviewer: undefined, minutesMissed: 0 });
        } else if (interviewers.length < 2) {
          setMatches([]);
          setNoMatch({ bestSingleInterviewer: undefined, minutesMissed: 0 });
        } else {
          const result = findMatches(candidate, interviewers, minDuration, bookedIntervals);
          setMatches(result.matches);
          setNoMatch(result.noMatch);
        }
      }
    } else {
      setMatches([]);
      setNoMatch(undefined);
    }
  }, [selectedCandidate, minDuration, candidates, interviewers, bookedIntervals]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onDownloadCandidatesTemplate={handleDownloadCandidatesTemplate}
        onDownloadInterviewersTemplate={handleDownloadInterviewersTemplate}
        onUploadCandidatesFile={handleUploadCandidatesFile}
        onUploadInterviewersFile={handleUploadInterviewersFile}
        onShowScheduled={() => setShowScheduled(!showScheduled)}
        committedSlotsCount={committedSlots.length}
      />

      {showConflictModal && (
        <ConflictModal onResolution={handleConflictResolution} />
      )}

      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {notification}
        </div>
      )}

      {showScheduled ? (
        <ScheduledInterviews slots={committedSlots} onUnassign={handleUnassignSlot} />
      ) : (
        <>
          {candidates.length > 0 && (
            <Controls
              candidates={candidates.map(c => c.name)}
              selectedCandidate={selectedCandidate}
              onCandidateChange={handleCandidateChange}
              minDuration={minDuration}
              onDurationChange={handleDurationChange}
              reserveBackups={reserveBackups}
              onReserveBackupsChange={setReserveBackups}
            />
          )}

          <Results
            candidateName={selectedCandidate}
            matches={matches}
            noMatch={noMatch}
            skippedInterviewers={skippedInterviewers}
            onAssign={handleAssignSlot}
            isAssigned={!!assignedSlotForCandidate}
            interviewers={interviewers}
            committedSlots={committedSlots}
            candidates={candidates}
            hasFewerThan2Interviewers={interviewers.length < 2}
          />
        </>
      )}
    </div>
  );
}

export default App;
