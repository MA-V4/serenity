/* ═══════════════════════════════════════════════════════════
   js/moodTracker.js
   Serenity - Mood History Tracker

   Stores up to 7 check-ins in localStorage (the browser's
   built-in key-value storage). Data never leaves the device -
   nothing is sent to a server.

   Responsibilities:
   - Save a new entry after every AI analysis
   - Render a canvas line chart of stress over time
   - Show a scrollable history list with mood + urgency
   - Calculate summary stats (streak, most common mood, trend)
   - Allow the user to clear all history

   Called by app.js via: saveMoodEntry(result, stress, sleep, mood)
   ═══════════════════════════════════════════════════════════ */

// ── CONSTANTS ───────────────────────────────────────────────
var STORAGE_KEY  = 'serenity_mood_history';
var MAX_ENTRIES  = 7;   // keep last 7 check-ins

// Map each mood to a numeric "wellbeing score" for the chart
// Higher = more positive / lower distress
var MOOD_SCORES = {
  okay:        8,
  hopeful:     9,
  stressed:    4,
  anxious:     3,
  overwhelmed: 2,
  angry:       3,
  sad:         3,
  numb:        2
};

// Urgency also shifts the score
var URGENCY_OFFSET = {
  low:      +1,
  moderate:  0,
  high:     -2
};

// Mood display names and emoji
var MOOD_META = {
  okay:        { label: 'Just okay',   icon: '🙂' },
  hopeful:     { label: 'Hopeful',     icon: '🌱' },
  stressed:    { label: 'Stressed',    icon: '😤' },
  anxious:     { label: 'Anxious',     icon: '😰' },
  overwhelmed: { label: 'Overwhelmed', icon: '🌊' },
  angry:       { label: 'Angry',       icon: '😡' },
  sad:         { label: 'Sad',         icon: '😔' },
  numb:        { label: 'Numb',        icon: '😶' }
};

/* ──────────────────────────────────────────
   STORAGE HELPERS
────────────────────────────────────────── */

/** Load history array from localStorage. Returns [] if none. */
function loadHistory() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/** Save history array to localStorage. */
function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Serenity: could not save to localStorage', e);
  }
}

/* ──────────────────────────────────────────
   PUBLIC API - called by app.js
────────────────────────────────────────── */

/**
 * Save a new mood entry and re-render the tracker.
 * Called immediately after the AI result is rendered.
 *
 * @param {Object} result  - AI response (urgency, emotions, etc.)
 * @param {number} stress  - slider value 1–10
 * @param {number} sleep   - slider value 1–10
 * @param {string} mood    - selected mood string
 */
function saveMoodEntry(result, stress, sleep, mood) {
  var history = loadHistory();

  // Build the entry object
  var entry = {
    id:        Date.now(),
    timestamp: new Date().toISOString(),
    mood:      mood,
    stress:    stress,
    sleep:     sleep,
    urgency:   result.urgency   || 'low',
    emotions:  result.emotions  || [],
    score:     calcScore(mood, result.urgency, stress)
  };

  // Prepend new entry and trim to MAX_ENTRIES
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) {
    history = history.slice(0, MAX_ENTRIES);
  }

  saveHistory(history);

  // Re-render
  renderTracker();
}

/* ──────────────────────────────────────────
   SCORING
────────────────────────────────────────── */

/**
 * Calculate a composite wellbeing score (1–10) for charting.
 * Combines mood baseline + urgency offset + inverted stress.
 */
function calcScore(mood, urgency, stress) {
  var base   = MOOD_SCORES[mood]         || 5;
  var offset = URGENCY_OFFSET[urgency]   || 0;
  // Invert stress (10 stress = -2, 1 stress = +1)
  var stressAdj = Math.round((10 - stress) / 4.5);
  var score = base + offset + stressAdj;
  // Clamp to 1–10
  return Math.max(1, Math.min(10, score));
}

/* ──────────────────────────────────────────
   STATS CALCULATION
────────────────────────────────────────── */

