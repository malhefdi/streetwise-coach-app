// Student-related type definitions

export interface Student {
  id: string;
  name: string;
  rank: string;
  sessions: number;
  notes?: string;
  avatar?: string;
  planId?: string; // Reference to their current plan
  createdAt: string;
  updatedAt: string;
  progress?: Record<string, number>; // Legacy - keep for backward compatibility
  feedback?: { date: string; message: string; tag?: string }[];
}

