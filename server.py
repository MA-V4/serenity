from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY")
)

MODEL = "openrouter/auto"

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/breathe')
def breathe():
    return send_from_directory('.', 'breathe.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/analyse', methods=['POST'])
def analyse():

    data    = request.get_json()
    mood    = data.get('mood', '')
    journal = data.get('journal', '')
    sleep   = data.get('sleep', 5)
    stress  = data.get('stress', 5)

    # Onboarding profile (optional, sent from frontend)
    name   = data.get('name', '')
    reason = data.get('reason', '')
    goal   = data.get('goal', '')

    journal_line = (
        f'Personal note: "{journal}"'
        if journal
        else '(No personal notes added)'
    )

    profile_line = ''
    if name and name != 'Friend':
        profile_line += f"User's name: {name}. "
    if reason:
        profile_line += f"Main concern: {reason}. "
    if goal:
        profile_line += f"Personal goal: {goal}."

    name_ref = f', address {name} by name' if name and name != 'Friend' else ''
    goal_ref = f'\n- Reference their goal ("{goal}") naturally in strategies if relevant' if goal else ''

    prompt = f"""You are a compassionate mental wellness AI assistant.
{"ABOUT THIS USER: " + profile_line if profile_line else ""}

USER DATA:
- Selected mood: {mood}
- Sleep quality: {sleep}/10
- Stress level: {stress}/10
- {journal_line}

TASK:
Respond with ONLY valid JSON - no markdown, no code fences.

{{
  "urgency": "low | moderate | high",
  "urgency_title": "short empathetic title",
  "urgency_message": "1 warm sentence{name_ref}",
  "emotions": ["3 to 5 detected emotion words"],
  "affirmation": "1-2 supportive sentences{name_ref}",
  "strategies": ["5 specific coping strategies tailored to this person"]
}}

Rules:
- urgency HIGH only if explicit crisis or self-harm signs
- urgency MODERATE if clearly struggling but not in crisis
- urgency LOW for mild distress
- Warm, non-clinical, British English{goal_ref}
"""

    try:
        print(f"Sending to {MODEL}...")
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        print("Success")
        raw_text   = response.choices[0].message.content
        clean_text = raw_text.replace('```json', '').replace('```', '').strip()
        result     = json.loads(clean_text)
        return jsonify(result)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print(f"\n🌿 Serenity server running on http://localhost:5000")
    print(f"   Model: {MODEL}\n")
    app.run(debug=True, port=5000)
