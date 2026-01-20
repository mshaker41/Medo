import { v4 as uuidv4 } from 'uuid';
import { ConstraintSettings, Layout, Student } from '../types';

export const sampleStudents: Student[] = [
  { id: uuidv4(), name: 'Ahmed Ali', gender: 'M', level: 2, behavior: 3, sen: false, eal: true, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: 'Prefers quiet tasks.', tags: ['football'] },
  { id: uuidv4(), name: 'Sara Mahmoud', gender: 'F', level: 4, behavior: 2, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: ['leader'] },
  { id: uuidv4(), name: 'Omar Said', gender: 'M', level: 1, behavior: 5, sen: true, eal: false, needsFront: true, language: 'Arabic', conflicts: [], friends: [], notes: 'Needs support.', tags: ['SEN'] },
  { id: uuidv4(), name: 'Lina Hassan', gender: 'F', level: 3, behavior: 3, sen: false, eal: true, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Khaled Youssef', gender: 'M', level: 5, behavior: 1, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: ['math'] },
  { id: uuidv4(), name: 'Mona Adel', gender: 'F', level: 2, behavior: 4, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: ['talkative'] },
  { id: uuidv4(), name: 'Tarek Nabil', gender: 'M', level: 3, behavior: 2, sen: false, eal: true, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Aya Farid', gender: 'F', level: 1, behavior: 3, sen: false, eal: false, needsFront: true, language: 'Arabic', conflicts: [], friends: [], notes: 'Vision needs front.', tags: ['vision'] },
  { id: uuidv4(), name: 'Hassan Fathi', gender: 'M', level: 4, behavior: 2, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Noor Samy', gender: 'F', level: 5, behavior: 1, sen: false, eal: false, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: ['mentor'] },
  { id: uuidv4(), name: 'Youssef Hany', gender: 'M', level: 2, behavior: 4, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: ['talkative'] },
  { id: uuidv4(), name: 'Salma Omar', gender: 'F', level: 3, behavior: 2, sen: false, eal: true, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Mahmoud Azmy', gender: 'M', level: 1, behavior: 5, sen: true, eal: false, needsFront: true, language: 'Arabic', conflicts: [], friends: [], notes: 'Needs calm neighbor.', tags: ['SEN'] },
  { id: uuidv4(), name: 'Dina Kamel', gender: 'F', level: 4, behavior: 2, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Karim Gabr', gender: 'M', level: 3, behavior: 3, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Nadia Ashraf', gender: 'F', level: 2, behavior: 4, sen: false, eal: true, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Rami Salah', gender: 'M', level: 5, behavior: 1, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Eman Mostafa', gender: 'F', level: 1, behavior: 3, sen: false, eal: false, needsFront: true, language: 'Arabic', conflicts: [], friends: [], notes: 'Needs front.', tags: [] },
  { id: uuidv4(), name: 'Ali Nasser', gender: 'M', level: 3, behavior: 2, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Hala Emad', gender: 'F', level: 4, behavior: 2, sen: false, eal: true, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Mostafa Eid', gender: 'M', level: 2, behavior: 4, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: ['talkative'] },
  { id: uuidv4(), name: 'Rana Nabil', gender: 'F', level: 3, behavior: 2, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Bilal Rashed', gender: 'M', level: 1, behavior: 5, sen: true, eal: false, needsFront: true, language: 'Arabic', conflicts: [], friends: [], notes: 'High support.', tags: ['SEN'] },
  { id: uuidv4(), name: 'Yara Nabil', gender: 'F', level: 5, behavior: 1, sen: false, eal: false, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Hesham Yasin', gender: 'M', level: 4, behavior: 2, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Mariam Zaki', gender: 'F', level: 2, behavior: 3, sen: false, eal: true, needsFront: false, language: 'English', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Samir Fouad', gender: 'M', level: 3, behavior: 3, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Laila Ragab', gender: 'F', level: 1, behavior: 4, sen: false, eal: false, needsFront: true, language: 'Arabic', conflicts: [], friends: [], notes: 'Needs support seat.', tags: [] },
  { id: uuidv4(), name: 'Adel Farouk', gender: 'M', level: 5, behavior: 1, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] },
  { id: uuidv4(), name: 'Salma Zayed', gender: 'F', level: 4, behavior: 2, sen: false, eal: false, needsFront: false, language: 'Arabic', conflicts: [], friends: [], notes: '', tags: [] }
];

export const sampleLayout: Layout = {
  rows: 6,
  cols: 6,
  seats: Array.from({ length: 36 }).map((_, index) => {
    const row = Math.floor(index / 6);
    const col = index % 6;
    return {
      id: `seat-${row}-${col}`,
      row,
      col,
      type: row === 0 ? 'front' : 'normal'
    };
  }),
  boardPosition: { row: 0, col: 2 },
  teacherDesk: { row: 0, col: 3 },
  aisles: []
};

export const sampleLayouts: Layout[] = [
  sampleLayout,
  {
    rows: 5,
    cols: 7,
    seats: Array.from({ length: 35 }).map((_, index) => {
      const row = Math.floor(index / 7);
      const col = index % 7;
      return {
        id: `seat-alt-${row}-${col}`,
        row,
        col,
        type: row === 0 ? 'front' : 'normal'
      };
    }),
    boardPosition: { row: 0, col: 3 },
    teacherDesk: { row: 0, col: 5 },
    aisles: [{ row: 2, col: 3 }]
  },
  {
    rows: 4,
    cols: 8,
    seats: Array.from({ length: 32 }).map((_, index) => {
      const row = Math.floor(index / 8);
      const col = index % 8;
      return {
        id: `seat-wide-${row}-${col}`,
        row,
        col,
        type: row === 0 ? 'front' : 'normal'
      };
    }),
    boardPosition: { row: 0, col: 4 },
    teacherDesk: { row: 0, col: 6 },
    aisles: [{ row: 1, col: 2 }, { row: 2, col: 5 }]
  }
];

export const defaultConstraints: ConstraintSettings = {
  enforceConflicts: true,
  encourageFriends: true,
  alternateGender: false,
  spreadWeak: true,
  spreadBehavior: true,
  avoidTalkative: true,
  frontForSupport: true,
  weights: {
    friends: 4,
    gender: 2,
    weakSpread: 3,
    behaviorSpread: 3,
    talkative: 3,
    frontSupport: 4
  }
};
