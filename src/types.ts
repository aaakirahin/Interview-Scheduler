export interface TimeInterval {
  date: string;
  start_mins: number;
  end_mins: number;
}

export interface Person {
  name: string;
  availability: TimeInterval[];
}

export interface Candidate extends Person {}

export interface Interviewer extends Person {}

export interface MatchResult {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  assignedPanel: string[];
  displayBackups: string[];
  allBackups: string[];
  status: 'perfect' | 'over-qualified';
  outsideBusinessHours: boolean;
  reasoning: string;
}

export interface NoMatchResult {
  bestSingleInterviewer?: string;
  minutesMissed?: number;
}

export interface CommittedSlot {
  candidate: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedPanel: string[];
  displayBackups: string[];
}
