
export type CandidateStatus = 'clean' | 'review';

export interface Candidate {
  id: number;
  name: string;
  position: string;
  experienceYears: number;
  salary: number | null;
  confirmedCriteria: number;
  totalCriteria: number;
  status: CandidateStatus;
  skills: string[];
  notes: string[];
  summary: string;
}
