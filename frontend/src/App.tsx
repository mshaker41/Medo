import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
  ConstraintSettings,
  Layout,
  Mode,
  Plan,
  Seat,
  SeatType,
  Student
} from './types';
import { defaultConstraints, sampleLayout, sampleLayouts, sampleStudents } from './data/sampleData';

const STORAGE_KEY = 'medo-seating-plan-data-v1';
const modes: { value: Mode; label: string; description: string }[] = [
  { value: 'lesson', label: 'Lesson mode', description: 'Collaborative seating with friend boosts.' },
  { value: 'exam', label: 'Exam mode', description: 'Max separation and reduced adjacency.' },
  { value: 'support', label: 'Support mode', description: 'Closer to teacher/front for support needs.' },
  { value: 'random', label: 'Random but fair', description: 'Balanced randomness with fairness.' }
];

const languageStrings = {
  en: {
    title: 'AI Seating Plan Generator',
    subtitle: 'Fast, printable, and balanced classroom layouts',
    students: 'Students',
    layout: 'Layout',
    constraints: 'Constraints',
    generate: 'Generate',
    editor: 'Editor',
    addStudent: 'Add Student',
    pasteList: 'Paste list (one per line)',
    uploadCsv: 'Upload CSV/Excel',
    generatePlans: 'Generate Plans',
    regenerate: 'Regenerate (5 alternatives)',
    explanation: 'AI Explanation',
    warnings: 'Warnings',
    export: 'Export',
    savePlan: 'Save Plan',
    search: 'Search student',
    lockSeat: 'Lock seat',
    unlockSeat: 'Unlock seat'
  },
  ar: {
    title: 'مولّد مخطط الجلوس بالذكاء الاصطناعي',
    subtitle: 'سريع، قابل للطباعة، ومتوازن',
    students: 'الطلاب',
    layout: 'شكل الفصل',
    constraints: 'القيود',
    generate: 'توليد',
    editor: 'المحرر',
    addStudent: 'إضافة طالب',
    pasteList: 'لصق القائمة (اسم في كل سطر)',
    uploadCsv: 'رفع CSV/Excel',
    generatePlans: 'توليد المخططات',
    regenerate: 'إعادة توليد (5 بدائل)',
    explanation: 'تفسير الذكاء الاصطناعي',
    warnings: 'تحذيرات',
    export: 'تصدير',
    savePlan: 'حفظ المخطط',
    search: 'بحث عن طالب',
    lockSeat: 'قفل المقعد',
    unlockSeat: 'فتح المقعد'
  }
};

const defaultLayout = sampleLayout;

interface SavedPlan {
  id: string;
  name: string;
  createdAt: string;
  plan: Plan;
}

function createEmptyLayout(rows: number, cols: number): Layout {
  return {
    rows,
    cols,
    seats: Array.from({ length: rows * cols }).map((_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        id: `seat-${row}-${col}`,
        row,
        col,
        type: row === 0 ? 'front' : 'normal'
      };
    }),
    boardPosition: { row: 0, col: Math.max(0, Math.floor(cols / 2) - 1) },
    teacherDesk: { row: 0, col: Math.max(0, Math.floor(cols / 2)) },
    aisles: []
  };
}

