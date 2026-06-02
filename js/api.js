/* ═══════════════════════════════════════════════════════════
   js/api.js  Updated to send onboarding profile
   ═══════════════════════════════════════════════════════════ */

var API_URL = '/api/analyse';

async function analyseWithClaude(mood, journal, sleep, stress) {

  // Read saved onboarding profile from localStorage
  var profile = {};
  try {
    var raw = localStorage.getItem('serenity_user_profile');
    if (raw) profile = JSON.parse(raw);
  } catch(e) {}

  var response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood:    mood,
      journal: journal,
      sleep:   sleep,
      stress:  stress,
      name:    profile.name   || '',
      reason:  profile.reason || '',
      goal:    profile.goal   || ''
    })
  });

  if (!response.ok) throw new Error('Server error: ' + response.status);

  var result = await response.json();
  if (result.error) throw new Error(result.error);

  return result;
}
