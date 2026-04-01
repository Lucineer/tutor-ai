// tutor-ai: Personalized Learning Tracker
// Every module here is designed to compound value over time.
// Day 1: useful. Month 6: irreplaceable. Year 2: nobody can replicate it.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  name: string;
  subjects: string[];
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'auditory';
  goals: string[];
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  dailyStudyMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionLog {
  id: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  problemsAttempted: number;
  problemsSolved: number;
  score: number;
  notes: string;
}

export interface Mistake {
  id: string;
  date: string;
  subject: string;
  topic: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  misconception: string;
  correctExplanation: string;
  patternId?: string;
}

export interface MistakePattern {
  id: string;
  name: string;
  description: string;
  topic: string;
  mistakeIds: string[];
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  lastReviewed: string | null;
  nextReview: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface ProgressSnapshot {
  id: string;
  date: string;
  subjectMasteries: Record<string, number>;
  streakCount: number;
  totalStudyHours: number;
  weeklyStudyHours: number;
  problemsSolved: number;
  accuracyRate: number;
}

export interface Goal {
  id: string;
  title: string;
  subject: string;
  description: string;
  targetDate: string;
  completed: boolean;
  checkpoints: Checkpoint[];
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  basedOnMistakes: boolean;
  relatedMistakeIds: string[];
}

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'trend' | 'achievement' | 'warning' | 'comparison';
  title: string;
  description: string;
  confidence: number;
  relatedTopics: string[];
  relatedMistakeIds: string[];
  date: string;
  actionable: string;
}

// ─── StudentProfile Manager ───────────────────────────────────────────────────

export class StudentProfileManager {
  private profile: StudentProfile | null = null;

  constructor(data?: StudentProfile) {
    if (data) this.profile = data;
  }

  get(): StudentProfile | null {
    return this.profile;
  }

  set(profile: StudentProfile): void {
    this.profile = { ...profile, updatedAt: new Date().toISOString() };
  }

  update(patch: Partial<StudentProfile>): StudentProfile {
    if (!this.profile) throw new Error('No profile set');
    this.profile = { ...this.profile, ...patch, updatedAt: new Date().toISOString() };
    return this.profile;
  }
}

// ─── Session Tracker ──────────────────────────────────────────────────────────

export class SessionTracker {
  private sessions: SessionLog[] = [];

  constructor(data?: SessionLog[]) {
    if (data) this.sessions = data;
  }

  getAll(): SessionLog[] {
    return [...this.sessions];
  }

  getBySubject(subject: string): SessionLog[] {
    return this.sessions.filter(s => s.subject === subject);
  }

  getByDateRange(start: string, end: string): SessionLog[] {
    return this.sessions.filter(s => s.date >= start && s.date <= end);
  }

  add(session: SessionLog): void {
    this.sessions.push(session);
  }

  getRecent(count: number): SessionLog[] {
    return [...this.sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, count);
  }

  getTotalStudyMinutes(): number {
    return this.sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  }

  getWeeklyMinutes(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().split('T')[0];
    return this.sessions
      .filter(s => s.date >= cutoff)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }

  getStreak(): number {
    if (this.sessions.length === 0) return 0;
    const dates = [...new Set(this.sessions.map(s => s.date))].sort().reverse();
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1.5) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  getAccuracy(): number {
    if (this.sessions.length === 0) return 0;
    const totalAttempted = this.sessions.reduce((s, x) => s + x.problemsAttempted, 0);
    const totalSolved = this.sessions.reduce((s, x) => s + x.problemsSolved, 0);
    return totalAttempted > 0 ? totalSolved / totalAttempted : 0;
  }
}

// ─── Mistake Tracker ──────────────────────────────────────────────────────────

export class MistakeTracker {
  private mistakes: Mistake[] = [];
  private patterns: MistakePattern[] = [];

  constructor(mistakes?: Mistake[], patterns?: MistakePattern[]) {
    if (mistakes) this.mistakes = mistakes;
    if (patterns) this.patterns = patterns;
  }

  getAll(): Mistake[] {
    return [...this.mistakes];
  }

  getByTopic(topic: string): Mistake[] {
    return this.mistakes.filter(m => m.topic === topic);
  }

