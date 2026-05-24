import { Candidate, Interviewer, MatchResult, TimeInterval, NoMatchResult } from '../types';
import { minutesToTime, getDayName } from './dateUtils';

interface SlotBlock {
  date: string;
  start_mins: number;
  end_mins: number;
  duration: number;
}

function generateCandidateBlocks(candidate: Candidate, minDuration: number): SlotBlock[] {
  const blocks: SlotBlock[] = [];

  for (const interval of candidate.availability) {
    let currentStart = interval.start_mins;

    while (currentStart + minDuration <= interval.end_mins) {
      blocks.push({
        date: interval.date,
        start_mins: currentStart,
        end_mins: currentStart + minDuration,
        duration: minDuration
      });
      currentStart += minDuration;
    }
  }

  return blocks;
}

function isInterviewerAvailable(interviewer: Interviewer, block: SlotBlock): boolean {
  return interviewer.availability.some(interval =>
    interval.date === block.date &&
    interval.start_mins <= block.start_mins &&
    interval.end_mins >= block.end_mins
  );
}

function getInterviewerTotalWindow(interviewer: Interviewer, date: string): number {
  const dayIntervals = interviewer.availability.filter(i => i.date === date);
  return dayIntervals.reduce((sum, interval) => sum + (interval.end_mins - interval.start_mins), 0);
}

function isOutsideBusinessHours(startMins: number, endMins: number): boolean {
  const businessStart = 9 * 60;
  const businessEnd = 18 * 60;
  return startMins < businessStart || endMins > businessEnd;
}

function parseDateKey(dateKey: string): Date {
  const [day, month, year] = dateKey.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function findMatches(
  candidate: Candidate,
  interviewers: Interviewer[],
  minDuration: number
): { matches: MatchResult[]; noMatch?: NoMatchResult } {
  const blocks = generateCandidateBlocks(candidate, minDuration);
  const validMatches: MatchResult[] = [];
  let bestSingleInterviewer: { interviewer: string; overlap: number; block: SlotBlock } | null = null;

  for (const block of blocks) {
    const availableInterviewers = interviewers.filter(interviewer =>
      isInterviewerAvailable(interviewer, block)
    );

    if (availableInterviewers.length === 0) {
      continue;
    }

    if (availableInterviewers.length === 1) {
      const overlap = minDuration;
      if (!bestSingleInterviewer || overlap > bestSingleInterviewer.overlap) {
        bestSingleInterviewer = {
          interviewer: availableInterviewers[0].name,
          overlap,
          block
        };
      }
      continue;
    }

    let assignedPanel: string[];
    let backups: string[] = [];
    let status: 'perfect' | 'over-qualified';
    let reasoning: string;

    if (availableInterviewers.length === 2) {
      assignedPanel = availableInterviewers.map(i => i.name);
      status = 'perfect';
      reasoning = 'Perfect panel of 2 interviewers available.';
    } else {
      const sorted = [...availableInterviewers].sort((a, b) => {
        const aWindow = getInterviewerTotalWindow(a, block.date);
        const bWindow = getInterviewerTotalWindow(b, block.date);
        return aWindow - bWindow;
      });

      assignedPanel = [sorted[0].name, sorted[1].name];
      backups = sorted.slice(2).map(i => i.name);
      status = 'over-qualified';
      reasoning = `Assigned ${assignedPanel[0]} & ${assignedPanel[1]} (most constrained). ${backups.join(', ')} available as backup.`;
    }

    const date = parseDateKey(block.date);
    const dayName = getDayName(date);
    const dateStr = block.date.split('/').slice(0, 2).join('/');

    validMatches.push({
      date: `${dayName} ${dateStr}`,
      startTime: minutesToTime(block.start_mins),
      endTime: minutesToTime(block.end_mins),
      duration: block.duration,
      assignedPanel,
      backups,
      status,
      outsideBusinessHours: isOutsideBusinessHours(block.start_mins, block.end_mins),
      reasoning
    });
  }

  validMatches.sort((a, b) => {
    const dateA = parseDateKey(a.date.split(' ')[1] + '/' + new Date().getFullYear());
    const dateB = parseDateKey(b.date.split(' ')[1] + '/' + new Date().getFullYear());
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.startTime.localeCompare(b.startTime);
  });

  const top3 = validMatches.slice(0, 3);

  if (top3.length === 0 && bestSingleInterviewer) {
    return {
      matches: [],
      noMatch: {
        bestSingleInterviewer: bestSingleInterviewer.interviewer,
        minutesMissed: minDuration
      }
    };
  }

  return { matches: top3 };
}

export function checkSkippedInterviewers(interviewers: Interviewer[]): string[] {
  return interviewers
    .filter(interviewer => interviewer.availability.length === 0)
    .map(interviewer => interviewer.name);
}
