/* ═══════════════════════════════════════════════════════════
   js/ui.js
   All DOM manipulation and rendering lives here.

   Responsibility:
   - Show / hide sections (input card, loading, results)
   - Render the results returned by the API
   - Show / hide error messages
   - Update the slider labels live
   ═══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   SECTION VISIBILITY
────────────────────────────────────────── */

/** Hide the input card and show the loading spinner */
function showLoading() {
  document.getElementById('input-card').style.display = 'none';
  document.getElementById('results').classList.remove('visible');
  document.getElementById('loading').classList.add('visible');
}

/** Hide the loading spinner */
function hideLoading() {
  document.getElementById('loading').classList.remove('visible');
}

/** Show the input card again (used on reset) */
function showInputCard() {
  document.getElementById('input-card').style.display = '';
}

/** Reveal the results section */
function showResults() {
  document.getElementById('results').classList.add('visible');
  // Smoothly scroll the user down to the results
  document.getElementById('results').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

/* ──────────────────────────────────────────
   ERROR HANDLING
────────────────────────────────────────── */

/** Display an error message inside the error box */
function showError(message) {
  var box = document.getElementById('error-box');
  box.textContent = message;
  box.classList.add('visible');
}

/** Hide the error box */
function hideError() {
  document.getElementById('error-box').classList.remove('visible');
}

/* ──────────────────────────────────────────
   LOADING MESSAGE ROTATION
   Cycles through reassuring messages while
   the API call is in progress.
────────────────────────────────────────── */
var loadingMessages = [
  'Listening carefully to how you\'re feeling...',
  'Analysing your emotional landscape...',
  'Finding strategies tailored to you...',
  'Almost ready with your personalised support...'
];

var loadingInterval = null;

/** Start rotating loading messages every 2.5 seconds */
function startLoadingMessages() {
  var index = 0;
  loadingInterval = setInterval(function () {
    index = (index + 1) % loadingMessages.length;
    document.getElementById('loading-msg').textContent = loadingMessages[index];
  }, 2500);
}

/** Stop the message rotation */
function stopLoadingMessages() {
  clearInterval(loadingInterval);
}

/* ──────────────────────────────────────────
   RENDER RESULTS
   Takes the parsed API response object and
   populates every section of the results UI.
────────────────────────────────────────── */

/**
 * Renders all result sections from the AI response.
 *
 * @param {Object} result  - parsed JSON from api.js
 * @param {number} stress  - user's stress slider value
 * @param {number} sleep   - user's sleep slider value
 */
function renderResults(result, stress, sleep) {
  renderUrgencyBanner(result);
  renderEmotionChips(result.emotions);
  renderAffirmation(result.affirmation);
  renderStrategies(result.strategies);
  renderResources(result.urgency, stress, sleep);
}

/** Render the coloured urgency banner at the top of results */
function renderUrgencyBanner(result) {
  var banner = document.getElementById('urgency-banner');

  // Map urgency level to an emoji icon
  var icons = {
    low:      '🌿',
    moderate: '🌤️',
    high:     '🚨'
  };

  // Set the correct colour class (low / moderate / high)
  banner.className = 'urgency-banner fade-up ' + result.urgency;

  // Build the inner HTML
  banner.innerHTML =
    '<span class="urgency-icon">' + (icons[result.urgency] || '💬') + '</span>' +
    '<div class="urgency-text">' +
      '<h3>' + result.urgency_title + '</h3>' +
      '<p>'  + result.urgency_message + '</p>' +
    '</div>';
}

/**
 * Render emotion chips - each emotion gets a coloured pill.
 * We cycle through four colour classes.
 */
function renderEmotionChips(emotions) {
  var chipColors = ['chip-blue', 'chip-amber', 'chip-coral', 'chip-green'];
  var chipRow = document.getElementById('chip-row');

  chipRow.innerHTML = '';

  (emotions || []).forEach(function (emotion, index) {
    var span = document.createElement('span');
    span.className = 'chip ' + chipColors[index % chipColors.length];
    span.textContent = emotion;
    chipRow.appendChild(span);
  });
}

/** Render the personalised affirmation text */
function renderAffirmation(text) {
  document.getElementById('affirmation').textContent = text || '';
}

/** Render the numbered list of coping strategies */
function renderStrategies(strategies) {
  var list = document.getElementById('strategies');
  list.innerHTML = '';

  (strategies || []).forEach(function (strategy, index) {
    // Each item: a numbered dot + the strategy text
    var li   = document.createElement('li');
    li.className = 'strategy-item';

    var dot  = document.createElement('span');
    dot.className   = 'strategy-dot';
    dot.textContent = index + 1;

    var text = document.createElement('span');
    text.textContent = strategy;

    li.appendChild(dot);
    li.appendChild(text);
    list.appendChild(li);
  });
}

/** Render the support resource links */
function renderResources(urgency, stress, sleep) {
  var resources = getResources(urgency, stress, sleep); // from resources.js
  var container = document.getElementById('resources');
  container.innerHTML = '';

  resources.forEach(function (res) {
    var a = document.createElement('a');
    a.className  = 'resource-item';
    a.href       = res.url;
    a.target     = '_blank';           // open in new tab
    a.rel        = 'noopener noreferrer';

    a.innerHTML =
      '<div>' +
        '<div class="resource-name">' + res.name + '</div>' +
        '<div class="resource-sub">'  + res.sub  + '</div>' +
      '</div>' +
      '<span class="resource-arrow">→</span>';

    container.appendChild(a);
  });
}

/* ──────────────────────────────────────────
   SLIDER LIVE LABELS
   Update the number shown next to each slider
   as the user drags it.
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  // Sleep slider → update #sleep-val
  document.getElementById('sleep-slider').addEventListener('input', function () {
    document.getElementById('sleep-val').textContent = this.value;
  });

  // Stress slider → update #stress-val
  document.getElementById('stress-slider').addEventListener('input', function () {
    document.getElementById('stress-val').textContent = this.value;
  });
});

/* ──────────────────────────────────────────
   SLIDER GRADIENT FILL
   Updates the CSS --pct variable so the
   slider track fills with colour as it moves.
────────────────────────────────────────── */
function updateSliderFill(slider) {
  var min = parseFloat(slider.min) || 1;
  var max = parseFloat(slider.max) || 10;
  var val = parseFloat(slider.value);
  var pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--pct', pct);
}

document.addEventListener('DOMContentLoaded', function () {
  var sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(function (s) {
    updateSliderFill(s);
    s.addEventListener('input', function () { updateSliderFill(s); });
  });
});
