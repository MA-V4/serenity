/* ═══════════════════════════════════════════════════════════
   js/enhancements.js
   Serenity - UI Enhancement Pack

   1. Morphing submit button (progress bar during API call)
   2. Staggered result card spring animations
   3. Dark / light mode toggle with localStorage persistence
   4. Affirmation share card (Canvas → PNG download)
   5. Confetti burst on grounding completion
   ═══════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════
   1. MORPHING SUBMIT BUTTON
   ══════════════════════════════════════════════════════════ */

var progressInterval = null;
var currentProgress  = 0;

function startButtonProgress() {
  var btn = document.getElementById('submit-btn');
  if (!btn) return;

  btn.classList.add('btn-loading');
  btn.disabled    = true;
  currentProgress = 0;

  // Simulate progress - fast at first, slows near 90%
  progressInterval = setInterval(function() {
    if (currentProgress < 30)       currentProgress += 4;
    else if (currentProgress < 60)  currentProgress += 2;
    else if (currentProgress < 85)  currentProgress += 0.8;
    else if (currentProgress < 92)  currentProgress += 0.2;

    btn.style.setProperty('--progress', currentProgress + '%');
    btn.querySelector('.btn-progress-text').textContent =
      Math.round(currentProgress) + '%';
  }, 80);
}

function completeButtonProgress() {
  clearInterval(progressInterval);
  var btn = document.getElementById('submit-btn');
  if (!btn) return;

  // Shoot to 100% then reset
  currentProgress = 100;
  btn.style.setProperty('--progress', '100%');
  btn.querySelector('.btn-progress-text').textContent = '100%';

  setTimeout(function() {
    btn.classList.remove('btn-loading');
    btn.style.setProperty('--progress', '0%');
    btn.disabled = false;
  }, 600);
}

function resetButtonProgress() {
  clearInterval(progressInterval);
  var btn = document.getElementById('submit-btn');
  if (!btn) return;
  btn.classList.remove('btn-loading');
  btn.style.setProperty('--progress', '0%');
  btn.disabled = false;
}

// Upgrade the submit button HTML on load
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('submit-btn');
  if (!btn) return;

  btn.innerHTML =
    '<span class="btn-default-text">Analyse my wellbeing</span>' +
    '<span class="btn-progress-text" style="display:none">0%</span>' +
    '<div class="btn-progress-bar"></div>';
});


/* ══════════════════════════════════════════════════════════
   2. STAGGERED RESULT ANIMATIONS
   ══════════════════════════════════════════════════════════ */

