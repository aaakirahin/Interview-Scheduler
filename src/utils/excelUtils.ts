import { getCurrentWeekDates, formatDateKey, timeToMinutes } from './dateUtils';
import { Candidate, Interviewer, TimeInterval } from '../types';

declare const XLSX: any;

export function downloadCandidatesTemplate() {
  const weekDates = getCurrentWeekDates();

  const candidatesData = [
    ['Name', ...weekDates.map(d => `${d.day} ${d.date}`)],
    ['Aryan', '09:00-14:00', '14:00-17:00', '09:00-12:00', 'NA', 'NA', 'NA', 'NA'],
    ['Neha', '11:00-13:00', '10:00-12:00', 'NA', '14:00-17:00', 'NA', 'NA', 'NA'],
    ['Karan', 'NA', 'NA', '10:00-16:00', 'NA', '09:00-11:00', 'NA', 'NA'],
    ['Priya Sharma', '10:00-17:00', 'NA', '13:00-15:00', '09:00-12:00', 'NA', 'NA', 'NA'],
    ['Vikram Patel', '09:00-11:00', '09:00-17:00', 'NA', 'NA', '14:00-17:00', 'NA', 'NA'],
    ['Anjali Singh', 'NA', '13:00-17:00', '10:00-14:00', '11:00-16:00', 'NA', 'NA', '10:00-12:00'],
    ['Rohan Kumar', '14:00-17:00', 'NA', 'NA', '09:00-13:00', '10:00-16:00', '09:00-12:00', 'NA'],
    ['Meera Desai', '09:00-12:00', '11:00-14:00', '14:00-17:00', 'NA', 'NA', '13:00-17:00', 'NA'],
    ['Arjun Nair', 'NA', 'NA', '09:00-11:00', '14:00-17:00', '11:00-15:00', 'NA', '14:00-16:00'],
    ['Divya Chopra', '11:00-16:00', '10:00-13:00', 'NA', 'NA', '09:00-14:00', 'NA', 'NA'],
    ['Sanjay Verma', 'NA', '14:00-17:00', '11:00-13:00', '10:00-16:00', 'NA', 'NA', '10:00-14:00']
  ];

  const ws = XLSX.utils.aoa_to_sheet(candidatesData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
  XLSX.writeFile(wb, 'candidates_template.xlsx');
}

export function downloadInterviewersTemplate() {
  const weekDates = getCurrentWeekDates();

  const interviewersData = [
    ['Name', ...weekDates.map(d => `${d.day} ${d.date}`)],
    ['Priya', '10:00-13:00', '15:00-18:00', 'NA', 'NA', 'NA', 'NA', 'NA'],
    ['Rahul', '11:00-13:00', 'NA', '11:00-15:00', 'NA', 'NA', 'NA', 'NA'],
    ['Sara', '11:00-16:00', '14:00-17:00', 'NA', 'NA', 'NA', 'NA', 'NA'],
    ['James', 'NA', '15:00-18:00', '08:00-10:00', 'NA', 'NA', 'NA', 'NA'],
    ['Sophia Chen', '09:00-12:00', '09:00-12:00', '14:00-17:00', '10:00-13:00', '09:00-12:00', 'NA', 'NA'],
    ['Michael Torres', '13:00-17:00', 'NA', '09:00-12:00', '13:00-17:00', '14:00-17:00', '10:00-14:00', 'NA'],
    ['Emma Johnson', '09:00-17:00', 'NA', 'NA', '09:00-17:00', 'NA', '13:00-17:00', '10:00-16:00'],
    ['David Singh', 'NA', '10:00-17:00', '10:00-17:00', 'NA', '09:00-17:00', 'NA', 'NA'],
    ['Lisa Wong', '10:00-14:00', '11:00-15:00', '10:00-14:00', '11:00-15:00', 'NA', '09:00-13:00', '14:00-17:00'],
    ['Marcus Brown', 'NA', '09:00-13:00', '14:00-17:00', '09:00-13:00', '14:00-17:00', '10:00-17:00', 'NA'],
    ['Olivia Garcia', '11:00-17:00', '14:00-17:00', 'NA', '14:00-17:00', '10:00-17:00', 'NA', '09:00-12:00'],
    ['Nathan Kim', '09:00-12:00', '13:00-17:00', '09:00-12:00', 'NA', 'NA', '14:00-17:00', '10:00-17:00'],
    ['Zara Ahmed', '14:00-17:00', '09:00-13:00', '13:00-17:00', '10:00-14:00', 'NA', 'NA', '11:00-17:00']
  ];

  const ws = XLSX.utils.aoa_to_sheet(interviewersData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Interviewers');
  XLSX.writeFile(wb, 'interviewers_template.xlsx');
}

function parseTimeSlots(slotStr: string, date: Date): TimeInterval[] {
  if (!slotStr || slotStr.trim().toUpperCase() === 'NA') {
    return [];
  }

  const intervals: TimeInterval[] = [];
  const slots = slotStr.split(',').map(s => s.trim());

  for (const slot of slots) {
    const match = slot.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
    if (match) {
      const [, start, end] = match;
      intervals.push({
        date: formatDateKey(date),
        start_mins: timeToMinutes(start),
        end_mins: timeToMinutes(end)
      });
    }
  }

  return intervals;
}

function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a.start_mins - b.start_mins);
  const merged: TimeInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.date === last.date && current.start_mins <= last.end_mins) {
      last.end_mins = Math.max(last.end_mins, current.end_mins);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function parsePeopleFromSheet(data: any[][]): any[] {
  const people = [];
  const weekDates = getCurrentWeekDates();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const name = row[0];
    const intervals: TimeInterval[] = [];

    for (let j = 1; j < row.length && j <= 7; j++) {
      const slotStr = row[j];
      const dateInfo = weekDates[j - 1];
      if (dateInfo) {
        const dayIntervals = parseTimeSlots(slotStr, dateInfo.fullDate);
        intervals.push(...dayIntervals);
      }
    }

    people.push({
      name,
      availability: mergeIntervals(intervals)
    });
  }

  return people;
}

export function parseCandidatesFile(file: File): Promise<Candidate[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) {
          reject(new Error('No data sheet found'));
          return;
        }

        const sheetData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const candidates = parsePeopleFromSheet(sheetData);
        resolve(candidates);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseInterviewersFile(file: File): Promise<Interviewer[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) {
          reject(new Error('No data sheet found'));
          return;
        }

        const sheetData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const interviewers = parsePeopleFromSheet(sheetData);
        resolve(interviewers);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
