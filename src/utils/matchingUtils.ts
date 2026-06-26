import { Candidate, Interviewer, MatchResult, TimeInterval, NoMatchResult } from '../types';
import { minutesToTime, getDayName } from './dateUtils';

interface SlotBlock {
  date: string;
  start_mins: number;
  end_mins: number;
  duration: number;
}

interface InterviewerWithBackups {
  name: string;
  assignedPanel: string[];
  allBackups: string[];
}

function subtractBookedIntervals(
  availability: TimeInterval[],
  bookedIntervals: TimeInterval[]
): TimeInterval[] {
  if (bookedIntervals.length === 0) return availability;

  let result: TimeInterval[] = [];

  for (const available of availability) {
    let current: TimeInterval[] = [available];

    for (const booked of bookedIntervals) {
      if (booked.date !== available.date) continue;

      const next: TimeInterval[] = [];

      for (const interval of current) {
        if (booked.end_mins <= interval.start_mins || booked.start_mins >= interval.end_mins) {
          next.push(interval);
        } else {
          if (booked.start_mins > interval.start_mins) {
            next.push({
              date: interval.date,
              start_mins: interval.start_mins,
              end_mins: booked.start_mins
            });
          }
          if (booked.end_mins < interval.end_mins) {
            next.push({
              date: interval.date,
              start_mins: booked.end_mins,
              end_mins: interval.end_mins
            });
          }
        }
      }

      current = next;
    }

    result = [...result, ...current];
  }

  return result;
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
  minDuration: number,
  bookedIntervals?: { [interviewerName: string]: TimeInterval[] }
): { matches: MatchResult[]; noMatch?: NoMatchResult } {
  // Check if candidate has any availability
  if (candidate.availability.length === 0) {
    return {
      matches: [],
      noMatch: { bestSingleInterviewer: undefined, minutesMissed: 0 }
    };
  }

  // Apply availability subtraction for booked slots
  const updatedInterviewers = interviewers.map(interviewer => {
    const booked = bookedIntervals?.[interviewer.name] || [];
    return {
      ...interviewer,
      availability: subtractBookedIntervals(interviewer.availability, booked)
    };
  });

  // Group blocks by date
  const allBlocks = generateCandidateBlocks(candidate, minDuration);
  const blocksByDate = new Map<string, SlotBlock[]>();

  for (const block of allBlocks) {
    if (!blocksByDate.has(block.date)) {
      blocksByDate.set(block.date, []);
    }
    blocksByDate.get(block.date)!.push(block);
  }

  // Process each day separately
  const allMatches: MatchResult[] = [];
  let bestSingleInterviewer: { interviewer: string; overlap: number; block: SlotBlock } | null = null;

  for (const [date, dayBlocks] of blocksByDate) {
    // Pre-sort interviewers once per day
    const sortedInterviewers = [...updatedInterviewers].sort((a, b) => {
      const aWindow = getInterviewerTotalWindow(a, date);
      const bWindow = getInterviewerTotalWindow(b, date);
      if (aWindow !== bWindow) return aWindow - bWindow;
      return a.name.localeCompare(b.name);
    });

    const perfectMatches: MatchResult[] = [];
    const overQualifiedMatches: MatchResult[] = [];
    const selectedPanelKeys = new Set<string>();

    for (const block of dayBlocks) {
      const assignedPanel: string[] = [];
      const allBackups: string[] = [];

      // Single loop through pre-sorted interviewers
      for (const interviewer of sortedInterviewers) {
        if (!isInterviewerAvailable(interviewer, block)) continue;

        if (assignedPanel.length < 2) {
          assignedPanel.push(interviewer.name);
        } else {
          allBackups.push(interviewer.name);
        }
      }

      if (assignedPanel.length === 0) {
        continue;
      }

      if (assignedPanel.length === 1) {
        const overlap = minDuration;
        if (!bestSingleInterviewer || overlap > bestSingleInterviewer.overlap) {
          bestSingleInterviewer = {
            interviewer: assignedPanel[0],
            overlap,
            block
          };
        }
        continue;
      }

      const panelKey = [...assignedPanel].sort().join('-');
      if (selectedPanelKeys.has(panelKey)) {
        continue;
      }
      selectedPanelKeys.add(panelKey);

      const displayBackups = allBackups.slice(0, 2);
      const dayStr = block.date.split('/').slice(0, 2).join('/');
      const dateObj = parseDateKey(block.date);
      const dayName = getDayName(dateObj);

      const match: MatchResult = {
        date: `${dayName} ${dayStr}`,
        startTime: minutesToTime(block.start_mins),
        endTime: minutesToTime(block.end_mins),
        duration: block.duration,
        assignedPanel,
        displayBackups,
        allBackups,
        status: assignedPanel.length === 2 && allBackups.length === 0 ? 'perfect' : 'over-qualified',
        outsideBusinessHours: isOutsideBusinessHours(block.start_mins, block.end_mins),
        reasoning:
          assignedPanel.length === 2 && allBackups.length === 0
            ? 'Perfect panel of 2 interviewers available.'
            : `Assigned ${assignedPanel.join(' & ')} (most constrained). ${displayBackups.length > 0 ? displayBackups.join(', ') + ' available as backup.' : 'No backups available.'}`
      };

      if (match.status === 'perfect') {
        perfectMatches.push(match);
        if (perfectMatches.length === 3) break;
      } else {
        overQualifiedMatches.push(match);
      }
    }

    const dayResults = [...perfectMatches, ...overQualifiedMatches].slice(0, 3);
    allMatches.push(...dayResults);

    if (allMatches.length >= 3) break;
  }

  const top3 = allMatches.slice(0, 3);

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

export function getInterviewerDayCommitments(
  interviewerName: string,
  date: string,
  committedSlots: Array<{ candidate: string; date: string; startTime: string; endTime: string; assignedPanel: string[]; displayBackups: string[] }>
): number {
  return committedSlots.filter(slot => {
    const slotDate = slot.date.split(' ')[1];
    return committedSlots.some(s => s.assignedPanel.includes(interviewerName) || s.displayBackups.includes(interviewerName)) &&
      slotDate.split('/').slice(0, 2).join('/') === date.split('/').slice(0, 2).join('/');
  }).length;
}