function animateResultsIn() {
  var sections = [
    '#urgency-banner',
    '.result-grid .card:first-child',
    '.result-grid .card:last-child',
    '#results .card:nth-child(3)',
    '#results .card:nth-child(4)',
    '#mood-tracker',
    '#focus-tools',
    '.btn-secondary'
  ];

  sections.forEach(function(selector, i) {
    var el = document.querySelector(selector);
    if (!el) return;

    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'none';

    setTimeout(function() {
      el.style.transition = 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, 120 + i * 90);
  });
}


/* ══════════════════════════════════════════════════════════
   3. DARK / LIGHT MODE TOGGLE
   ══════════════════════════════════════════════════════════ */

var THEME_KEY = 'serenity_theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  var btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title       = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function toggleTheme() {
  var current = getTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Inject toggle button into header
document.addEventListener('DOMContentLoaded', function() {
  var header = document.querySelector('header');
  if (!header) return;

  var btn      = document.createElement('button');
  btn.id       = 'theme-toggle';
  btn.className = 'theme-toggle-btn';
  btn.addEventListener('click', toggleTheme);
  header.appendChild(btn);

  applyTheme(getTheme());
});


/* ══════════════════════════════════════════════════════════
   4. AFFIRMATION SHARE CARD
   Canvas API renders a branded PNG the user can download
   or share on social media.
   ══════════════════════════════════════════════════════════ */

function generateShareCard(affirmationText) {
  var W = 1080, H = 1080;
  var canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  var ctx = canvas.getContext('2d');

  // Background gradient
  var grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,   '#1E1A2E');
  grad.addColorStop(0.5, '#1A2E24');
  grad.addColorStop(1,   '#2E1A18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative orb top-right
  var orb = ctx.createRadialGradient(850, 150, 0, 850, 150, 280);
  orb.addColorStop(0,   'rgba(139,123,173,0.35)');
  orb.addColorStop(0.5, 'rgba(106,158,132,0.18)');
  orb.addColorStop(1,   'rgba(139,123,173,0)');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(850, 150, 280, 0, Math.PI * 2);
  ctx.fill();

  // Orb bottom-left
  var orb2 = ctx.createRadialGradient(180, 900, 0, 180, 900, 220);
  orb2.addColorStop(0,   'rgba(106,158,132,0.30)');
  orb2.addColorStop(1,   'rgba(106,158,132,0)');
  ctx.fillStyle = orb2;
  ctx.beginPath();
  ctx.arc(180, 900, 220, 0, Math.PI * 2);
  ctx.fill();

  // Logo leaf shape
  ctx.save();
  ctx.translate(100, 100);
  ctx.beginPath();
  // Simple leaf using bezier
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(22, -22, 22, 22, 0, 22);
  ctx.bezierCurveTo(-22, 22, -22, -22, 0, -22);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#8B7BAD';
  ctx.fill();
  ctx.restore();

  // Brand name
  ctx.font       = 'bold 38px Georgia, serif';
  ctx.fillStyle  = '#C4B5D8';
  ctx.textAlign  = 'left';
  ctx.fillText('Serenity', 136, 108);

  // Decorative line
  ctx.beginPath();
  ctx.moveTo(100, 160);
  ctx.lineTo(W - 100, 160);
  ctx.strokeStyle = 'rgba(196,181,216,0.15)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Quote mark
  ctx.font      = '180px Georgia, serif';
  ctx.fillStyle = 'rgba(139,123,173,0.12)';
  ctx.textAlign = 'left';
  ctx.fillText('"', 88, 380);

  // Affirmation text - word wrap
  ctx.font      = 'italic 52px Georgia, serif';
  ctx.fillStyle = '#EDE8F5';
  ctx.textAlign = 'center';

  var maxW    = W - 200;
  var lineH   = 72;
  var words   = affirmationText.split(' ');
  var lines   = [];
  var line    = '';

  words.forEach(function(word) {
    var test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  var totalH  = lines.length * lineH;
  var startY  = (H - totalH) / 2 + 30;

  lines.forEach(function(l, i) {
    ctx.fillText(l, W / 2, startY + i * lineH);
  });

  // Bottom rule
  ctx.beginPath();
  ctx.moveTo(100, H - 160);
  ctx.lineTo(W - 100, H - 160);
  ctx.strokeStyle = 'rgba(196,181,216,0.15)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Footer
  ctx.font      = '28px Georgia, serif';
  ctx.fillStyle = 'rgba(196,181,216,0.45)';
  ctx.textAlign = 'center';
  ctx.fillText('serenity-app.vercel.app', W / 2, H - 100);

  // Download
  var link    = document.createElement('a');
  link.download = 'serenity-affirmation.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Injects a share button below the affirmation box.
 * Called from ui.js after results render.
 */
function injectShareButton() {
  var affBox = document.getElementById('affirmation');
  if (!affBox) return;

  // Remove old button if re-rendering
  var old = document.getElementById('share-affirmation-btn');
  if (old) old.remove();

  var btn      = document.createElement('button');
  btn.id       = 'share-affirmation-btn';
  btn.className = 'share-btn';
  btn.innerHTML = '⬇ Save as image';
  btn.addEventListener('click', function() {
    var text = affBox.textContent.trim();
    if (text) generateShareCard(text);
  });

  affBox.parentElement.appendChild(btn);
}


/* ══════════════════════════════════════════════════════════
   5. CONFETTI BURST on grounding completion
   Uses canvas-confetti from CDN (loaded in index.html)
   ══════════════════════════════════════════════════════════ */

function fireConfetti() {
  if (typeof confetti === 'undefined') return;

  // Three burst waves
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#8B7BAD', '#6A9E84', '#C4B5D8', '#C9956E', '#E8B4C0']
  });

  setTimeout(function() {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#8B7BAD', '#6A9E84', '#C4B5D8']
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#C9956E', '#E8B4C0', '#8B7BAD']
    });
  }, 250);
}

// Hook into grounding completion - patch goToGroundingStep
document.addEventListener('DOMContentLoaded', function() {
  var _original = window.goToGroundingStep;
  window.goToGroundingStep = function(step) {
    if (typeof _original === 'function') _original(step);
    if (step === 'done') {
      setTimeout(fireConfetti, 400);
    }
  };
});