function loadStoredData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStoredData(data: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const seatTypeLabels: Record<SeatType, string> = {
  normal: 'Normal',
  front: 'Front-row',
  wheelchair: 'Wheelchair',
  exam: 'Exam'
};

const behaviorLabel = (value: number) => {
  if (value <= 2) return 'Calm';
  if (value === 3) return 'Balanced';
  if (value === 4) return 'Talkative';
  return 'High risk';
};

const levelLabel = (value: number) => {
  if (value <= 2) return 'Weak';
  if (value === 3) return 'Average';
  return 'Advanced';
};

function App() {
  const [activeTab, setActiveTab] = useState<'students' | 'layout' | 'constraints' | 'generate' | 'editor'>('students');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [layout, setLayout] = useState<Layout>(defaultLayout);
  const [constraints, setConstraints] = useState<ConstraintSettings>(defaultConstraints);
  const [mode, setMode] = useState<Mode>('lesson');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});
  const [seatSelection, setSeatSelection] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, string | null>[]>([]);
  const [future, setFuture] = useState<Record<string, string | null>[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [colorMode, setColorMode] = useState<'level' | 'behavior' | 'gender'>('level');
  const [notesStudentId, setNotesStudentId] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState('');
  const [className, setClassName] = useState('4A - Week 3');

  const strings = languageStrings[language];

  useEffect(() => {
    const stored = loadStoredData();
    if (stored) {
      setStudents(stored.students ?? sampleStudents);
      setLayout(stored.layout ?? defaultLayout);
      setConstraints(stored.constraints ?? defaultConstraints);
      setMode(stored.mode ?? 'lesson');
      setPlans(stored.plans ?? []);
      setSelectedPlanId(stored.selectedPlanId ?? null);
      setLockedSeats(stored.lockedSeats ?? {});
      setSavedPlans(stored.savedPlans ?? []);
      setLanguage(stored.language ?? 'en');
      setClassName(stored.className ?? '4A - Week 3');
    }
  }, []);

  useEffect(() => {
    saveStoredData({
      students,
      layout,
      constraints,
      mode,
      plans,
      selectedPlanId,
      lockedSeats,
      savedPlans,
      language,
      className
    });
  }, [students, layout, constraints, mode, plans, selectedPlanId, lockedSeats, savedPlans, language, className]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  const seatByPosition = useMemo(() => {
    return layout.seats.reduce<Record<string, Seat>>((acc, seat) => {
      acc[`${seat.row}-${seat.col}`] = seat;
      return acc;
    }, {});
  }, [layout.seats]);

  const studentById = useMemo(() => {
    return students.reduce<Record<string, Student>>((acc, student) => {
      acc[student.id] = student;
      return acc;
    }, {});
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const search = studentSearch.toLowerCase();
    return students.filter((student) => student.name.toLowerCase().includes(search));
  }, [students, studentSearch]);

  const handleAddStudent = () => {
    if (!manualEntry.trim()) return;
    const names = manualEntry
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const newStudents = names.map((name) => ({
      id: uuidv4(),
      name,
      gender: 'Other',
      level: 3,
      behavior: 3,
      sen: false,
      eal: false,
      needsFront: false,
      language: 'Arabic',
      conflicts: [],
      friends: [],
      notes: '',
      tags: []
    }));
    setStudents((prev) => [...prev, ...newStudents]);
    setManualEntry('');
  };

  const handleCSVUpload = async (file: File) => {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(Boolean);
    const parsed = rows.map((row) => row.split(',')[0]?.trim()).filter(Boolean);
    const newStudents = parsed.map((name) => ({
      id: uuidv4(),
      name,
      gender: 'Other',
      level: 3,
      behavior: 3,
      sen: false,
      eal: false,
      needsFront: false,
      language: 'Arabic',
      conflicts: [],
      friends: [],
      notes: '',
      tags: []
    }));
    setStudents((prev) => [...prev, ...newStudents]);
  };

  const handleStudentChange = (id: string, patch: Partial<Student>) => {
    setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, ...patch } : student)));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((student) => student.id !== id));
  };

  const handleLayoutPreset = (layout: Layout) => {
    setLayout(layout);
  };

  const updateSeatType = (seatId: string, type: SeatType) => {
    setLayout((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) => (seat.id === seatId ? { ...seat, type } : seat))
    }));
  };

  const handleGeneratePlans = async () => {
    try {
      const response = await fetch('http://localhost:3001/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students,
          layout,
          constraints,
          mode,
          lockedSeats
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert(errorText || 'Failed to generate plans.');
        return;
      }
      const data = await response.json();
      setPlans(data.plans);
      setSelectedPlanId(data.plans[0]?.id ?? null);
      setHistory([]);
      setFuture([]);
      setActiveTab('editor');
    } catch (error) {
      console.error(error);
      alert('Unable to reach the AI engine. Please start the backend server.');
    }
  };

  const handleSeatSwap = (seatId: string) => {
    if (!selectedPlan) return;
    if (lockedSeats[seatId]) return;
    if (!seatSelection) {
      setSeatSelection(seatId);
      return;
    }
    if (seatSelection === seatId) {
      setSeatSelection(null);
      return;
    }
    if (lockedSeats[seatSelection]) {
      setSeatSelection(null);
      return;
    }
    const updatedSeats = { ...selectedPlan.seats };
    const temp = updatedSeats[seatSelection] ?? null;
    updatedSeats[seatSelection] = updatedSeats[seatId] ?? null;
    updatedSeats[seatId] = temp;
    const updatedPlan: Plan = { ...selectedPlan, seats: updatedSeats };
    setPlans((prev) => prev.map((plan) => (plan.id === selectedPlan.id ? updatedPlan : plan)));
    setSelectedPlanId(updatedPlan.id);
    setHistory((prev) => [...prev, selectedPlan.seats]);
    setFuture([]);
    setSeatSelection(null);
  };

  const handleUndo = () => {
    if (!selectedPlan || history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [selectedPlan.seats, ...prev]);
    const updatedPlan: Plan = { ...selectedPlan, seats: previous };
    setPlans((prev) => prev.map((plan) => (plan.id === selectedPlan.id ? updatedPlan : plan)));
  };

  const handleRedo = () => {
    if (!selectedPlan || future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, selectedPlan.seats]);
    const updatedPlan: Plan = { ...selectedPlan, seats: next };
    setPlans((prev) => prev.map((plan) => (plan.id === selectedPlan.id ? updatedPlan : plan)));
  };

  const handleLockSeat = (seatId: string, studentId: string | null) => {
    setLockedSeats((prev) => {
      const updated = { ...prev };
      if (studentId) {
        updated[seatId] = studentId;
      } else {
        delete updated[seatId];
      }
      return updated;
    });
  };

  const handleSavePlan = () => {
    if (!selectedPlan) return;
    const name = prompt('Plan name', `${className} - ${new Date().toLocaleDateString()}`);
    if (!name) return;
    setSavedPlans((prev) => [
      ...prev,
      { id: uuidv4(), name, createdAt: new Date().toISOString(), plan: selectedPlan }
    ]);
  };

  const handleExportPNG = async () => {
    const element = document.getElementById('seat-grid');
    if (!element) return;
    const dataUrl = await toPng(element, { backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${className}-seating-plan.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleExportPDF = async (format: 'a4' | 'a3') => {
    const element = document.getElementById('seat-grid');
    if (!element) return;
    const dataUrl = await toPng(element, { backgroundColor: '#ffffff' });
    const pdf = new jsPDF({ orientation: 'landscape', format });
    pdf.setFontSize(14);
    pdf.text(className, 10, 10);
    pdf.addImage(dataUrl, 'PNG', 10, 20, 260, 150);
    pdf.save(`${className}-${format}.pdf`);
  };

  const handleExportExcel = () => {
    if (!selectedPlan) return;
    const grid: string[][] = [];
    for (let row = 0; row < layout.rows; row += 1) {
      const rowData: string[] = [];
      for (let col = 0; col < layout.cols; col += 1) {
        const seatId = seatByPosition[`${row}-${col}`]?.id;
        if (!seatId) {
          rowData.push('');
          continue;
        }
        const studentId = selectedPlan.seats[seatId];
        rowData.push(studentId ? studentById[studentId]?.name ?? '' : '');
      }
      grid.push(rowData);
    }
    const worksheet = XLSX.utils.aoa_to_sheet(grid);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seating');
    XLSX.writeFile(workbook, `${className}.xlsx`);
  };

  const handlePrint = () => {
    const element = document.getElementById('seat-grid');
    if (!element) return;
    const printWindow = window.open('', 'PRINT', 'height=600,width=800');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>${className}</title>`);
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;margin:16px;} .grid{display:grid;gap:8px;} .seat{border:1px solid #333;padding:8px;border-radius:6px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h2>${className}</h2>`);
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const seatColor = (student?: Student) => {
    if (!student) return 'seat empty';
    if (colorMode === 'gender') return `seat gender-${student.gender}`;
    if (colorMode === 'behavior') return `seat behavior-${student.behavior}`;
    return `seat level-${student.level}`;
  };

  return (
    <div className={clsx('app', language === 'ar' && 'rtl')}>
      <header className="app-header">
        <div>
          <h1>{strings.title}</h1>
          <p>{strings.subtitle}</p>
        </div>
        <div className="header-actions">
          <select value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'ar')}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          <input
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            placeholder="Class name"
          />
        </div>
      </header>

      <nav className="tabs">
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
          {strings.students}
        </button>
        <button className={activeTab === 'layout' ? 'active' : ''} onClick={() => setActiveTab('layout')}>
          {strings.layout}
        </button>
        <button className={activeTab === 'constraints' ? 'active' : ''} onClick={() => setActiveTab('constraints')}>
          {strings.constraints}
        </button>
        <button className={activeTab === 'generate' ? 'active' : ''} onClick={() => setActiveTab('generate')}>
          {strings.generate}
        </button>
        <button className={activeTab === 'editor' ? 'active' : ''} onClick={() => setActiveTab('editor')}>
          {strings.editor}
        </button>
      </nav>

      {activeTab === 'students' && (
        <section className="panel">
          <div className="panel-header">
            <h2>{strings.students}</h2>
            <button className="primary" onClick={() => setStudents(sampleStudents)}>
              Load sample dataset
            </button>
          </div>
          <div className="student-entry">
            <textarea
              value={manualEntry}
              onChange={(event) => setManualEntry(event.target.value)}
              placeholder={strings.pasteList}
            />
            <div className="student-entry-actions">
              <button onClick={handleAddStudent}>{strings.addStudent}</button>
              <label className="upload">
                {strings.uploadCsv}
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleCSVUpload(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="student-table">
            <div className="table-header">
              <span>Name</span>
              <span>Gender</span>
              <span>Level</span>
              <span>Behavior</span>
              <span>Support</span>
              <span>Front</span>
              <span>Notes</span>
              <span></span>
            </div>
            {students.map((student) => (
              <div className="table-row" key={student.id}>
                <input
                  value={student.name}
                  onChange={(event) => handleStudentChange(student.id, { name: event.target.value })}
                />
                <select
                  value={student.gender}
                  onChange={(event) => handleStudentChange(student.id, { gender: event.target.value as Student['gender'] })}
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={student.level}
                  onChange={(event) => handleStudentChange(student.id, { level: Number(event.target.value) as Student['level'] })}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} - {levelLabel(value)}
                    </option>
                  ))}
                </select>
                <select
                  value={student.behavior}
                  onChange={(event) => handleStudentChange(student.id, { behavior: Number(event.target.value) as Student['behavior'] })}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} - {behaviorLabel(value)}
                    </option>
                  ))}
                </select>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={student.sen}
                      onChange={(event) => handleStudentChange(student.id, { sen: event.target.checked })}
                    />
                    SEN
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={student.eal}
                      onChange={(event) => handleStudentChange(student.id, { eal: event.target.checked })}
                    />
                    EAL
                  </label>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={student.needsFront}
                    onChange={(event) => handleStudentChange(student.id, { needsFront: event.target.checked })}
                  />
                </label>
                <textarea
                  value={student.notes}
                  onChange={(event) => handleStudentChange(student.id, { notes: event.target.value })}
                />
                <button className="ghost" onClick={() => handleDeleteStudent(student.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'layout' && (
        <section className="panel">
          <div className="panel-header">
            <h2>{strings.layout}</h2>
            <div className="layout-controls">
              <label>
                Rows
                <input
                  type="number"
                  min={1}
                  value={layout.rows}
                  onChange={(event) =>
                    setLayout(createEmptyLayout(Number(event.target.value), layout.cols))
                  }
                />
              </label>
              <label>
                Columns
                <input
                  type="number"
                  min={1}
                  value={layout.cols}
                  onChange={(event) =>
                    setLayout(createEmptyLayout(layout.rows, Number(event.target.value)))
                  }
                />
              </label>
              <button className="ghost" onClick={() => handleLayoutPreset(sampleLayouts[0])}>
                Preset 6x6
              </button>
              <button className="ghost" onClick={() => handleLayoutPreset(sampleLayouts[1])}>
                Preset 5x7
              </button>
              <button className="ghost" onClick={() => handleLayoutPreset(sampleLayouts[2])}>
                Preset 4x8
              </button>
            </div>
          </div>
          <div className="layout-grid">
            <div
              className="seat-grid"
              style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(80px, 1fr))` }}
            >
              {layout.seats.map((seat) => (
                <div key={seat.id} className={clsx('seat-preview', seat.type)}>
                  <div className="seat-label">R{seat.row + 1}C{seat.col + 1}</div>
                  <select value={seat.type} onChange={(event) => updateSeatType(seat.id, event.target.value as SeatType)}>
                    {Object.entries(seatTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="layout-meta">
              <label>
                Board position
                <select
                  value={`${layout.boardPosition.row}-${layout.boardPosition.col}`}
                  onChange={(event) => {
                    const [row, col] = event.target.value.split('-').map(Number);
                    setLayout((prev) => ({ ...prev, boardPosition: { row, col } }));
                  }}
                >
                  {layout.seats.map((seat) => (
                    <option key={seat.id} value={`${seat.row}-${seat.col}`}>
                      R{seat.row + 1}C{seat.col + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Teacher desk
                <select
                  value={`${layout.teacherDesk.row}-${layout.teacherDesk.col}`}
                  onChange={(event) => {
                    const [row, col] = event.target.value.split('-').map(Number);
                    setLayout((prev) => ({ ...prev, teacherDesk: { row, col } }));
                  }}
                >
                  {layout.seats.map((seat) => (
                    <option key={seat.id} value={`${seat.row}-${seat.col}`}>
                      R{seat.row + 1}C{seat.col + 1}
                    </option>
                  ))}
                </select>
              </label>
              <p className="helper">Use seat types to mark front row, wheelchair access, or exam mode seats.</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'constraints' && (
        <section className="panel">
          <div className="panel-header">
            <h2>{strings.constraints}</h2>
          </div>
          <div className="constraints-grid">
            <label>
              <input
                type="checkbox"
                checked={constraints.enforceConflicts}
                onChange={(event) => setConstraints((prev) => ({ ...prev, enforceConflicts: event.target.checked }))}
              />
              Enforce conflicts (hard)
            </label>
            <label>
              <input
                type="checkbox"
                checked={constraints.encourageFriends}
                onChange={(event) => setConstraints((prev) => ({ ...prev, encourageFriends: event.target.checked }))}
              />
              Encourage friends (soft)
            </label>
            <label>
              <input
                type="checkbox"
                checked={constraints.alternateGender}
                onChange={(event) => setConstraints((prev) => ({ ...prev, alternateGender: event.target.checked }))}
              />
              Alternate gender
            </label>
            <label>
              <input
                type="checkbox"
                checked={constraints.spreadWeak}
                onChange={(event) => setConstraints((prev) => ({ ...prev, spreadWeak: event.target.checked }))}
              />
              Spread weak students
            </label>
            <label>
              <input
                type="checkbox"
                checked={constraints.spreadBehavior}
                onChange={(event) => setConstraints((prev) => ({ ...prev, spreadBehavior: event.target.checked }))}
              />
              Distribute behavior risk
            </label>
            <label>
              <input
                type="checkbox"
                checked={constraints.avoidTalkative}
                onChange={(event) => setConstraints((prev) => ({ ...prev, avoidTalkative: event.target.checked }))}
              />
              Avoid talkative neighbors
            </label>
            <label>
              <input
                type="checkbox"
                checked={constraints.frontForSupport}
                onChange={(event) => setConstraints((prev) => ({ ...prev, frontForSupport: event.target.checked }))}
              />
              Front for SEN/EAL/needs
            </label>
          </div>
          <div className="weights">
            {Object.entries(constraints.weights).map(([key, value]) => (
              <label key={key}>
                {key} weight
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={value}
                  onChange={(event) =>
                    setConstraints((prev) => ({
                      ...prev,
                      weights: { ...prev.weights, [key]: Number(event.target.value) }
                    }))
                  }
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'generate' && (
        <section className="panel">
          <div className="panel-header">
            <h2>{strings.generate}</h2>
          </div>
          <div className="mode-grid">
            {modes.map((option) => (
              <button
                key={option.value}
                className={clsx('mode-card', mode === option.value && 'active')}
                onClick={() => setMode(option.value)}
              >
                <h3>{option.label}</h3>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
          <button className="primary" onClick={handleGeneratePlans}>
            {strings.generatePlans}
          </button>
          {plans.length > 0 && (
            <div className="plans-list">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  className={clsx('plan-card', selectedPlanId === plan.id && 'active')}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <h4>Plan {plan.id.slice(0, 4)}</h4>
                  <p>Score: {plan.score}</p>
                  <ul>
                    {plan.explanation.slice(0, 3).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'editor' && (
        <section className="panel">
          <div className="panel-header">
            <h2>{strings.editor}</h2>
            <div className="editor-actions">
              <button onClick={handleUndo} disabled={history.length === 0}>
                Undo
              </button>
              <button onClick={handleRedo} disabled={future.length === 0}>
                Redo
              </button>
              <button onClick={handleSavePlan}>{strings.savePlan}</button>
              <button onClick={handleGeneratePlans}>{strings.regenerate}</button>
            </div>
          </div>
          {selectedPlan ? (
            <>
              <div className="editor-toolbar">
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder={strings.search}
                />
                <select value={colorMode} onChange={(event) => setColorMode(event.target.value as typeof colorMode)}>
                  <option value="level">Color by level</option>
                  <option value="behavior">Color by behavior</option>
                  <option value="gender">Color by gender</option>
                </select>
                <div className="export-group">
                  <span>{strings.export}</span>
                  <button onClick={handleExportPNG}>PNG</button>
                  <button onClick={() => handleExportPDF('a4')}>PDF A4</button>
                  <button onClick={() => handleExportPDF('a3')}>PDF A3</button>
                  <button onClick={handleExportExcel}>Excel</button>
                  <button onClick={handlePrint}>Print</button>
                </div>
              </div>
              <div className="editor-grid">
                <div
                  id="seat-grid"
                  className="seat-grid"
                  style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(100px, 1fr))` }}
                >
                  {layout.seats.map((seat) => {
                    const studentId = selectedPlan?.seats[seat.id] ?? null;
                    const student = studentId ? studentById[studentId] : undefined;
                    const isLocked = Boolean(lockedSeats[seat.id]);
                    const isSelected = seatSelection === seat.id;
                    const isHighlighted = student && studentSearch && filteredStudents.includes(student);
                    return (
                      <div
                        key={seat.id}
                        className={clsx(
                          seatColor(student),
                          isSelected && 'selected',
                          isLocked && 'locked',
                          isHighlighted && 'highlight'
                        )}
                        onClick={() => handleSeatSwap(seat.id)}
                      >
                        <div className="seat-header">
                          <span>R{seat.row + 1}C{seat.col + 1}</span>
                          <button
                            className="lock"
                            disabled={!studentId && !isLocked}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isLocked) {
                                handleLockSeat(seat.id, null);
                                return;
                              }
                              if (studentId) {
                                handleLockSeat(seat.id, studentId);
                              }
                            }}
                          >
                            {isLocked ? strings.unlockSeat : strings.lockSeat}
                          </button>
                        </div>
                        <strong>{student?.name ?? 'Empty'}</strong>
                        {student && (
                          <div className="seat-meta">
                            <span>{levelLabel(student.level)}</span>
                            <span>{behaviorLabel(student.behavior)}</span>
                            <button
                              className="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                setNotesStudentId(student.id);
                              }}
                            >
                              Notes
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <aside className="editor-sidebar">
                  <h3>{strings.explanation}</h3>
                  <ul>
                    {selectedPlan?.explanation.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {selectedPlan?.warnings.length ? (
                    <>
                      <h4>{strings.warnings}</h4>
                      <ul>
                        {selectedPlan.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <h3>Saved plans</h3>
                  <ul>
                    {savedPlans.map((saved) => (
                      <li key={saved.id}>
                        <button
                          className="ghost"
                          onClick={() => {
                            setPlans([saved.plan]);
                            setSelectedPlanId(saved.plan.id);
                            setActiveTab('editor');
                          }}
                        >
                          {saved.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            </>
          ) : (
            <p className="helper">Generate a plan to start editing, exporting, and saving.</p>
          )}
        </section>
      )}

      {notesStudentId && (
        <div className="modal">
          <div className="modal-content">
            <h3>Teacher Notes</h3>
            <textarea
              value={studentById[notesStudentId]?.notes ?? ''}
              onChange={(event) => handleStudentChange(notesStudentId, { notes: event.target.value })}
            />
            <button onClick={() => setNotesStudentId(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