  getBySubject(subject: string): Mistake[] {
    return this.mistakes.filter(m => m.subject === subject);
  }

  add(mistake: Mistake): void {
    this.mistakes.push(mistake);
    this.detectPatterns();
  }

  getPatterns(): MistakePattern[] {
    return [...this.patterns];
  }

  getMistakesByPattern(patternId: string): Mistake[] {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (!pattern) return [];
    return this.mistakes.filter(m => pattern.mistakeIds.includes(m.id));
  }

  getTopicWeakness(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const m of this.mistakes) {
      counts[m.topic] = (counts[m.topic] || 0) + 1;
    }
    return counts;
  }

  private detectPatterns(): void {
    const topicGroups: Record<string, Mistake[]> = {};
    for (const m of this.mistakes) {
      const key = m.topic;
      if (!topicGroups[key]) topicGroups[key] = [];
      topicGroups[key].push(m);
    }

    for (const [topic, group] of Object.entries(topicGroups)) {
      if (group.length < 2) continue;
      const misconceptions: Record<string, Mistake[]> = {};
      for (const m of group) {
        const normKey = m.misconception.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 40);
        if (!misconceptions[normKey]) misconceptions[normKey] = [];
        misconceptions[normKey].push(m);
      }

      for (const [, patternMistakes] of Object.entries(misconceptions)) {
        if (patternMistakes.length < 2) continue;
        const existingPattern = this.patterns.find(p =>
          p.topic === topic &&
          patternMistakes.some(m => p.mistakeIds.includes(m.id))
        );

        if (existingPattern) {
          for (const m of patternMistakes) {
            if (!existingPattern.mistakeIds.includes(m.id)) {
              existingPattern.mistakeIds.push(m.id);
            }
          }
          existingPattern.occurrences = existingPattern.mistakeIds.length;
          existingPattern.lastSeen = patternMistakes[patternMistakes.length - 1].date;
        } else {
          this.patterns.push({
            id: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: `Repeated ${topic} misconception`,
            description: patternMistakes[0].misconception,
            topic,
            mistakeIds: patternMistakes.map(m => m.id),
            firstSeen: patternMistakes[0].date,
            lastSeen: patternMistakes[patternMistakes.length - 1].date,
            occurrences: patternMistakes.length,
          });
        }
      }
    }
  }
}

// ─── Spaced Repetition (SM-2 Algorithm) ───────────────────────────────────────

export class SpacedRepetition {
  private cards: Flashcard[] = [];

  constructor(data?: Flashcard[]) {
    if (data) this.cards = data;
  }

  getAll(): Flashcard[] {
    return [...this.cards];
  }

  add(card: Flashcard): void {
    this.cards.push(card);
  }

  getDue(): Flashcard[] {
    const now = new Date().toISOString().split('T')[0];
    return this.cards.filter(c => c.nextReview <= now).sort((a, b) => a.nextReview.localeCompare(b.nextReview));
  }

  getDueCount(): number {
    return this.getDue().length;
  }

  review(cardId: string, quality: number): Flashcard {
    // SM-2: quality 0-5 (0=complete failure, 5=perfect)
    const card = this.cards.find(c => c.id === cardId);
    if (!card) throw new Error(`Card ${cardId} not found`);

    const now = new Date().toISOString().split('T')[0];

    if (quality >= 3) {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions++;
    } else {
      card.repetitions = 0;
      card.interval = 1;
    }

    card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    card.lastReviewed = now;
    const next = new Date();
    next.setDate(next.getDate() + card.interval);
    card.nextReview = next.toISOString().split('T')[0];

    return card;
  }

  getBySubject(subject: string): Flashcard[] {
    return this.cards.filter(c => c.subject === subject);
  }

  getStats(): { total: number; due: number; mature: number; learning: number } {
    const now = new Date().toISOString().split('T')[0];
    return {
      total: this.cards.length,
      due: this.cards.filter(c => c.nextReview <= now).length,
      mature: this.cards.filter(c => c.interval >= 21).length,
      learning: this.cards.filter(c => c.interval < 21).length,
    };
  }
}

// ─── Progress Tracker ─────────────────────────────────────────────────────────

