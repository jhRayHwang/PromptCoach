from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import joblib

app = Flask(__name__)
CORS(app)

# Load shared tokenizer (assumes both models used the same)
tokenizer = AutoTokenizer.from_pretrained("emotion_model")

# Load models
emotion_model = AutoModelForSequenceClassification.from_pretrained("emotion_model")
emotion_model.eval()
emotion_encoder = joblib.load("emotion_label_encoder.pkl")

intensity_model = AutoModelForSequenceClassification.from_pretrained("intensity_model")
intensity_model.eval()

@app.route("/analyze", methods=["POST"])
def analyze_prompt():
    data = request.get_json()
    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, padding=True)

    # --- Emotion Prediction ---
    with torch.no_grad():
        emotion_logits = emotion_model(**inputs).logits
        emotion_probs = torch.nn.functional.softmax(emotion_logits, dim=1)[0]
        emotion_idx = torch.argmax(emotion_probs).item()
        emotion_label = emotion_encoder.inverse_transform([emotion_idx])[0]
        emotion_conf = round(emotion_probs[emotion_idx].item() * 100, 2)

    # --- Intensity Prediction ---
    with torch.no_grad():
        intensity_logits = intensity_model(**inputs).logits.squeeze()
        intensity_score = round(intensity_logits.item(), 2)
        intensity_conf = round(torch.sigmoid(intensity_logits).item() * 100, 2)

    return jsonify({
        "emotion": emotion_label,
        "emotion_confidence": emotion_conf,
        "intensity": intensity_score,
        "intensity_confidence": intensity_conf
    })

if __name__ == "__main__":
    app.run()