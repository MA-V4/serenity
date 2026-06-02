/* ═══════════════════════════════════════════════════════════
   js/resources.js
   UK mental health support resources database.

   Responsibility:
   - Store all resource data in one place (easy to update)
   - Expose getResources() which returns the right list
     based on the urgency level and user's stress/sleep scores
   ═══════════════════════════════════════════════════════════ */

/**
 * Returns an array of resource objects tailored to the user.
 *
 * @param {string} urgency  - "low" | "moderate" | "high"
 * @param {number} stress   - 1–10 from the slider
 * @param {number} sleep    - 1–10 from the slider
 * @returns {Array} array of { name, sub, url } objects
 */
function getResources(urgency, stress, sleep) {

  // ── HIGH URGENCY: crisis-first list ──
  // If the AI detects signs of serious distress we lead
  // with crisis lines before anything else.
  if (urgency === 'high') {
    return [
      {
        name: '🚨 Shout Crisis Text Line',
        sub:  'Text HELLO to 85258 - free, 24/7, confidential',
        url:  'https://giveusashout.org'
      },
      {
        name: 'Samaritans',
        sub:  'Call 116 123 - free, 24 hours a day, 365 days a year',
        url:  'https://www.samaritans.org'
      },
      {
        name: 'NHS Mental Health Crisis',
        sub:  'Find your local NHS crisis team',
        url:  'https://www.nhs.uk/service-search/mental-health/'
      },
      {
        name: 'Mind',
        sub:  'Information, support and local services',
        url:  'https://www.mind.org.uk'
      }
    ];
  }

  // ── LOW / MODERATE: build a contextual list ──
  // Start with the core resources everyone gets
  var resources = [
    {
      name: 'Samaritans',
      sub:  'Free, 24/7 emotional support · Call 116 123',
      url:  'https://www.samaritans.org'
    },
    {
      name: 'Mind',
      sub:  'Mental health information & local support finder',
      url:  'https://www.mind.org.uk'
    },
    {
      name: 'NHS Every Mind Matters',
      sub:  'Free personalised mental health action plan',
      url:  'https://www.nhs.uk/every-mind-matters/'
    }
  ];

  // Add sleep resource if sleep score is poor
  if (sleep <= 4) {
    resources.push({
      name: 'Sleepio',
      sub:  'NHS-backed cognitive behavioural therapy for insomnia',
      url:  'https://www.sleepio.com'
    });
  }

  // Add meditation resource if stress is high
  if (stress >= 7) {
    resources.push({
      name: 'Headspace',
      sub:  'Guided meditation, breathing, and stress relief',
      url:  'https://www.headspace.com'
    });
  }

  // CALM is always useful as a final option
  resources.push({
    name: 'CALM',
    sub:  'Campaign Against Living Miserably · 0800 58 58 58',
    url:  'https://www.thecalmzone.net'
  });

  return resources;
}