export class ProgressTracker {
  private snapshots: ProgressSnapshot[] = [];

  constructor(data?: ProgressSnapshot[]) {
    if (data) this.snapshots = data;
  }

  getAll(): ProgressSnapshot[] {
    return [...this.snapshots];
  }

  add(snapshot: ProgressSnapshot): void {
    this.snapshots.push(snapshot);
  }

  getLatest(): ProgressSnapshot | null {
    if (this.snapshots.length === 0) return null;
    return this.snapshots[this.snapshots.length - 1];
  }

  getSubjectMasteryTrend(subject: string): { date: string; mastery: number }[] {
    return this.snapshots.map(s => ({
      date: s.date,
      mastery: s.subjectMasteries[subject] ?? 0,
    }));
  }

  getImprovement(subject: string, days: number = 30): number {
    if (this.snapshots.length < 2) return 0;
    const recent = this.snapshots.filter(s => {
      const d = new Date(s.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return d >= cutoff;
    });
    if (recent.length < 2) return 0;
    const first = recent[0].subjectMasteries[subject] ?? 0;
    const last = recent[recent.length - 1].subjectMasteries[subject] ?? 0;
    return last - first;
  }

  computeMasteries(mistakes: Mistake[], sessions: SessionLog[]): Record<string, number> {
    const subjectScores: Record<string, { correct: number; total: number }> = {};

    for (const s of sessions) {
      if (!subjectScores[s.subject]) subjectScores[s.subject] = { correct: 0, total: 0 };
      subjectScores[s.subject].correct += s.problemsSolved;
      subjectScores[s.subject].total += s.problemsAttempted;
    }

    const masteries: Record<string, number> = {};
    for (const [subject, data] of Object.entries(subjectScores)) {
      const mistakeCount = mistakes.filter(m => m.subject === subject).length;
      const baseScore = data.total > 0 ? (data.correct / data.total) * 100 : 50;
      const mistakePenalty = Math.min(mistakeCount * 2, 30);
      masteries[subject] = Math.max(0, Math.min(100, baseScore - mistakePenalty));
    }
    return masteries;
  }
}

// ─── Goal Manager ─────────────────────────────────────────────────────────────

export class GoalManager {
  private goals: Goal[] = [];

  constructor(data?: Goal[]) {
    if (data) this.goals = data;
  }

  getAll(): Goal[] {
    return [...this.goals];
  }

  getActive(): Goal[] {
    return this.goals.filter(g => !g.completed);
  }

  getCompleted(): Goal[] {
    return this.goals.filter(g => g.completed);
  }

  add(goal: Goal): void {
    this.goals.push(goal);
  }

  completeGoal(goalId: string): void {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) goal.completed = true;
  }

  completeCheckpoint(goalId: string, checkpointId: string): void {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;
    const cp = goal.checkpoints.find(c => c.id === checkpointId);
    if (cp) {
      cp.completed = true;
      cp.completedAt = new Date().toISOString().split('T')[0];
    }
    if (goal.checkpoints.every(c => c.completed)) {
      goal.completed = true;
    }
  }

  getProgress(goalId: string): number {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal || goal.checkpoints.length === 0) return 0;
    return goal.checkpoints.filter(c => c.completed).length / goal.checkpoints.length;
  }
}

// ─── Quiz Generator ───────────────────────────────────────────────────────────

export class QuizGenerator {
  generateQuiz(
    subject: string,
    mistakes: Mistake[],
    sessions: SessionLog[],
    flashcards: Flashcard[],
    count: number = 10
  ): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const topicWeakness = this.computeTopicWeakness(mistakes);
    const recentMistakes = mistakes
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
    const subjectMistakes = mistakes.filter(m => m.subject === subject);

    // 60% from weak areas, 20% review, 20% new material
    const weakCount = Math.ceil(count * 0.6);
    const reviewCount = Math.ceil(count * 0.2);
    const newCount = count - weakCount - reviewCount;

