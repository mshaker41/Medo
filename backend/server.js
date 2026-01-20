import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const getSeatNeighbors = (layout) => {
  const map = {};
  layout.seats.forEach((seat) => {
    const neighbors = [];
    const deltas = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    deltas.forEach(([dr, dc]) => {
      const neighbor = layout.seats.find((s) => s.row === seat.row + dr && s.col === seat.col + dc);
      if (neighbor) {
        neighbors.push(neighbor.id);
      }
    });
    map[seat.id] = neighbors;
  });
  return map;
};

const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const computeHardViolations = ({ students, layout, constraints, plan }) => {
  const seatMap = plan.seats;
  const studentMap = Object.fromEntries(students.map((student) => [student.id, student]));
  const neighbors = getSeatNeighbors(layout);
  let conflictViolations = 0;
  let frontViolations = 0;

  layout.seats.forEach((seat) => {
    const studentId = seatMap[seat.id];
    if (!studentId) return;
    const student = studentMap[studentId];

    if (constraints.frontForSupport && (student.needsFront || student.sen || student.eal)) {
      if (!(seat.row === 0 || seat.type === 'front')) {
        frontViolations += 1;
      }
    }

    const seatNeighbors = neighbors[seat.id];
    seatNeighbors.forEach((neighborId) => {
      const neighborStudentId = seatMap[neighborId];
      if (!neighborStudentId) return;
      const neighbor = studentMap[neighborStudentId];

      if (constraints.enforceConflicts && student.conflicts.includes(neighbor.id)) {
        conflictViolations += 1;
      }
    });
  });

  return { conflictViolations, frontViolations };
};

const computeScore = ({ students, layout, constraints, mode, plan }) => {
  const seatMap = plan.seats;
  const studentMap = Object.fromEntries(students.map((student) => [student.id, student]));
  const neighbors = getSeatNeighbors(layout);
  let score = 0;
  const warnings = [];
  const explanation = [];

  let conflictViolations = 0;
  let frontViolations = 0;
  let friendAdjacency = 0;
  let genderAlternations = 0;
  let weakSpread = 0;
  let behaviorSpread = 0;
  let talkativeAdjacency = 0;

  layout.seats.forEach((seat) => {
    const studentId = seatMap[seat.id];
    if (!studentId) return;
    const student = studentMap[studentId];

    if (constraints.frontForSupport && (student.needsFront || student.sen || student.eal)) {
      if (!(seat.row === 0 || seat.type === 'front')) {
        frontViolations += 1;
      }
    }

    const seatNeighbors = neighbors[seat.id];
    seatNeighbors.forEach((neighborId) => {
      const neighborStudentId = seatMap[neighborId];
      if (!neighborStudentId) return;
      const neighbor = studentMap[neighborStudentId];

      if (constraints.enforceConflicts && student.conflicts.includes(neighbor.id)) {
        conflictViolations += 1;
      }
      if (constraints.encourageFriends && student.friends.includes(neighbor.id)) {
        friendAdjacency += 1;
      }
      if (constraints.alternateGender && student.gender !== neighbor.gender) {
        genderAlternations += 1;
      }
      if (constraints.avoidTalkative && student.behavior >= 4 && neighbor.behavior >= 4) {
        talkativeAdjacency += 1;
      }
    });
  });

  if (constraints.spreadWeak) {
    const rows = Array.from({ length: layout.rows }, () => 0);
    layout.seats.forEach((seat) => {
      const studentId = seatMap[seat.id];
      if (studentId && studentMap[studentId].level <= 2) {
        rows[seat.row] += 1;
      }
    });
    weakSpread = Math.max(...rows) - Math.min(...rows);
  }

  if (constraints.spreadBehavior) {
    const rows = Array.from({ length: layout.rows }, () => 0);
    layout.seats.forEach((seat) => {
      const studentId = seatMap[seat.id];
      if (studentId && studentMap[studentId].behavior >= 4) {
        rows[seat.row] += 1;
      }
    });
    behaviorSpread = Math.max(...rows) - Math.min(...rows);
  }

  if (constraints.enforceConflicts && conflictViolations > 0) {
    warnings.push('Some conflict pairs are adjacent.');
    score -= conflictViolations * 50;
  }

  if (constraints.frontForSupport && frontViolations > 0) {
    warnings.push('Some support students are not in front seats.');
    score -= frontViolations * 20;
  }

  if (constraints.encourageFriends) {
    score += friendAdjacency * constraints.weights.friends;
    if (friendAdjacency > 0) {
      explanation.push(`${friendAdjacency} friend adjacencies created.`);
    }
  }

  if (constraints.alternateGender) {
    score += genderAlternations * constraints.weights.gender;
    explanation.push('Gender alternation encouraged.');
  }

  if (constraints.spreadWeak) {
    score += Math.max(0, 10 - weakSpread) * constraints.weights.weakSpread;
    explanation.push('Weak students spread across rows.');
  }

  if (constraints.spreadBehavior) {
    score += Math.max(0, 10 - behaviorSpread) * constraints.weights.behaviorSpread;
    explanation.push('Behavior risk balanced across rows.');
  }

  if (constraints.avoidTalkative) {
    score -= talkativeAdjacency * constraints.weights.talkative;
    explanation.push('Talkative students separated.');
  }

  if (constraints.frontForSupport) {
    score += Math.max(0, 8 - frontViolations) * constraints.weights.frontSupport;
    explanation.push('Support needs placed near front.');
  }

  if (mode === 'exam') {
    score -= talkativeAdjacency * 3;
    explanation.push('Exam mode prioritized separation.');
  }

  if (mode === 'support') {
    score += (8 - frontViolations) * 2;
    explanation.push('Support mode prioritized teacher proximity.');
  }

  if (mode === 'random') {
    score += Math.floor(Math.random() * 5);
  }

  return { score, explanation: explanation.slice(0, 6), warnings };
};

