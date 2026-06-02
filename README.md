# Serenity - AI Mental Wellness Companion

> A web application prototype built for COMP60037: Web & Artificial Intelligence  
> Demonstrates real-world AI integration using the Claude API (Anthropic)

---

## What it does

Serenity is an AI-powered mental wellness check-in tool. The user:

1. Selects their current mood from 8 options
2. Optionally writes a short journal entry
3. Rates their sleep quality and stress level (1–10 sliders)
4. Clicks **Analyse my wellbeing**

The app sends this data to the Claude AI API, which returns:

- **Urgency triage** - low / moderate / high (with crisis resources if needed)
- **Detected emotions** - displayed as colour-coded chips
- **Personalised affirmation** - a warm, tailored message
- **5 coping strategies** - specific to the user's situation
- **UK support resources** - contextually selected based on urgency, stress, and sleep scores

---

## File structure

```
serenity/
│
├── index.html          ← Main HTML page (all sections live here)
│
├── css/
│   └── style.css       ← All styling: variables, layout, components, dark mode
│
├── js/
│   ├── resources.js    ← UK mental health resource database + selection logic
│   ├── ui.js           ← All DOM manipulation: show/hide sections, render results
│   ├── mood.js         ← Mood button selection and state
│   ├── api.js          ← Claude API call + prompt engineering + JSON parsing
│   └── app.js          ← Main controller: wires submit/reset buttons together
│
└── README.md           ← This file
```

---

## How to run it

**No installation required.** This is a pure HTML/CSS/JavaScript project.

1. Download or clone the project folder
2. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari)
3. The app runs entirely in the browser - no server needed

> **Note:** The Claude API call requires an internet connection.

---

## Technologies used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and semantic markup |
| CSS3 | Styling, CSS custom properties (variables), dark mode, animations |
| Vanilla JavaScript (ES2017+) | UI logic, event handling, async/await API calls |
| baidu/cobuddy (OpenRouter) | AI analysis - sentiment, triage, strategy generation |
| Google Fonts | DM Serif Display + DM Sans typography |
| Fetch API | Browser-native HTTP requests to the AI endpoint |

---

## How the AI integration works

The core AI call is in `js/api.js`. Here's the flow:

```
User fills in form
       ↓
app.js collects: mood + journal + sleep + stress
       ↓
api.js builds a structured prompt using prompt engineering
       ↓
fetch() sends POST request to https://api.openrouter.com/v1/messages
       ↓
Baidu returns a JSON object with urgency, emotions, affirmation, strategies
       ↓
ui.js renders each field into the correct section of the page
```

### Prompt engineering

The prompt in `api.js` uses several techniques to get reliable, structured output:

- **Role assignment** - "You are a compassionate mental wellness AI assistant"
- **Structured input** - user data is clearly labelled with bullet points
- **Output specification** - Claude is told to return raw JSON with exact key names
- **Safety rules** - urgency levels are defined precisely to avoid over-triggering "high"
- **Tone guidance** - "warm, human, non-clinical, British English"

---

## AI impact on users

- **Personalisation at scale** - every user gets a unique, contextual response rather than static content
- **Immediate access** - 24/7 support triage without waiting for a human
- **Reduced stigma** - users may feel more comfortable disclosing to an AI first
- **Crisis safety net** - urgency detection surfaces crisis resources when needed

## AI impact on developers

- **Replaces hundreds of if/else rules** - sentiment analysis, triage logic, and strategy generation are all handled by one API call
- **Natural language output** - no need to maintain a content database of coping strategies
- **Rapid iteration** - changing the prompt changes the app's behaviour without touching logic code

---

## Ethical considerations

- This tool is **not a medical device** and should not replace professional support
- The disclaimer is displayed prominently on every page load
- Crisis resources (Samaritans, Shout) are always surfaced for high-urgency responses
- No user data is stored - inputs are sent to the API and discarded

---

## Submission

- **Module:** COMP60037 Web & Artificial Intelligence
- **Assignment:** 3 - Prototype demonstration
- **Assessed LOs:** 3, 4, 5
- ** PLEASE CREATE YOUR OWN .env FILE AND USE YOUR OWN API KEY TO GET THE APP TO FUNCTION **