import { MatchResult, NoMatchResult } from '../types';
import { Clock, Users, AlertCircle } from 'lucide-react';

interface ResultsProps {
  candidateName: string;
  matches: MatchResult[];
  noMatch?: NoMatchResult;
  skippedInterviewers: string[];
}

export function Results({ candidateName, matches, noMatch, skippedInterviewers }: ResultsProps) {
  if (!candidateName) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg">Select a candidate to see available interview slots</p>
        </div>
      </div>
    );
  }

  const rankLabels = ['Best', '2nd', '3rd'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Top Interview Slots — {candidateName}
      </h2>

      {skippedInterviewers.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-yellow-800">
            {skippedInterviewers.length} interviewer{skippedInterviewers.length > 1 ? 's' : ''} had no availability and
            {skippedInterviewers.length > 1 ? ' were' : ' was'} skipped: {skippedInterviewers.join(', ')}
          </p>
        </div>
      )}

      {matches.length > 0 ? (
        <div className="grid gap-6">
          {matches.map((match, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {rankLabels[index]}
                  </span>
                  {match.status === 'perfect' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Perfect panel
                    </span>
                  )}
                  {match.status === 'over-qualified' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      Panel from over-availability
                    </span>
                  )}
                  {match.outsideBusinessHours && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Outside business hours
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-1">
                  <Clock size={20} className="text-gray-500" />
                  {match.date}, {match.startTime} – {match.endTime}
                </div>
                <p className="text-sm text-gray-600 ml-7">Duration: {match.duration} minutes</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Assigned Panel:</p>
                <div className="flex gap-2 flex-wrap">
                  {match.assignedPanel.map((interviewer) => (
                    <span
                      key={interviewer}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {interviewer}
                    </span>
                  ))}
                </div>
              </div>

              {match.backups.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Backup Interviewers:</p>
                  <div className="flex gap-2 flex-wrap">
                    {match.backups.map((interviewer) => (
                      <span
                        key={interviewer}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                      >
                        {interviewer}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">{match.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      ) : noMatch ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                No valid panel slots found for {candidateName}
              </h3>
              <p className="text-sm text-red-800 mb-4">
                Please request updated availability.
              </p>
              {noMatch.bestSingleInterviewer && (
                <div className="bg-white rounded p-4 border border-red-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Best single-interviewer overlap found:</span> {noMatch.bestSingleInterviewer}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Missed a valid panel by requiring one more interviewer for the full {noMatch.minutesMissed}-minute duration.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No matches found for this candidate</p>
        </div>
      )}
    </div>
  );
}
