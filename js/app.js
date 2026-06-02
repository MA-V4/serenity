/* ═══════════════════════════════════════════════════════════
   js/app.js - Updated with morphing button + staggered anim
   ═══════════════════════════════════════════════════════════ */

async function handleSubmit() {

  hideError();

  var mood    = getSelectedMood();
  var journal = document.getElementById('journal').value.trim();
  var sleep   = parseInt(document.getElementById('sleep-slider').value);
  var stress  = parseInt(document.getElementById('stress-slider').value);

  if (!mood) {
    showError('Please select a mood above before continuing.');
    return;
  }

  // Morphing button progress
  if (typeof startButtonProgress === 'function') startButtonProgress();

  showLoading();
  startLoadingMessages();

  try {
    var result = await analyseWithClaude(mood, journal, sleep, stress);

    stopLoadingMessages();
    hideLoading();

    if (typeof completeButtonProgress === 'function') completeButtonProgress();

    renderResults(result, stress, sleep);

    if (typeof saveMoodEntry    === 'function') saveMoodEntry(result, stress, sleep, mood);
    if (typeof initFocusTools   === 'function') initFocusTools(result.urgency);
    if (typeof injectShareButton === 'function') injectShareButton();
    if (typeof animateResultsIn  === 'function') animateResultsIn();

    showResults();

  } catch (error) {
    console.error('Serenity error:', error);
    stopLoadingMessages();
    hideLoading();
    showInputCard();
    if (typeof resetButtonProgress === 'function') resetButtonProgress();
    showError('Something went wrong connecting to the AI. Please check your connection and try again.');
  }
}

function handleReset() {
  document.getElementById('journal').value          = '';
  document.getElementById('sleep-slider').value     = 5;
  document.getElementById('stress-slider').value    = 5;
  document.getElementById('sleep-val').textContent  = '5';
  document.getElementById('stress-val').textContent = '5';

  resetMood();

  if (typeof resetButtonProgress === 'function') resetButtonProgress();

  orbInitialised       = false;
  puzzleInitialised    = false;
  groundingInitialised = false;

  document.getElementById('results').classList.remove('visible');
  showInputCard();
  hideError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);
  document.getElementById('reset-btn').addEventListener('click', handleReset);
});
