from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
import torch
import joblib
import pickle
import os

app = Flask(__name__)
CORS(app, origins=["https://chatgpt.com"])

# Load models
tokenizer = AutoTokenizer.from_pretrained("emotion_model")
emotion_model = AutoModelForSequenceClassification.from_pretrained("emotion_model")
emotion_model.eval()
emotion_encoder = joblib.load("emotion_label_encoder.pkl")

intensity_model = AutoModelForSequenceClassification.from_pretrained("intensity_model")
intensity_model.eval()

# Load embedding-based regressors
MODEL_DIR = "./saved_models"
reg_lex = joblib.load(os.path.join(MODEL_DIR, "lex_diversity_regressor.pkl"))
reg_perp = joblib.load(os.path.join(MODEL_DIR, "perplexity_regressor.pkl"))
reg_read = joblib.load(os.path.join(MODEL_DIR, "readability_regressor.pkl"))

def patch_monotonic_cst(regressor):
    if hasattr(regressor, "estimators_"):
        for tree in regressor.estimators_:
            if not hasattr(tree, 'monotonic_cst'):
                tree.monotonic_cst = None

# After loading your regressors
patch_monotonic_cst(reg_lex)
patch_monotonic_cst(reg_perp)
patch_monotonic_cst(reg_read)

embedder = SentenceTransformer("all-MiniLM-L6-v2")

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({"error": "Prompt is empty"}), 400

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, padding=True)

    # Emotion
    with torch.no_grad():
        emotion_logits = emotion_model(**inputs).logits
        probs = torch.nn.functional.softmax(emotion_logits, dim=1)[0]
        emotion_idx = torch.argmax(probs).item()
        emotion_label = emotion_encoder.inverse_transform([emotion_idx])[0]
        emotion_conf = round(probs[emotion_idx].item() * 100, 2)

    # Intensity
    with torch.no_grad():
        intensity_logits = intensity_model(**inputs).logits.squeeze()
        intensity_score = round(intensity_logits.item(), 2)
        intensity_conf = round(torch.sigmoid(intensity_logits).item() * 100, 2)

    # Lexical diversity and perplexity from embedding
    emb = embedder.encode([prompt], convert_to_numpy=True)
    # Raw predictions
    perplexity_raw = float(reg_perp.predict(emb)[0])       # Range: 0–500
    lex_div_raw = float(reg_lex.predict(emb)[0])           # Range: 0–1
    readability_raw = float(reg_read.predict(emb)[0])      # Range: 0–50 (updated)

    # Normalize to percentages
    perplexity_percent = round((perplexity_raw / 500) * 100, 2)
    lex_div_percent = round(lex_div_raw * 100, 2)
    readability_percent = round((readability_raw / 50) * 100, 2)

    # Clamp values (just in case)
    perplexity_percent = min(max(perplexity_percent, 0), 100)
    lex_div_percent = min(max(lex_div_percent, 0), 100)
    readability_percent = min(max(readability_percent, 0), 100)

    return jsonify({
    "emotion": emotion_label,
    "emotion_confidence": round(emotion_conf, 2),        
    "intensity": round(intensity_score, 2),                
    "intensity_confidence": round(intensity_conf, 2),      
    "readability": round(readability_raw, 2),     
    "readability_percent": readability_percent,              
    "lex_diversity": round(lex_div_raw, 2),    
    "lex_div_percent": lex_div_percent,           
    "perplexity": round(perplexity_raw, 2),
    "perplexity_percent": perplexity_percent                 
})

if __name__ == "__main__":
    app.run(debug=True)
