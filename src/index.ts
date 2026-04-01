import {
  StudentProfileManager,
  SessionTracker,
  MistakeTracker,
  SpacedRepetition,
  ProgressTracker,
  GoalManager,
  QuizGenerator,
  LearningInsights,
  type StudentProfile,
  type SessionLog,
  type Mistake,
  type Flashcard,
  type ProgressSnapshot,
  type Goal,
  type QuizQuestion,
  type LearningInsight,
} from './tutor/tracker';
import { SEED_DATA } from './seed';

interface Env {
  TUTOR_KV: KVNamespace;
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_API_URL: string;
}

async function getJSON<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function putJSON(kv: KVNamespace, key: string, data: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(data));
}

// ─── Seed data on first run ───────────────────────────────────────────────────

async function ensureSeeded(kv: KVNamespace): Promise<void> {
  const existing = await kv.get('seeded');
  if (existing) return;
  const seed = SEED_DATA;
  await putJSON(kv, 'student', seed.profile);
  await putJSON(kv, 'sessions', seed.sessions);
  await putJSON(kv, 'mistakes', seed.mistakes);
  await putJSON(kv, 'flashcards', seed.flashcards);
  await putJSON(kv, 'progress', seed.progress);
  await putJSON(kv, 'goals', seed.goals);
  await putJSON(kv, 'patterns', seed.patterns);
  await kv.put('seeded', 'true');
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    await ensureSeeded(env.TUTOR_KV);

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    try {
      // ── Chat (SSE streaming to DeepSeek) ─────────────────────────────────
      if (path === '/api/chat' && request.method === 'POST') {
        const { message, history } = (await request.json()) as { message: string; history?: { role: string; content: string }[] };

        const profile = await getJSON<StudentProfile>(env.TUTOR_KV, 'student');
        const mistakes = (await getJSON<Mistake[]>(env.TUTOR_KV, 'mistakes')) || [];
        const sessions = (await getJSON<SessionLog[]>(env.TUTOR_KV, 'sessions')) || [];
        const patterns = (await getJSON<any[]>(env.TUTOR_KV, 'patterns')) || [];
        const progress = (await getJSON<ProgressSnapshot[]>(env.TUTOR_KV, 'progress')) || [];

        const mistakeTracker = new MistakeTracker(mistakes, patterns);
        const sessionTracker = new SessionTracker(sessions);
        const progressTracker = new ProgressTracker(progress);

        const topWeaknesses = Object.entries(mistakeTracker.getTopicWeakness())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([topic, count]) => `${topic} (${count} mistakes)`)
          .join(', ');

        const streak = sessionTracker.getStreak();
        const totalHours = Math.round(sessionTracker.getTotalStudyMinutes() / 60);
        const latestProgress = progressTracker.getLatest();
        const masteries = latestProgress?.subjectMasteries
          ? Object.entries(latestProgress.subjectMasteries).map(([s, m]) => `${s}: ${Math.round(m)}%`).join(', ')
          : 'No data yet';

        const activePatterns = mistakeTracker.getPatterns()
          .filter(p => p.occurrences >= 2)
          .map(p => `"${p.description}" (${p.occurrences}x in ${p.topic})`)
          .join('; ');

        const systemPrompt = `You are Tutor, a personalized learning companion. You have watched this student struggle, improve, and grow. You know their exact weak points, preferred learning style, and what metaphors work for them. Reference their specific history in every explanation. When they make a mistake you've seen before, gently remind them of the pattern.

STUDENT PROFILE:
- Name: ${profile?.name || 'Student'}
- Subjects: ${profile?.subjects?.join(', ') || 'General'}
- Learning style: ${profile?.learningStyle || 'mixed'}
- Level: ${profile?.preferredDifficulty || 'intermediate'}

THEIR DATA:
- Current streak: ${streak} days
- Total study time: ${totalHours} hours
- Subject masteries: ${masteries}
- Top weaknesses: ${topWeaknesses || 'None identified yet'}
- Recurring mistake patterns: ${activePatterns || 'None yet'}

BEHAVIOR:
- Reference their specific history and mistakes when relevant
- Celebrate improvements you can see in the data
- If they're about to make a mistake you've seen before, gently warn them
- Use metaphors that match their learning style
- Be warm but honest — don't sugarcoat when they need to review something
- Keep responses concise and focused`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...(history || []).slice(-10),
          { role: 'user', content: message },
        ];

        const deepseekUrl = env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
        const deepseekRes = await fetch(deepseekUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            stream: true,
            max_tokens: 1024,
          }),
        });

        if (!deepseekRes.ok) {
          const errText = await deepseekRes.text();
          return new Response(JSON.stringify({ error: 'DeepSeek API error', details: errText }), {
            status: 502,
            headers: corsHeaders,
          });
        }

        return new Response(deepseekRes.body, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      // ── Student Profile ───────────────────────────────────────────────────
      if (path === '/api/student') {
        if (request.method === 'GET') {
          const data = await getJSON<StudentProfile>(env.TUTOR_KV, 'student');
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        }
        if (request.method === 'POST') {
          const profile = (await request.json()) as StudentProfile;
          await putJSON(env.TUTOR_KV, 'student', { ...profile, updatedAt: new Date().toISOString() });
          return new Response(JSON.stringify(profile), { headers: corsHeaders });
        }
      }

      // ── Sessions ──────────────────────────────────────────────────────────
      if (path === '/api/sessions') {
        if (request.method === 'GET') {
          const data = await getJSON<SessionLog[]>(env.TUTOR_KV, 'sessions');
          return new Response(JSON.stringify(data || []), { headers: corsHeaders });
        }
        if (request.method === 'POST') {
          const sessions = (await getJSON<SessionLog[]>(env.TUTOR_KV, 'sessions')) || [];
          const newSession = (await request.json()) as SessionLog;
          sessions.push(newSession);
          await putJSON(env.TUTOR_KV, 'sessions', sessions);
          return new Response(JSON.stringify(newSession), { status: 201, headers: corsHeaders });
        }
      }

      // ── Mistakes ──────────────────────────────────────────────────────────
      if (path === '/api/mistakes') {
        if (request.method === 'GET') {
          const data = await getJSON<Mistake[]>(env.TUTOR_KV, 'mistakes');
          return new Response(JSON.stringify(data || []), { headers: corsHeaders });
        }
        if (request.method === 'POST') {
          const mistakes = (await getJSON<Mistake[]>(env.TUTOR_KV, 'mistakes')) || [];
          const patterns = (await getJSON<any[]>(env.TUTOR_KV, 'patterns')) || [];
          const newMistake = (await request.json()) as Mistake;
          mistakes.push(newMistake);

          const tracker = new MistakeTracker(mistakes, patterns);
          tracker.add(newMistake);

          await putJSON(env.TUTOR_KV, 'mistakes', mistakes);
          await putJSON(env.TUTOR_KV, 'patterns', tracker.getPatterns());
          return new Response(JSON.stringify(newMistake), { status: 201, headers: corsHeaders });
        }
      }

      // ── Flashcards ────────────────────────────────────────────────────────
      if (path === '/api/flashcards') {
        if (request.method === 'GET') {
          const data = await getJSON<Flashcard[]>(env.TUTOR_KV, 'flashcards');
          return new Response(JSON.stringify(data || []), { headers: corsHeaders });
        }
        if (request.method === 'POST') {
          const cards = (await getJSON<Flashcard[]>(env.TUTOR_KV, 'flashcards')) || [];
          const body = (await request.json()) as { card?: Flashcard; review?: { cardId: string; quality: number } };

          if (body.review) {
            const sr = new SpacedRepetition(cards);
            const updated = sr.review(body.review.cardId, body.review.quality);
            await putJSON(env.TUTOR_KV, 'flashcards', sr.getAll());
            return new Response(JSON.stringify(updated), { headers: corsHeaders });
          }

          if (body.card) {
            cards.push(body.card);
            await putJSON(env.TUTOR_KV, 'flashcards', cards);
            return new Response(JSON.stringify(body.card), { status: 201, headers: corsHeaders });
          }

          return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: corsHeaders });
        }
      }

      // ── Progress ──────────────────────────────────────────────────────────
      if (path === '/api/progress') {
        if (request.method === 'GET') {
          const data = await getJSON<ProgressSnapshot[]>(env.TUTOR_KV, 'progress');
          return new Response(JSON.stringify(data || []), { headers: corsHeaders });
        }
        if (request.method === 'POST') {
          const snapshots = (await getJSON<ProgressSnapshot[]>(env.TUTOR_KV, 'progress')) || [];
          const newSnapshot = (await request.json()) as ProgressSnapshot;
          snapshots.push(newSnapshot);
          await putJSON(env.TUTOR_KV, 'progress', snapshots);
          return new Response(JSON.stringify(newSnapshot), { status: 201, headers: corsHeaders });
        }
      }

      // ── Goals ─────────────────────────────────────────────────────────────
      if (path === '/api/goals') {
        if (request.method === 'GET') {
          const data = await getJSON<Goal[]>(env.TUTOR_KV, 'goals');
          return new Response(JSON.stringify(data || []), { headers: corsHeaders });
        }
        if (request.method === 'POST') {
          const goals = (await getJSON<Goal[]>(env.TUTOR_KV, 'goals')) || [];
          const body = (await request.json()) as { goal?: Goal; completeGoal?: string; completeCheckpoint?: { goalId: string; checkpointId: string } };

          if (body.completeGoal) {
            const mgr = new GoalManager(goals);
            mgr.completeGoal(body.completeGoal);
            await putJSON(env.TUTOR_KV, 'goals', mgr.getAll());
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
          }

          if (body.completeCheckpoint) {
            const mgr = new GoalManager(goals);
            mgr.completeCheckpoint(body.completeCheckpoint.goalId, body.completeCheckpoint.checkpointId);
            await putJSON(env.TUTOR_KV, 'goals', mgr.getAll());
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
          }

          if (body.goal) {
            goals.push(body.goal);
            await putJSON(env.TUTOR_KV, 'goals', goals);
            return new Response(JSON.stringify(body.goal), { status: 201, headers: corsHeaders });
          }

          return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: corsHeaders });
        }
      }

      // ── Quiz Generation ───────────────────────────────────────────────────
      if (path === '/api/quiz') {
        const subject = url.searchParams.get('subject') || 'Algorithms';
        const count = parseInt(url.searchParams.get('count') || '10');

        const mistakes = (await getJSON<Mistake[]>(env.TUTOR_KV, 'mistakes')) || [];
        const sessions = (await getJSON<SessionLog[]>(env.TUTOR_KV, 'sessions')) || [];
        const flashcards = (await getJSON<Flashcard[]>(env.TUTOR_KV, 'flashcards')) || [];

        const generator = new QuizGenerator();
        const quiz = generator.generateQuiz(subject, mistakes, sessions, flashcards, count);
        return new Response(JSON.stringify(quiz), { headers: corsHeaders });
      }

      // ── Learning Insights ─────────────────────────────────────────────────
      if (path === '/api/insights') {
        const profile = await getJSON<StudentProfile>(env.TUTOR_KV, 'student');
        const mistakes = (await getJSON<Mistake[]>(env.TUTOR_KV, 'mistakes')) || [];
        const sessions = (await getJSON<SessionLog[]>(env.TUTOR_KV, 'sessions')) || [];
        const patterns = (await getJSON<any[]>(env.TUTOR_KV, 'patterns')) || [];
        const progress = (await getJSON<ProgressSnapshot[]>(env.TUTOR_KV, 'progress')) || [];

        const engine = new LearningInsights();
        const insights = engine.generate(mistakes, sessions, patterns, progress, profile);
        return new Response(JSON.stringify(insights), { headers: corsHeaders });
      }

      // ── Serve HTML ────────────────────────────────────────────────────────
      if (path === '/' || path === '/index.html') {
        const html = await getHTML();
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
    }
  },
};

// Inline HTML — in production you'd serve from KV or R2
async function getHTML(): Promise<string> {
  // We'll read from the build artifact or embed inline
  // For the single-file approach, the HTML is served directly
  return INDEX_HTML;
}

// This will be replaced at build time with the actual HTML content
declare const INDEX_HTML: string;
