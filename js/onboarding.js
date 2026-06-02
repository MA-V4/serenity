/* ═══════════════════════════════════════════════════════════
   js/onboarding.js
   First-visit onboarding - 3 step intro that captures the
   user's name, reason for visiting, and one wellness goal.
   Stored in localStorage. Personalises the AI prompt.
   ═══════════════════════════════════════════════════════════ */

var ONBOARDING_KEY = 'serenity_user_profile';

/**
 * Returns the saved user profile or null if not onboarded yet.
 */
function getUserProfile() {
  try {
    var raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function saveUserProfile(profile) {
  try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(profile)); } catch(e) {}
}

/**
 * Injects the onboarding overlay into the DOM and returns a
 * Promise that resolves with the profile when complete.
 */
function runOnboarding() {
  return new Promise(function(resolve) {

    var overlay = document.createElement('div');
    overlay.id  = 'onboarding-overlay';
    overlay.innerHTML = `
      <div class="ob-backdrop"></div>
      <div class="ob-card" id="ob-card">

        <!-- Step 1: Name -->
        <div class="ob-step active" id="ob-step-1">
          <div class="ob-icon">🌿</div>
          <h2 class="ob-title">Welcome to Serenity</h2>
          <p class="ob-sub">A safe space to check in with yourself.<br>Let's personalise your experience.</p>
          <div class="ob-field">
            <label class="ob-label">What should we call you?</label>
            <input class="ob-input" id="ob-name" type="text" placeholder="Your first name" maxlength="30" autocomplete="off" />
          </div>
          <button class="ob-btn" id="ob-next-1">Continue →</button>
          <p class="ob-skip" id="ob-skip">Skip personalisation</p>
        </div>

        <!-- Step 2: Reason -->
        <div class="ob-step" id="ob-step-2">
          <div class="ob-icon">💭</div>
          <h2 class="ob-title">What brings you here?</h2>
          <p class="ob-sub">This helps us give you more relevant support.</p>
          <div class="ob-reasons">
            <button class="ob-reason-btn" data-reason="stress">😤 Managing stress</button>
            <button class="ob-reason-btn" data-reason="anxiety">😰 Anxiety & worry</button>
            <button class="ob-reason-btn" data-reason="mood">😔 Low mood</button>
            <button class="ob-reason-btn" data-reason="sleep">😴 Sleep problems</button>
            <button class="ob-reason-btn" data-reason="overwhelm">🌊 Feeling overwhelmed</button>
            <button class="ob-reason-btn" data-reason="general">🌱 General wellbeing</button>
          </div>
          <button class="ob-btn" id="ob-next-2" disabled>Continue →</button>
        </div>

        <!-- Step 3: Goal -->
        <div class="ob-step" id="ob-step-3">
          <div class="ob-icon">✦</div>
          <h2 class="ob-title">One small goal</h2>
          <p class="ob-sub">What's one thing you'd like to feel better about?</p>
          <div class="ob-field">
            <textarea class="ob-textarea" id="ob-goal" placeholder="e.g. I want to feel less anxious before work..." maxlength="120"></textarea>
            <span class="ob-char-count"><span id="ob-chars">0</span>/120</span>
          </div>
          <button class="ob-btn" id="ob-next-3">Let's begin ✓</button>
        </div>

        <!-- Progress dots -->
        <div class="ob-dots">
          <span class="ob-dot active" data-step="1"></span>
          <span class="ob-dot" data-step="2"></span>
          <span class="ob-dot" data-step="3"></span>
        </div>

      </div>
    `;
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(function() {
      overlay.classList.add('visible');
    });

    var profile    = { name: '', reason: '', goal: '' };
    var currentStep = 1;

    function goToStep(n) {
      document.querySelectorAll('.ob-step').forEach(function(s) {
        s.classList.remove('active', 'exit');
      });
      document.querySelectorAll('.ob-dot').forEach(function(d) {
        d.classList.toggle('active', parseInt(d.dataset.step) === n);
        d.classList.toggle('complete', parseInt(d.dataset.step) < n);
      });

      var next = document.getElementById('ob-step-' + n);
      if (next) {
        next.classList.add('active');
        // Focus first input
        var inp = next.querySelector('input, textarea');
        if (inp) setTimeout(function() { inp.focus(); }, 350);
      }
      currentStep = n;
    }

    // Step 1 - name
    document.getElementById('ob-next-1').addEventListener('click', function() {
      var name = document.getElementById('ob-name').value.trim();
      profile.name = name || 'Friend';
      goToStep(2);
    });

    document.getElementById('ob-name').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('ob-next-1').click();
    });

    // Step 2 - reason
    var selectedReason = '';
    document.querySelectorAll('.ob-reason-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ob-reason-btn').forEach(function(b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        selectedReason = btn.dataset.reason;
        profile.reason = selectedReason;
        document.getElementById('ob-next-2').disabled = false;
      });
    });

    document.getElementById('ob-next-2').addEventListener('click', function() {
      if (!selectedReason) return;
      goToStep(3);
    });

    // Step 3 - goal
    var goalInput = document.getElementById('ob-goal');
    goalInput.addEventListener('input', function() {
      document.getElementById('ob-chars').textContent = goalInput.value.length;
    });

    document.getElementById('ob-next-3').addEventListener('click', function() {
      profile.goal = goalInput.value.trim();
      finish(profile);
    });

    // Skip
    document.getElementById('ob-skip').addEventListener('click', function() {
      profile = { name: 'Friend', reason: 'general', goal: '' };
      finish(profile);
    });

    function finish(p) {
      saveUserProfile(p);
      overlay.classList.remove('visible');
      overlay.classList.add('hiding');
      setTimeout(function() {
        overlay.remove();
        resolve(p);
      }, 500);
    }
  });
}

/**
 * Greets the user by name in the hero section if they've onboarded.
 */
function applyProfileToUI(profile) {
  if (!profile || profile.name === 'Friend') return;

  // Update hero heading
  var h1 = document.querySelector('.hero h1');
  if (h1) {
    h1.innerHTML = 'How are you feeling, <em>' + profile.name + '?</em>';
  }
}

// ── Init on DOMContentLoaded ────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
  var profile = getUserProfile();

  if (!profile) {
    // First visit - run onboarding
    profile = await runOnboarding();
  }

  applyProfileToUI(profile);
});
