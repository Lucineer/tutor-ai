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


function getLandingHTML(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>tutor-ai</title><meta http-equiv="refresh" content="0;url=/app"><style>body{background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style><body><p>Redirecting...</p></body></html>`;
}

function getAppHTML(): string {
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Tutor AI — Your Personal Learning Companion</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\n:root{--bg:#0F172A;--surface:#1E293B;--surface2:#334155;--border:#475569;--text:#E2E8F0;--text2:#94A3B8;--green:#10B981;--green-bg:rgba(16,185,129,.15);--amber:#F59E0B;--amber-bg:rgba(245,158,11,.15);--red:#EF4444;--red-bg:rgba(239,68,68,.15);--blue:#3B82F6;--blue-bg:rgba(59,130,246,.15);--purple:#8B5CF6;--purple-bg:rgba(139,92,246,.15)}\nbody{font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}\n.app{display:flex;height:100vh}\n.sidebar{width:220px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:16px 0;flex-shrink:0}\n.sidebar h1{padding:0 20px 20px;font-size:20px;font-weight:700;background:linear-gradient(135deg,var(--green),var(--blue));-webkit-background-clip:text;-webkit-text-fill-color:transparent}\n.sidebar nav{flex:1;display:flex;flex-direction:column;gap:2px}\n.nav-item{padding:10px 20px;cursor:pointer;color:var(--text2);font-size:14px;transition:all .15s;display:flex;align-items:center;gap:10px;border-left:3px solid transparent}\n.nav-item:hover{background:var(--surface2);color:var(--text)}\n.nav-item.active{background:var(--surface2);color:var(--green);border-left-color:var(--green);font-weight:600}\n.nav-item .icon{width:18px;text-align:center;font-size:15px}\n.main{flex:1;overflow-y:auto;padding:24px 32px}\n.tab{display:none}.tab.active{display:block}\nh2{font-size:24px;font-weight:700;margin-bottom:20px}\nh3{font-size:16px;font-weight:600;margin-bottom:12px;color:var(--text2)}\n.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}\n.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}\n.stat-card .label{font-size:12px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}\n.stat-card .value{font-size:28px;font-weight:700}\n.stat-card .sub{font-size:12px;color:var(--text2);margin-top:4px}\n.stat-card.green .value{color:var(--green)}\n.stat-card.amber .value{color:var(--amber)}\n.stat-card.red .value{color:var(--red)}\n.stat-card.blue .value{color:var(--blue)}\n.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}\n.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}\n.radar-chart{width:100%;max-width:400px;aspect-ratio:1;margin:0 auto 24px}\n.progress-bar{height:8px;background:var(--surface2);border-radius:4px;overflow:hidden;margin-top:8px}\n.progress-fill{height:100%;border-radius:4px;transition:width .5s}\n.progress-fill.green{background:var(--green)}\n.progress-fill.amber{background:var(--amber)}\n.progress-fill.red{background:var(--red)}\n.progress-fill.blue{background:var(--blue)}\ntable{width:100%;border-collapse:collapse}\nth,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--border);font-size:13px}\nth{color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px}\n.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}\n.badge.green{background:var(--green-bg);color:var(--green)}\n.badge.red{background:var(--red-bg);color:var(--red)}\n.badge.amber{background:var(--amber-bg);color:var(--amber)}\n.badge.blue{background:var(--blue-bg);color:var(--blue)}\n.badge.purple{background:var(--purple-bg);color:var(--purple)}\n.btn{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s}\n.btn.primary{background:var(--green);color:#fff}\n.btn.primary:hover{filter:brightness(1.1)}\n.btn.secondary{background:var(--surface2);color:var(--text);border:1px solid var(--border)}\n.btn.secondary:hover{background:var(--border)}\n.btn.danger{background:var(--red);color:#fff}\n.quiz-container{max-width:700px}\n.quiz-question{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:16px}\n.quiz-question h4{margin-bottom:16px;font-size:15px}\n.quiz-option{display:block;width:100%;text-align:left;padding:12px 16px;margin-bottom:8px;background:var(--surface2);border:2px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer;font-size:14px;transition:all .15s}\n.quiz-option:hover{border-color:var(--green);background:var(--green-bg)}\n.quiz-option.correct{border-color:var(--green);background:var(--green-bg);color:var(--green)}\n.quiz-option.wrong{border-color:var(--red);background:var(--red-bg);color:var(--red)}\n.quiz-option:disabled{cursor:default;opacity:.8}\n.explanation{background:var(--surface2);border-radius:8px;padding:12px 16px;margin-top:12px;font-size:13px;line-height:1.6}\n.flashcard-container{display:flex;flex-direction:column;align-items:center;max-width:500px;margin:0 auto}\n.flashcard{width:100%;min-height:250px;background:var(--surface);border:2px solid var(--border);border-radius:16px;display:flex;align-items:center;justify-content:center;padding:32px;cursor:pointer;font-size:18px;text-align:center;line-height:1.6;transition:transform .3s;user-select:none;position:relative}\n.flashcard:hover{border-color:var(--green)}\n.flashcard.flipped{border-color:var(--green);background:var(--green-bg)}\n.flashcard-hint{position:absolute;bottom:12px;font-size:12px;color:var(--text2)}\n.fc-controls{display:flex;gap:12px;margin-top:20px}\n.fc-controls .btn{min-width:100px}\n.chat-container{display:flex;flex-direction:column;height:calc(100vh - 120px)}\n.chat-messages{flex:1;overflow-y:auto;padding-bottom:16px;display:flex;flex-direction:column;gap:12px}\n.chat-msg{max-width:80%;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.6;white-space:pre-wrap}\n.chat-msg.tutor{background:var(--surface);border:1px solid var(--border);align-self:flex-start;border-bottom-left-radius:4px}\n.chat-msg.student{background:var(--blue-bg);border:1px solid var(--blue);align-self:flex-end;border-bottom-right-radius:4px}\n.chat-input-row{display:flex;gap:8px;margin-top:12px}\n.chat-input-row input{flex:1;padding:12px 16px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:14px;outline:none}\n.chat-input-row input:focus{border-color:var(--green)}\n.insight-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:12px}\n.insight-card .insight-title{font-weight:600;margin-bottom:6px}\n.insight-card .insight-desc{font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:8px}\n.insight-card .insight-action{font-size:12px;color:var(--green);font-style:italic}\n.goal-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}\n.goal-title{font-size:16px;font-weight:600;margin-bottom:4px}\n.goal-desc{font-size:13px;color:var(--text2);margin-bottom:12px}\n.checkpoint{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13px}\n.checkpoint .check{width:18px;height:18px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}\n.checkpoint .check.done{background:var(--green);border-color:var(--green)}\n.checkpoint .check.done::after{content:\'✓\';color:#fff;font-size:11px}\n.week-chart{display:flex;align-items:flex-end;gap:8px;height:120px;padding:16px 0}\n.week-bar{flex:1;background:var(--green);border-radius:4px 4px 0 0;min-width:30px;position:relative;transition:height .5s}\n.week-label{text-align:center;font-size:11px;color:var(--text2);margin-top:8px}\n.week-value{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--text2)}\n.loading{text-align:center;padding:40px;color:var(--text2)}\n.empty-state{text-align:center;padding:60px 20px;color:var(--text2)}\n.empty-state .icon{font-size:48px;margin-bottom:16px}\n.mastery-list{display:flex;flex-direction:column;gap:10px}\n.mastery-item{display:flex;align-items:center;gap:12px}\n.mastery-item .subject{width:140px;font-size:13px;font-weight:500}\n.mastery-item .bar{flex:1}\n.mastery-item .pct{width:40px;text-align:right;font-size:13px;font-weight:600}\n@media(max-width:768px){\n.sidebar{width:60px}\n.sidebar h1,.nav-item span{display:none}\n.nav-item{justify-content:center;padding:12px}\n.main{padding:16px}\n}\n</style>\n</head>\n<body>\n<div class="app">\n<aside class="sidebar">\n<h1>Tutor AI</h1>\n<nav id="nav">\n<div class="nav-item active" data-tab="dashboard"><span class="icon">📊</span><span>Dashboard</span></div>\n<div class="nav-item" data-tab="study"><span class="icon">📝</span><span>Study</span></div>\n<div class="nav-item" data-tab="flashcards"><span class="icon">🃏</span><span>Flashcards</span></div>\n<div class="nav-item" data-tab="mistakes"><span class="icon">❌</span><span>Mistakes</span></div>\n<div class="nav-item" data-tab="progress"><span class="icon">📈</span><span>Progress</span></div>\n<div class="nav-item" data-tab="goals"><span class="icon">🎯</span><span>Goals</span></div>\n<div class="nav-item" data-tab="insights"><span class="icon">💡</span><span>Insights</span></div>\n<div class="nav-item" data-tab="chat"><span class="icon">💬</span><span>Chat</span></div>\n</nav>\n</aside>\n<main class="main">\n\n<!-- DASHBOARD -->\n<div class="tab active" id="tab-dashboard">\n<h2>Welcome back, Alex</h2>\n<div class="stats-row" id="dash-stats"></div>\n<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">\n<div class="card">\n<h3>Subject Mastery</h3>\n<div id="mastery-list" class="mastery-list"></div>\n</div>\n<div class="card">\n<h3>Study Time This Week</h3>\n<div id="week-chart" class="week-chart"></div>\n</div>\n</div>\n<div class="card">\n<h3>Due for Review</h3>\n<div id="due-cards"></div>\n</div>\n<div class="card">\n<h3>Recent Sessions</h3>\n<table><thead><tr><th>Date</th><th>Topic</th><th>Score</th><th>Duration</th></tr></thead><tbody id="recent-sessions"></tbody></table>\n</div>\n</div>\n\n<!-- STUDY -->\n<div class="tab" id="tab-study">\n<h2>Study Session</h2>\n<div style="margin-bottom:16px;display:flex;gap:8px">\n<button class="btn primary" onclick="startQuiz(\'Algorithms\')">Generate Quiz — Algorithms</button>\n<button class="btn secondary" onclick="startQuiz(\'Data Structures\')">Data Structures Quiz</button>\n</div>\n<div id="quiz-area" class="quiz-container"></div>\n</div>\n\n<!-- FLASHCARDS -->\n<div class="tab" id="tab-flashcards">\n<h2>Flashcards</h2>\n<div class="stats-row" id="fc-stats"></div>\n<div class="flashcard-container" id="fc-area">\n<div class="flashcard" id="fc-card" onclick="flipCard()">\n<div id="fc-content">Loading...</div>\n<div class="flashcard-hint">Click to flip</div>\n</div>\n<div class="fc-controls">\n<button class="btn danger" onclick="rateCard(1)">Again</button>\n<button class="btn secondary" onclick="rateCard(3)">Hard</button>\n<button class="btn secondary" onclick="rateCard(4)">Good</button>\n<button class="btn primary" onclick="rateCard(5)">Easy</button>\n</div>\n</div>\n</div>\n\n<!-- MISTAKES -->\n<div class="tab" id="tab-mistakes">\n<h2>Mistake Log</h2>\n<div class="stats-row" id="mistake-stats"></div>\n<h3>Identified Patterns</h3>\n<div id="patterns-list"></div>\n<h3 style="margin-top:24px">All Mistakes</h3>\n<table><thead><tr><th>Date</th><th>Topic</th><th>What Went Wrong</th><th>Misconception</th></tr></thead><tbody id="mistake-table"></tbody></table>\n</div>\n\n<!-- PROGRESS -->\n<div class="tab" id="tab-progress">\n<h2>Progress</h2>\n<div class="stats-row" id="progress-stats"></div>\n<div class="card">\n<h3>Mastery Over Time</h3>\n<div id="progress-chart" style="height:200px;position:relative"></div>\n</div>\n<div class="card">\n<h3>Improvement by Topic</h3>\n<div id="improvement-list"></div>\n</div>\n</div>\n\n<!-- GOALS -->\n<div class="tab" id="tab-goals">\n<h2>Learning Goals</h2>\n<div id="goals-list"></div>\n</div>\n\n<!-- INSIGHTS -->\n<div class="tab" id="tab-insights">\n<h2>Learning Insights</h2>\n<div id="insights-list"></div>\n</div>\n\n<!-- CHAT -->\n<div class="tab" id="tab-chat">\n<h2>Tutor Chat</h2>\n<div class="chat-container">\n<div class="chat-messages" id="chat-messages">\n<div class="chat-msg tutor">Hey Alex! I\'ve been tracking your progress for a while now. I can see you\'ve been putting in solid work — your streak is impressive. What would you like to work on today? I remember we were making good progress on graph algorithms last time.</div>\n</div>\n<div class="chat-input-row">\n<input type="text" id="chat-input" placeholder="Ask your tutor anything..." onkeydown="if(event.key===\'Enter\')sendChat()">\n<button class="btn primary" onclick="sendChat()">Send</button>\n</div>\n</div>\n</div>\n\n</main>\n</div>\n\n<script>\nconst API = \'\';\nlet state = { student:null, sessions:[], mistakes:[], flashcards:[], progress:[], goals:[], patterns:[], insights:[], quiz:[], chatHistory:[] };\n\n// ─── Navigation ─────────────────────────────────────────────────────────────\ndocument.querySelectorAll(\'.nav-item\').forEach(el => {\n  el.addEventListener(\'click\', () => {\n    document.querySelectorAll(\'.nav-item\').forEach(n => n.classList.remove(\'active\'));\n    document.querySelectorAll(\'.tab\').forEach(t => t.classList.remove(\'active\'));\n    el.classList.add(\'active\');\n    document.getElementById(\'tab-\' + el.dataset.tab).classList.add(\'active\');\n    loadTab(el.dataset.tab);\n  });\n});\n\nfunction loadTab(tab) {\n  switch(tab) {\n    case \'dashboard\': renderDashboard(); break;\n    case \'study\': break;\n    case \'flashcards\': renderFlashcards(); break;\n    case \'mistakes\': renderMistakes(); break;\n    case \'progress\': renderProgress(); break;\n    case \'goals\': renderGoals(); break;\n    case \'insights\': loadInsights(); break;\n  }\n}\n\n// ─── Data Loading ────────────────────────────────────────────────────────────\nasync function loadAll() {\n  const [student, sessions, mistakes, flashcards, progress, goals, patterns] = await Promise.all([\n    fetch(API+\'/api/student\').then(r=>r.json()).catch(()=>null),\n    fetch(API+\'/api/sessions\').then(r=>r.json()).catch(()=>[]),\n    fetch(API+\'/api/mistakes\').then(r=>r.json()).catch(()=>[]),\n    fetch(API+\'/api/flashcards\').then(r=>r.json()).catch(()=>[]),\n    fetch(API+\'/api/progress\').then(r=>r.json()).catch(()=>[]),\n    fetch(API+\'/api/goals\').then(r=>r.json()).catch(()=>[]),\n    fetch(API+\'/api/insights\').then(r=>r.json()).catch(()=>[]),\n  ]);\n  state = { ...state, student, sessions, mistakes, flashcards, progress, goals, patterns };\n  renderDashboard();\n}\n\n// ─── Dashboard ───────────────────────────────────────────────────────────────\nfunction renderDashboard() {\n  const sessions = state.sessions;\n  const mistakes = state.mistakes;\n  const cards = state.flashcards;\n  const progress = state.progress;\n\n  const streak = computeStreak(sessions);\n  const totalHours = Math.round(sessions.reduce((s,x)=>s+x.durationMinutes,0)/60);\n  const weeklyMin = computeWeeklyMin(sessions);\n  const dueCards = cards.filter(c => c.nextReview <= new Date().toISOString().split(\'T\')[0]);\n  const latestProgress = progress[progress.length - 1];\n  const accuracy = sessions.length > 0\n    ? Math.round(sessions.reduce((s,x)=>s+x.problemsSolved,0)/sessions.reduce((s,x)=>s+x.problemsAttempted,0)*100)\n    : 0;\n\n  document.getElementById(\'dash-stats\').innerHTML = `\n    <div class="stat-card amber"><div class="label">Current Streak</div><div class="value">${streak} days</div><div class="sub">Keep it up!</div></div>\n    <div class="stat-card green"><div class="label">Total Study Time</div><div class="value">${totalHours}h</div><div class="sub">${weeklyMin} min this week</div></div>\n    <div class="stat-card blue"><div class="label">Accuracy Rate</div><div class="value">${accuracy}%</div><div class="sub">Across all sessions</div></div>\n    <div class="stat-card red"><div class="label">Cards Due</div><div class="value">${dueCards.length}</div><div class="sub">${cards.length} total cards</div></div>\n  `;\n\n  // Mastery list\n  if (latestProgress) {\n    const masteries = latestProgress.subjectMasteries;\n    document.getElementById(\'mastery-list\').innerHTML = Object.entries(masteries)\n      .sort(([,a],[,b])=>b-a)\n      .map(([subj,val]) => `\n        <div class="mastery-item">\n          <div class="subject">${subj.replace(/-/g,\' \')}</div>\n          <div class="bar"><div class="progress-bar"><div class="progress-fill ${val>70?\'green\':val>40?\'amber\':\'red\'}" style="width:${val}%"></div></div></div>\n          <div class="pct" style="color:${val>70?\'var(--green)\':val>40?\'var(--amber)\':\'var(--red)\'}">${Math.round(val)}%</div>\n        </div>\n      `).join(\'\');\n  }\n\n  // Week chart\n  const days = [\'Mon\',\'Tue\',\'Wed\',\'Thu\',\'Fri\',\'Sat\',\'Sun\'];\n  const weekData = days.map(() => Math.round(20 + Math.random() * 40));\n  const maxVal = Math.max(...weekData);\n  document.getElementById(\'week-chart\').innerHTML = weekData.map((v,i) =>\n    `<div style="flex:1;text-align:center"><div class="week-bar" style="height:${(v/maxVal)*100}px;background:var(--green)"><div class="week-value">${v}m</div></div><div class="week-label">${days[i]}</div></div>`\n  ).join(\'\');\n\n  // Due cards\n  document.getElementById(\'due-cards\').innerHTML = dueCards.length > 0\n    ? `<p style="color:var(--text2);font-size:14px">${dueCards.length} cards due for review. <a href="#" onclick="document.querySelector(\'[data-tab=flashcards]\').click();return false" style="color:var(--green)">Review now →</a></p>`\n    : \'<p style="color:var(--text2);font-size:14px">All caught up! No cards due right now.</p>\';\n\n  // Recent sessions\n  const recent = [...sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);\n  document.getElementById(\'recent-sessions\').innerHTML = recent.map(s => `\n    <tr><td>${s.date}</td><td>${s.topic.replace(/-/g,\' \')}</td>\n    <td><span class="badge ${s.score>=70?\'green\':s.score>=50?\'amber\':\'red\'}">${s.score}%</span></td>\n    <td>${s.durationMinutes}m</td></tr>\n  `).join(\'\');\n}\n\nfunction computeStreak(sessions) {\n  if (!sessions.length) return 0;\n  const dates = [...new Set(sessions.map(s=>s.date))].sort().reverse();\n  let streak = 1;\n  for (let i = 1; i < dates.length; i++) {\n    const diff = (new Date(dates[i-1]) - new Date(dates[i])) / 86400000;\n    if (diff <= 1.5) streak++; else break;\n  }\n  return streak;\n}\n\nfunction computeWeeklyMin(sessions) {\n  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);\n  return sessions.filter(s => new Date(s.date) >= cutoff).reduce((s,x)=>s+x.durationMinutes, 0);\n}\n\n// ─── Study / Quiz ────────────────────────────────────────────────────────────\nasync function startQuiz(subject) {\n  const area = document.getElementById(\'quiz-area\');\n  area.innerHTML = \'<div class="loading">Generating quiz based on your weak areas...</div>\';\n  try {\n    const res = await fetch(`${API}/api/quiz?subject=${encodeURIComponent(subject)}&count=10`);\n    state.quiz = await res.json();\n    renderQuiz();\n  } catch(e) {\n    area.innerHTML = \'<div class="card"><p>Could not load quiz. Make sure the worker is running.</p></div>\';\n  }\n}\n\nfunction renderQuiz() {\n  const area = document.getElementById(\'quiz-area\');\n  if (!state.quiz.length) { area.innerHTML = \'<div class="empty-state"><div class="icon">📝</div><p>No quiz loaded yet</p></div>\'; return; }\n\n  area.innerHTML = state.quiz.map((q, qi) => `\n    <div class="quiz-question" id="qq-${qi}">\n      <div style="display:flex;justify-content:space-between;margin-bottom:12px">\n        <span class="badge blue">${q.topic.replace(/-/g,\' \')}</span>\n        <span class="badge ${q.difficulty===\'hard\'?\'red\':q.difficulty===\'medium\'?\'amber\':\'green\'}">${q.difficulty}</span>\n      </div>\n      <h4>${q.question}</h4>\n      ${q.options.map((opt, oi) => `\n        <button class="quiz-option" id="qo-${qi}-${oi}" onclick="answerQuiz(${qi},${oi})">${opt}</button>\n      `).join(\'\')}\n      <div id="qe-${qi}" style="display:none"></div>\n    </div>\n  `).join(\'\');\n}\n\nfunction answerQuiz(qi, oi) {\n  const q = state.quiz[qi];\n  if (q.answered) return;\n  q.answered = true;\n\n  const correct = oi === q.correctIndex;\n  q.options.forEach((_, i) => {\n    const btn = document.getElementById(`qo-${qi}-${i}`);\n    btn.disabled = true;\n    if (i === q.correctIndex) btn.classList.add(\'correct\');\n    if (i === oi && !correct) btn.classList.add(\'wrong\');\n  });\n\n  document.getElementById(`qe-${qi}`).style.display = \'block\';\n  document.getElementById(`qe-${qi}`).innerHTML = `\n    <div class="explanation">\n      <strong>${correct ? \'✓ Correct!\' : \'✗ Not quite.\'}</strong> ${q.explanation}\n      ${q.basedOnMistakes ? \'<br><em style="color:var(--amber)">This question was generated from your past mistakes.</em>\' : \'\'}\n    </div>\n  `;\n}\n\n// ─── Flashcards ──────────────────────────────────────────────────────────────\nlet currentFC = null;\nlet fcFlipped = false;\n\nfunction renderFlashcards() {\n  const cards = state.flashcards;\n  const due = cards.filter(c => c.nextReview <= new Date().toISOString().split(\'T\')[0]);\n  document.getElementById(\'fc-stats\').innerHTML = `\n    <div class="stat-card green"><div class="label">Total Cards</div><div class="value">${cards.length}</div></div>\n    <div class="stat-card amber"><div class="label">Due for Review</div><div class="value">${due.length}</div></div>\n    <div class="stat-card blue"><div class="label">Mature</div><div class="value">${cards.filter(c=>c.interval>=21).length}</div></div>\n    <div class="stat-card"><div class="label">Learning</div><div class="value">${cards.filter(c=>c.interval<21).length}</div></div>\n  `;\n  showNextCard();\n}\n\nfunction showNextCard() {\n  const due = state.flashcards.filter(c => c.nextReview <= new Date().toISOString().split(\'T\')[0]);\n  if (!due.length) {\n    document.getElementById(\'fc-content\').textContent = \'All cards reviewed! Come back later.\';\n    document.getElementById(\'fc-card\').className = \'flashcard\';\n    currentFC = null;\n    return;\n  }\n  currentFC = due[0];\n  fcFlipped = false;\n  document.getElementById(\'fc-content\').textContent = currentFC.front;\n  document.getElementById(\'fc-card\').className = \'flashcard\';\n  document.querySelector(\'.flashcard-hint\').textContent = \'Click to flip\';\n}\n\nfunction flipCard() {\n  if (!currentFC) return;\n  fcFlipped = !fcFlipped;\n  document.getElementById(\'fc-content\').textContent = fcFlipped ? currentFC.back : currentFC.front;\n  document.getElementById(\'fc-card\').className = fcFlipped ? \'flashcard flipped\' : \'flashcard\';\n  document.querySelector(\'.flashcard-hint\').textContent = fcFlipped ? \'Rate your recall\' : \'Click to flip\';\n}\n\nasync function rateCard(quality) {\n  if (!currentFC) return;\n  try {\n    await fetch(API+\'/api/flashcards\', {\n      method:\'POST\',\n      headers:{\'Content-Type\':\'application/json\'},\n      body:JSON.stringify({review:{cardId:currentFC.id, quality}})\n    });\n    state.flashcards = state.flashcards.filter(c=>c.id!==currentFC.id);\n    const card = state.flashcards.find(c=>c.id===currentFC.id);\n    if (card) {\n      const sr = {cards: state.flashcards};\n      // Local update for instant feedback\n    }\n  } catch(e) {}\n  showNextCard();\n}\n\n// ─── Mistakes ────────────────────────────────────────────────────────────────\nfunction renderMistakes() {\n  const mistakes = state.mistakes;\n  const patterns = state.patterns;\n  const topicCount = {};\n  mistakes.forEach(m => { topicCount[m.topic] = (topicCount[m.topic]||0)+1; });\n\n  document.getElementById(\'mistake-stats\').innerHTML = `\n    <div class="stat-card red"><div class="label">Total Mistakes</div><div class="value">${mistakes.length}</div></div>\n    <div class="stat-card amber"><div class="label">Patterns Found</div><div class="value">${patterns.length}</div></div>\n    <div class="stat-card"><div class="label">Topics Affected</div><div class="value">${Object.keys(topicCount).length}</div></div>\n    <div class="stat-card"><div class="label">Weakest Topic</div><div class="value" style="font-size:16px">${Object.entries(topicCount).sort(([,a],[,b])=>b-a)[0]?.[0]?.replace(/-/g,\' \')||\'None\'}</div></div>\n  `;\n\n  document.getElementById(\'patterns-list\').innerHTML = patterns.map(p => `\n    <div class="card">\n      <div style="display:flex;justify-content:space-between;align-items:center">\n        <div><strong>${p.name}</strong><br><span style="font-size:13px;color:var(--text2)">${p.description}</span></div>\n        <span class="badge red">${p.occurrences}x</span>\n      </div>\n    </div>\n  `).join(\'\') || \'<p style="color:var(--text2)">No patterns detected yet.</p>\';\n\n  const sorted = [...mistakes].sort((a,b)=>b.date.localeCompare(a.date));\n  document.getElementById(\'mistake-table\').innerHTML = sorted.map(m => `\n    <tr>\n      <td>${m.date}</td>\n      <td><span class="badge blue">${m.topic.replace(/-/g,\' \')}</span></td>\n      <td>${m.question.slice(0,60)}${m.question.length>60?\'...\':\'\'}</td>\n      <td style="color:var(--red)">${m.misconception.slice(0,50)}...</td>\n    </tr>\n  `).join(\'\');\n}\n\n// ─── Progress ────────────────────────────────────────────────────────────────\nfunction renderProgress() {\n  const progress = state.progress;\n  const latest = progress[progress.length - 1];\n  if (!latest) return;\n\n  document.getElementById(\'progress-stats\').innerHTML = `\n    <div class="stat-card green"><div class="label">Total Study Hours</div><div class="value">${latest.totalStudyHours}h</div></div>\n    <div class="stat-card blue"><div class="label">Problems Solved</div><div class="value">${latest.problemsSolved}</div></div>\n    <div class="stat-card amber"><div class="label">Overall Accuracy</div><div class="value">${Math.round(latest.accuracyRate*100)}%</div></div>\n    <div class="stat-card"><div class="label">Weekly Hours</div><div class="value">${latest.weeklyStudyHours}h</div></div>\n  `;\n\n  // Simple SVG chart\n  const subjects = Object.keys(latest.subjectMasteries);\n  const colors = [\'#10B981\',\'#3B82F6\',\'#8B5CF6\',\'#F59E0B\',\'#EF4444\',\'#EC4899\',\'#06B6D4\',\'#84CC16\'];\n  const chartW = 600, chartH = 180, pad = 40;\n  const xScale = (i) => pad + (i / (progress.length - 1)) * (chartW - pad * 2);\n  const yScale = (v) => chartH - pad - (v / 100) * (chartH - pad * 2);\n\n  let paths = \'\';\n  subjects.forEach((subj, si) => {\n    const pts = progress.map((p, i) => `${xScale(i)},${yScale(p.subjectMasteries[subj]||0)}`).join(\' \');\n    paths += `<polyline points="${pts}" fill="none" stroke="${colors[si%colors.length]}" stroke-width="2"/>`;\n  });\n\n  const legend = subjects.map((s,i) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:12px"><span style="width:10px;height:10px;border-radius:50%;background:${colors[i%colors.length]}"></span>${s.replace(/-/g,\' \')}</span>`).join(\'\');\n\n  document.getElementById(\'progress-chart\').innerHTML = `\n    <svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:100%">\n      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${chartH-pad}" stroke="#475569" stroke-width="1"/>\n      <line x1="${pad}" y1="${chartH-pad}" x2="${chartW-pad}" y2="${chartH-pad}" stroke="#475569" stroke-width="1"/>\n      <text x="10" y="${pad+4}" fill="#94A3B8" font-size="10">100</text>\n      <text x="10" y="${chartH-pad}" fill="#94A3B8" font-size="10">0</text>\n      ${paths}\n    </svg>\n    <div style="margin-top:8px">${legend}</div>\n  `;\n\n  // Improvement list\n  if (progress.length >= 2) {\n    const first = progress[0], last = progress[progress.length-1];\n    document.getElementById(\'improvement-list\').innerHTML = subjects.map(s => {\n      const diff = Math.round((last.subjectMasteries[s]||0) - (first.subjectMasteries[s]||0));\n      return `<div class="mastery-item">\n        <div class="subject">${s.replace(/-/g,\' \')}</div>\n        <div style="flex:1;font-size:13px;font-weight:600;color:${diff>0?\'var(--green)\':\'var(--red)\'}">${diff>0?\'+\':\'\'}${diff}%</div>\n      </div>`;\n    }).join(\'\');\n  }\n}\n\n// ─── Goals ───────────────────────────────────────────────────────────────────\nfunction renderGoals() {\n  const goals = state.goals;\n  document.getElementById(\'goals-list\').innerHTML = goals.map(g => {\n    const done = g.checkpoints.filter(c=>c.completed).length;\n    const total = g.checkpoints.length;\n    const pct = Math.round(done/total*100);\n    return `\n      <div class="goal-card">\n        <div class="card-header">\n          <div>\n            <div class="goal-title">${g.title}</div>\n            <div class="goal-desc">${g.description}</div>\n          </div>\n          <span class="badge ${pct===100?\'green\':pct>50?\'amber\':\'red\'}">${pct}%</span>\n        </div>\n        <div class="progress-bar" style="margin-bottom:12px"><div class="progress-fill ${pct===100?\'green\':pct>50?\'amber\':\'red\'}" style="width:${pct}%"></div></div>\n        ${g.checkpoints.map(c => `\n          <div class="checkpoint">\n            <div class="check ${c.completed?\'done\':\'\'}"></div>\n            <span style="color:${c.completed?\'var(--text2)\':\'var(--text)\'};${c.completed?\'text-decoration:line-through\':\'\'}">${c.title}</span>\n          </div>\n        `).join(\'\')}\n      </div>\n    `;\n  }).join(\'\');\n}\n\n// ─── Insights ────────────────────────────────────────────────────────────────\nasync function loadInsights() {\n  try {\n    const res = await fetch(API+\'/api/insights\');\n    state.insights = await res.json();\n  } catch(e) {\n    state.insights = [];\n  }\n  renderInsights();\n}\n\nfunction renderInsights() {\n  const insights = state.insights;\n  if (!insights.length) {\n    document.getElementById(\'insights-list\').innerHTML = \'<div class="empty-state"><div class="icon">💡</div><p>Insights are generated from your learning data. Keep studying!</p></div>\';\n    return;\n  }\n  const typeColors = {pattern:\'amber\',trend:\'green\',achievement:\'blue\',warning:\'red\',comparison:\'purple\'};\n  document.getElementById(\'insights-list\').innerHTML = insights.map(i => `\n    <div class="insight-card">\n      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">\n        <div class="insight-title">${i.title}</div>\n        <span class="badge ${typeColors[i.type]||\'blue\'}">${i.type}</span>\n      </div>\n      <div class="insight-desc">${i.description}</div>\n      <div class="insight-action">→ ${i.actionable}</div>\n    </div>\n  `).join(\'\');\n}\n\n// ─── Chat ────────────────────────────────────────────────────────────────────\nasync function sendChat() {\n  const input = document.getElementById(\'chat-input\');\n  const msg = input.value.trim();\n  if (!msg) return;\n  input.value = \'\';\n\n  const msgs = document.getElementById(\'chat-messages\');\n  msgs.innerHTML += `<div class="chat-msg student">${escapeHtml(msg)}</div>`;\n  msgs.scrollTop = msgs.scrollHeight;\n\n  const thinking = document.createElement(\'div\');\n  thinking.className = \'chat-msg tutor\';\n  thinking.textContent = \'Thinking...\';\n  msgs.appendChild(thinking);\n  msgs.scrollTop = msgs.scrollHeight;\n\n  state.chatHistory.push({role:\'user\',content:msg});\n\n  try {\n    const res = await fetch(API+\'/api/chat\', {\n      method:\'POST\',\n      headers:{\'Content-Type\':\'application/json\'},\n      body:JSON.stringify({message:msg, history:state.chatHistory.slice(-10)})\n    });\n\n    if (!res.ok) throw new Error(\'API error\');\n\n    thinking.textContent = \'\';\n    const reader = res.body.getReader();\n    const decoder = new TextDecoder();\n    let buffer = \'\';\n\n    while (true) {\n      const {done, value} = await reader.read();\n      if (done) break;\n      buffer += decoder.decode(value, {stream:true});\n      const lines = buffer.split(\'\\n\');\n      buffer = lines.pop() || \'\';\n      for (const line of lines) {\n        if (line.startsWith(\'data: \')) {\n          const data = line.slice(6);\n          if (data === \'[DONE]\') continue;\n          try {\n            const json = JSON.parse(data);\n            const content = json.choices?.[0]?.delta?.content;\n            if (content) {\n              thinking.textContent += content;\n              msgs.scrollTop = msgs.scrollHeight;\n            }\n          } catch(e) {}\n        }\n      }\n    }\n\n    state.chatHistory.push({role:\'assistant\',content:thinking.textContent});\n  } catch(e) {\n    thinking.textContent = \'Sorry, I couldn\\\'t connect to the tutor. Make sure the worker is running with a valid DEEPSEEK_API_KEY.\';\n  }\n}\n\nfunction escapeHtml(text) {\n  const div = document.createElement(\'div\');\n  div.textContent = text;\n  return div.innerHTML;\n}\n\n// ─── Init ────────────────────────────────────────────────────────────────────\nloadAll();\n</script>\n</body>\n</html>\n';
}

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
  return getAppHTML();
}

// This will be replaced at build time with the actual HTML content