    // Generate questions from mistakes (weak areas)
    const shuffledMistakes = [...subjectMistakes].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(weakCount, shuffledMistakes.length); i++) {
      const m = shuffledMistakes[i];
      questions.push({
        id: `q_${Date.now()}_${i}`,
        subject: m.subject,
        topic: m.topic,
        question: m.question,
        options: this.generateOptions(m.correctAnswer, m.wrongAnswer),
        correctIndex: 0,
        explanation: m.correctExplanation,
        difficulty: 'medium',
        basedOnMistakes: true,
        relatedMistakeIds: [m.id],
      });
    }

    // Generate from flashcards (review)
    const subjectCards = flashcards.filter(f => f.subject === subject).sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(reviewCount, subjectCards.length); i++) {
      const c = subjectCards[i];
      questions.push({
        id: `q_${Date.now()}_r${i}`,
        subject: c.subject,
        topic: c.topic,
        question: c.front,
        options: this.generateOptions(c.back, ''),
        correctIndex: 0,
        explanation: c.back,
        difficulty: c.interval > 14 ? 'easy' : 'medium',
        basedOnMistakes: false,
        relatedMistakeIds: [],
      });
    }

    // New material from weakest topics
    const weakTopics = Object.entries(topicWeakness)
      .sort(([, a], [, b]) => b - a)
      .slice(0, newCount);
    for (let i = 0; i < weakTopics.length; i++) {
      const [topic] = weakTopics[i];
      questions.push({
        id: `q_${Date.now()}_n${i}`,
        subject,
        topic,
        question: `Which concept is most important to understand about ${topic}?`,
        options: ['Core principles and edge cases', 'Just memorize the algorithm', 'Skip it and come back later', 'Only learn the easy parts'],
        correctIndex: 0,
        explanation: `Focus on understanding the fundamentals of ${topic} — edge cases and core principles build lasting knowledge.`,
        difficulty: 'hard',
        basedOnMistakes: false,
        relatedMistakeIds: [],
      });
    }

    return questions.sort(() => Math.random() - 0.5);
  }

  private computeTopicWeakness(mistakes: Mistake[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const m of mistakes) {
      counts[m.topic] = (counts[m.topic] || 0) + 1;
    }
    return counts;
  }

  private generateOptions(correct: string, previousWrong: string): string[] {
    const options = [correct];
    if (previousWrong && previousWrong !== correct) {
      options.push(previousWrong);
    }
    const distractors = [
      'None of the above',
      'It depends on the implementation',
      'The answer is undefined behavior',
      'Both A and B are correct',
    ];
    while (options.length < 4) {
      const d = distractors[options.length - 1] || `Alternative answer ${options.length}`;
      if (!options.includes(d)) options.push(d);
    }
    return options.sort(() => Math.random() - 0.5);
  }
}

// ─── Learning Insights ────────────────────────────────────────────────────────