const buildInitialPlan = ({ students, layout, lockedSeats }) => {
  const seats = {};
  layout.seats.forEach((seat) => {
    seats[seat.id] = null;
  });

  Object.entries(lockedSeats).forEach(([seatId, studentId]) => {
    seats[seatId] = studentId;
  });

  const assignedStudentIds = new Set(Object.values(lockedSeats));
  const unassignedStudents = students.filter((student) => !assignedStudentIds.has(student.id));
  const availableSeats = layout.seats.filter((seat) => !seats[seat.id]).map((seat) => seat.id);

  const shuffledStudents = shuffle(unassignedStudents);
  const shuffledSeats = shuffle(availableSeats);

  shuffledStudents.forEach((student, index) => {
    seats[shuffledSeats[index]] = student.id;
  });

  return seats;
};

const improvePlan = ({ students, layout, constraints, mode, plan, lockedSeats = {}, iterations = 400 }) => {
  let bestPlan = { ...plan, seats: { ...plan.seats } };
  let bestScore = computeScore({ students, layout, constraints, mode, plan: bestPlan }).score;
  const lockedSeatIds = new Set(Object.keys(lockedSeats));

  for (let i = 0; i < iterations; i += 1) {
    const seatIds = Object.keys(bestPlan.seats);
    const [seatA, seatB] = shuffle(seatIds).filter((seatId) => !lockedSeatIds.has(seatId)).slice(0, 2);
    if (!seatA || !seatB) continue;
    const candidate = { ...bestPlan, seats: { ...bestPlan.seats } };
    const temp = candidate.seats[seatA];
    candidate.seats[seatA] = candidate.seats[seatB];
    candidate.seats[seatB] = temp;
    const hardViolations = computeHardViolations({ students, layout, constraints, plan: candidate });
    if (hardViolations.conflictViolations > 0 || hardViolations.frontViolations > 0) {
      continue;
    }
    const { score } = computeScore({ students, layout, constraints, mode, plan: candidate });
    if (score > bestScore) {
      bestPlan = candidate;
      bestScore = score;
    }
  }
  return bestPlan;
};

app.post('/generate-plan', (req, res) => {
  const { students, layout, constraints, mode, lockedSeats } = req.body;

  if (!students?.length || !layout?.seats?.length) {
    res.status(400).send('Missing students or layout data.');
    return;
  }

  if (students.length > layout.seats.length) {
    res.status(400).send('Not enough seats for all students.');
    return;
  }

  const plans = [];
  for (let i = 0; i < 5; i += 1) {
    let bestCandidate = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const seats = buildInitialPlan({ students, layout, lockedSeats: lockedSeats ?? {} });
      const improved = improvePlan({
        students,
        layout,
        constraints,
        mode,
        plan: { id: `${Date.now()}-${i}-${attempt}`, seats },
        lockedSeats: lockedSeats ?? {}
      });
      const hardViolations = computeHardViolations({ students, layout, constraints, plan: improved });
      if (hardViolations.conflictViolations === 0 && hardViolations.frontViolations === 0) {
        bestCandidate = improved;
        break;
      }
    }
    if (!bestCandidate) continue;
    const metrics = computeScore({ students, layout, constraints, mode, plan: bestCandidate });
    plans.push({
      id: bestCandidate.id ?? `${Date.now()}-${i}`,
      seats: bestCandidate.seats,
      score: Math.round(metrics.score),
      explanation: metrics.explanation,
      warnings: metrics.warnings
    });
  }

  plans.sort((a, b) => b.score - a.score);

  if (!plans.length) {
    res.status(400).send('Unable to find a valid plan. Try relaxing constraints or unlocking seats.');
    return;
  }

  res.json({ plans });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Seating plan backend running on port ${PORT}`);
});