function calcStats(history) {
  if (!history.length) return null;

  // Total check-ins
  var total = history.length;

  // Most common mood
  var moodCounts = {};
  history.forEach(function (e) {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  var commonMood = Object.keys(moodCounts).reduce(function (a, b) {
    return moodCounts[a] >= moodCounts[b] ? a : b;
  });
  var commonMeta = MOOD_META[commonMood] || { icon: '?', label: commonMood };

  // Streak - count consecutive days with at least one entry
  var streak  = 0;
  var today   = new Date();
  today.setHours(0, 0, 0, 0);

  // Build set of unique day strings from history
  var daySet = new Set();
  history.forEach(function (e) {
    var d = new Date(e.timestamp);
    d.setHours(0, 0, 0, 0);
    daySet.add(d.getTime());
  });

  // Walk backwards from today counting consecutive days
  var checkDay = today.getTime();
  while (daySet.has(checkDay)) {
    streak++;
    checkDay -= 86400000; // subtract one day in ms
  }

  // Trend - compare latest score to oldest in history
  var latest = history[0].score;
  var oldest = history[history.length - 1].score;
  var diff   = latest - oldest;
  var trend;
  if (history.length < 2) {
    trend = '-';
  } else if (diff > 1) {
    trend = '↑ Improving';
  } else if (diff < -1) {
    trend = '↓ Declining';
  } else {
    trend = '→ Stable';
  }

  return {
    total:      total,
    streak:     streak,
    commonMood: commonMeta.icon + ' ' + commonMeta.label,
    trend:      trend,
    trendDir:   diff > 1 ? 'up' : diff < -1 ? 'down' : 'flat'
  };
}

/* ──────────────────────────────────────────
   CHART RENDERING (pure Canvas 2D)
────────────────────────────────────────── */

function renderChart(history) {
  var canvas = document.getElementById('tracker-chart');
  var empty  = document.getElementById('tracker-empty');
  if (!canvas) return;

  if (history.length < 2) {
    // Not enough data yet - show empty state
    canvas.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }

  canvas.style.display = 'block';
  if (empty) empty.style.display = 'none';

  var ctx = canvas.getContext('2d');
  var W   = canvas.parentElement.clientWidth || 600;
  var H   = 180;
  canvas.width  = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  // We display oldest → newest left to right
  var data = history.slice().reverse();

  var PAD_L = 40, PAD_R = 20, PAD_T = 20, PAD_B = 36;
  var chartW = W - PAD_L - PAD_R;
  var chartH = H - PAD_T - PAD_B;

  // Helpers
  function xOf(i)     { return PAD_L + (i / (data.length - 1)) * chartW; }
  function yOf(score) { return PAD_T + chartH - ((score - 1) / 9) * chartH; }

  // ── Background horizontal grid lines ──
  ctx.strokeStyle = 'rgba(123,111,160,0.10)';
  ctx.lineWidth   = 1;
  [2, 5, 8].forEach(function (score) {
    var y = yOf(score);
    ctx.beginPath();
    ctx.moveTo(PAD_L, y);
    ctx.lineTo(PAD_L + chartW, y);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = 'rgba(123,111,160,0.50)';
    ctx.font      = '10px Nunito, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(score, PAD_L - 6, y + 4);
  });

  // ── Gradient fill under the line ──
  var gradient = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
  gradient.addColorStop(0,   'rgba(139,123,173,0.30)');
  gradient.addColorStop(0.5, 'rgba(106,158,132,0.15)');
  gradient.addColorStop(1,   'rgba(139,123,173,0.02)');

  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(data[0].score));
  for (var i = 1; i < data.length; i++) {
    // Smooth bezier curve through points
    var x0 = xOf(i - 1), y0 = yOf(data[i - 1].score);
    var x1 = xOf(i),     y1 = yOf(data[i].score);
    var cpx = (x0 + x1) / 2;
    ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
  }
  // Close path down to baseline
  ctx.lineTo(xOf(data.length - 1), PAD_T + chartH);
  ctx.lineTo(xOf(0), PAD_T + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // ── Main line ──
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(data[0].score));
  for (var j = 1; j < data.length; j++) {
    var ax = xOf(j - 1), ay = yOf(data[j - 1].score);
    var bx = xOf(j),     by = yOf(data[j].score);
    var cpx2 = (ax + bx) / 2;
    ctx.bezierCurveTo(cpx2, ay, cpx2, by, bx, by);
  }
  ctx.strokeStyle = 'rgba(139,123,173,0.85)';
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.stroke();

  // ── Data point dots ──
  data.forEach(function (entry, i) {
    var x = xOf(i);
    var y = yOf(entry.score);

    // Urgency colour
    var dotColor = entry.urgency === 'high'
      ? '#C9956E'
      : entry.urgency === 'moderate'
      ? '#8BAF9A'
      : '#8B7BAD';

    // Outer glow
    var glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
    glow.addColorStop(0,   dotColor.replace(')', ',0.25)').replace('rgb', 'rgba'));
    glow.addColorStop(1,   'rgba(139,123,173,0)');
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();

    // White centre
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // X-axis date label
    var d     = new Date(entry.timestamp);
    var label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    ctx.fillStyle  = 'rgba(123,111,160,0.55)';
    ctx.font       = '10px Nunito, sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText(label, x, PAD_T + chartH + 20);

    // Mood emoji above dot
    ctx.font      = '13px serif';
    ctx.textAlign = 'center';
    var meta = MOOD_META[entry.mood];
    if (meta) ctx.fillText(meta.icon, x, y - 13);
  });
}

/* ──────────────────────────────────────────
   HISTORY LIST RENDERING
────────────────────────────────────────── */

function renderList(history) {
  var container = document.getElementById('tracker-list');
  if (!container) return;

  if (!history.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = history.map(function (entry, index) {
    var meta      = MOOD_META[entry.mood] || { icon: '?', label: entry.mood };
    var date      = new Date(entry.timestamp);
    var dateStr   = date.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });

    var urgencyClass = 'urgency-pip-' + entry.urgency;
    var scoreBar     = Math.round((entry.score / 10) * 100);

    var emotionChips = (entry.emotions || []).slice(0, 3).map(function (e) {
      return '<span class="tracker-chip">' + e + '</span>';
    }).join('');

    // Only show "Latest" badge on first entry
    var latestBadge = index === 0
      ? '<span class="tracker-latest-badge">Latest</span>'
      : '';

    return (
      '<div class="tracker-entry">' +
        '<div class="tracker-entry-left">' +
          '<span class="tracker-mood-icon">' + meta.icon + '</span>' +
          '<div class="tracker-entry-info">' +
            '<div class="tracker-entry-top">' +
              '<span class="tracker-mood-name">' + meta.label + '</span>' +
              latestBadge +
              '<span class="tracker-urgency-pip ' + urgencyClass + '">' + entry.urgency + '</span>' +
            '</div>' +
            '<span class="tracker-date">' + dateStr + '</span>' +
            '<div class="tracker-chips">' + emotionChips + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tracker-entry-right">' +
          '<div class="tracker-score-label">Wellbeing</div>' +
          '<div class="tracker-score-bar-wrap">' +
            '<div class="tracker-score-bar" style="width:' + scoreBar + '%"></div>' +
          '</div>' +
          '<div class="tracker-score-num">' + entry.score + '/10</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* ──────────────────────────────────────────
   STATS RENDERING
────────────────────────────────────────── */

function renderStats(stats) {
  if (!stats) return;

  var checkins = document.getElementById('stat-checkins');
  var streak   = document.getElementById('stat-streak');
  var common   = document.getElementById('stat-common');
  var trend    = document.getElementById('stat-trend');

  if (checkins) checkins.textContent = stats.total;
  if (streak)   streak.textContent   = stats.streak + (stats.streak === 1 ? ' day' : ' days');
  if (common)   common.textContent   = stats.commonMood;
  if (trend) {
    trend.textContent  = stats.trend;
    trend.className    = 'tracker-stat-value trend-' + stats.trendDir;
  }
}

/* ──────────────────────────────────────────
   MAIN RENDER FUNCTION
────────────────────────────────────────── */

function renderTracker() {
  var history = loadHistory();
  var stats   = calcStats(history);

  renderStats(stats);
  renderChart(history);
  renderList(history);
}

/* ──────────────────────────────────────────
   EVENT LISTENERS
────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {

  // Clear history button
  var clearBtn = document.getElementById('tracker-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (confirm('Clear all mood history? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        renderTracker();
      }
    });
  }

  // Re-render chart if window is resized (responsive)
  window.addEventListener('resize', function () {
    var history = loadHistory();
    renderChart(history);
  });

  // Render existing history on page load
  // (shows data from previous sessions immediately)
  renderTracker();
});
