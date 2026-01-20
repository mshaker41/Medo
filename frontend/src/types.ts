export type Gender = 'M' | 'F' | 'Other';
export type Level = 1 | 2 | 3 | 4 | 5;
export type Behavior = 1 | 2 | 3 | 4 | 5;

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  level: Level;
  behavior: Behavior;
  sen: boolean;
  eal: boolean;
  needsFront: boolean;
  language: 'Arabic' | 'English';
  conflicts: string[];
  friends: string[];
  notes: string;
  tags: string[];
}

export type SeatType = 'normal' | 'front' | 'wheelchair' | 'exam';

export interface Seat {
  id: string;
  row: number;
  col: number;
  type: SeatType;
}

export interface Layout {
  rows: number;
  cols: number;
  seats: Seat[];
  boardPosition: { row: number; col: number };
  teacherDesk: { row: number; col: number };
  aisles: { row: number; col: number }[];
}

export interface ConstraintSettings {
  enforceConflicts: boolean;
  encourageFriends: boolean;
  alternateGender: boolean;
  spreadWeak: boolean;
  spreadBehavior: boolean;
  avoidTalkative: boolean;
  frontForSupport: boolean;
  weights: {
    friends: number;
    gender: number;
    weakSpread: number;
    behaviorSpread: number;
    talkative: number;
    frontSupport: number;
  };
}

export type Mode = 'lesson' | 'exam' | 'support' | 'random';

export interface Plan {
  id: string;
  score: number;
  seats: Record<string, string | null>;
  explanation: string[];
  warnings: string[];
}
