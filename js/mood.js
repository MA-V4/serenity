/* ═══════════════════════════════════════════════════════════
   js/mood.js
   Handles mood button selection.

   Responsibility:
   - Track which mood the user has selected
   - Toggle the .active CSS class on buttons
   - Expose getSelectedMood() so other modules can read it
   ═══════════════════════════════════════════════════════════ */

// This variable holds the currently selected mood string.
// It starts as empty - the user hasn't chosen yet.
let selectedMood = '';

/**
 * Called when a mood button is clicked.
 * Removes .active from all buttons, then adds it to the clicked one.
 *
 * @param {HTMLButtonElement} btn - the button that was clicked
 */
function selectMood(btn) {
  // Remove active class from every mood button
  document.querySelectorAll('.mood-btn').forEach(function (b) {
    b.classList.remove('active');
  });

  // Add active class to the clicked button
  btn.classList.add('active');

  // Store the mood value (from data-mood attribute)
  selectedMood = btn.dataset.mood;
}

/**
 * Returns the currently selected mood.
 * Used by app.js before submitting to the API.
 *
 * @returns {string} e.g. "anxious", "sad", "" (empty if none selected)
 */
function getSelectedMood() {
  return selectedMood;
}

/**
 * Resets the mood selection back to nothing.
 * Called by app.js when the user clicks "Start again".
 */
function resetMood() {
  selectedMood = '';
  document.querySelectorAll('.mood-btn').forEach(function (b) {
    b.classList.remove('active');
  });
}

// ── Wire up click listeners once the DOM is ready ──
// We attach the event listener to each button so clicking
// any mood button calls selectMood() automatically.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.mood-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectMood(btn);
    });
  });
});