export class LearningInsights {
  generate(
    mistakes: Mistake[],
    sessions: SessionLog[],
    patterns: MistakePattern[],
    progress: ProgressSnapshot[],
    profile: StudentProfile | null
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const now = new Date().toISOString().split('T')[0];

    // Pattern-based insights
    for (const pattern of patterns) {
      if (pattern.occurrences >= 3) {
        insights.push({
          id: `ins_${Date.now()}_p${patterns.indexOf(pattern)}`,
          type: 'pattern',
          title: `Recurring pattern: ${pattern.name}`,
          description: `You've made this same type of mistake ${pattern.occurrences} times in ${pattern.topic}. The core misconception is: "${pattern.description}"`,
          confidence: 0.9,
          relatedTopics: [pattern.topic],
          relatedMistakeIds: pattern.mistakeIds,
          date: now,
          actionable: `Schedule a focused review session on ${pattern.topic}. Try teaching the concept to someone else — if you can explain it clearly, you've truly understood it.`,
        });
      }
    }

    // Trend insights from progress
    if (progress.length >= 2) {
      const latest = progress[progress.length - 1];
      const previous = progress[progress.length - 2];

      for (const subject of Object.keys(latest.subjectMasteries)) {
        const diff = (latest.subjectMasteries[subject] ?? 0) - (previous.subjectMasteries[subject] ?? 0);
        if (diff > 10) {
          insights.push({
            id: `ins_${Date.now()}_t${subject}`,
            type: 'trend',
            title: `${subject} mastery jumped ${Math.round(diff)}%`,
            description: `Your understanding of ${subject} improved significantly. Keep doing what you're doing — it's clearly working.`,
            confidence: 0.85,
            relatedTopics: [subject],
            relatedMistakeIds: [],
            date: now,
            actionable: `Consider moving to harder ${subject} problems. You're ready for the next level.`,
          });
        }
        if (diff < -5) {
          insights.push({
            id: `ins_${Date.now()}_w${subject}`,
            type: 'warning',
            title: `${subject} mastery dropped ${Math.round(Math.abs(diff))}%`,
            description: `Your ${subject} scores have slipped. This often happens when we don't revisit material regularly.`,
            confidence: 0.8,
            relatedTopics: [subject],
            relatedMistakeIds: [],
            date: now,
            actionable: `Do a quick ${subject} review session today. Spaced repetition prevents decay.`,
          });
        }
      }
    }

    // Achievement insights
    if (sessions.length >= 10) {
      const streak = this.computeStreak(sessions);
      if (streak >= 7) {
        insights.push({
          id: `ins_${Date.now()}_a1`,
          type: 'achievement',
          title: `${streak}-day study streak!`,
          description: `You've been consistent for ${streak} days. Consistency beats intensity — you're building real knowledge.`,
          confidence: 1.0,
          relatedTopics: [],
          relatedMistakeIds: [],
          date: now,
          actionable: 'Keep the streak alive! Even 15 minutes today counts.',
        });
      }
    }

    // Confusion insights — find topics with similar mistakes
    const topicMistakes: Record<string, Mistake[]> = {};
    for (const m of mistakes) {
      if (!topicMistakes[m.topic]) topicMistakes[m.topic] = [];
      topicMistakes[m.topic].push(m);
    }

    const confusedPairs: string[][] = [];
    const topics = Object.keys(topicMistakes);
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const shared = topicMistakes[topics[i]].filter(m1 =>
          topicMistakes[topics[j]].some(m2 =>
            m1.misconception.toLowerCase().includes(m2.misconception.toLowerCase().split(' ').slice(0, 3).join(' '))
        );
        if (shared.length >= 2) {
          confusedPairs.push([topics[i], topics[j]]);
        }
      }
    }

    if (confusedPairs.length > 0) {
      insights.push({
        id: `ins_${Date.now()}_c1`,
        type: 'comparison',
        title: `Concepts you keep confusing: ${confusedPairs.map(p => p.join(' ↔ ')).join(', ')}`,
        description: `You tend to mix up these topics. This is common — they share surface similarities but have important differences.`,
        confidence: 0.75,
        relatedTopics: confusedPairs.flat(),
        relatedMistakeIds: [],
        date: now,
        actionable: 'Create comparison flashcards that highlight the KEY differences between these concepts side by side.',
      });
    }

    // Time-based insights
    if (sessions.length >= 20) {
      const hourBuckets: Record<number, { correct: number; total: number }> = {};
      for (const s of sessions) {
        const hour = new Date(s.date).getHours();
        if (!hourBuckets[hour]) hourBuckets[hour] = { correct: 0, total: 0 };
        hourBuckets[hour].correct += s.problemsSolved;
        hourBuckets[hour].total += s.problemsAttempted;
      }

      let bestHour = 0;
      let bestRate = 0;
      for (const [hour, data] of Object.entries(hourBuckets)) {
        const rate = data.total > 0 ? data.correct / data.total : 0;
        if (rate > bestRate) {
          bestRate = rate;
          bestHour = Number(hour);
        }
      }

      if (bestRate > 0) {
        insights.push({
          id: `ins_${Date.now()}_time`,
          type: 'pattern',
          title: `You perform best studying at ${bestHour}:00`,
          description: `Your accuracy peaks at ${bestHour}:00 with a ${Math.round(bestRate * 100)}% success rate. Your brain might be sharpest then.`,
          confidence: 0.7,
          relatedTopics: [],
          relatedMistakeIds: [],
          date: now,
          actionable: `Try to schedule your hardest topics around ${bestHour}:00 when you're at your peak.`,
        });
      }
    }

    return insights;
  }

  private computeStreak(sessions: SessionLog[]): number {
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    if (dates.length === 0) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1.5) streak++;
      else break;
    }
    return streak;
  }
}
