import os
import glob
import re

import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import textstat
import nltk
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

# Ensure the punkt tokenizer is available for BLEU
nltk.download('punkt', quiet=True)

# 1) Setup device & BLEU smoothing
device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
smooth_fn = SmoothingFunction().method1

# 2) Initialize GPT-2 for perplexity
MODEL_NAME = "gpt2"
tokenizer  = AutoTokenizer.from_pretrained(MODEL_NAME)
model      = AutoModelForCausalLM.from_pretrained(MODEL_NAME).to(device)

def compute_perplexity(text: str) -> float:
    enc = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024).to(device)
    with torch.no_grad():
        loss = model(**enc, labels=enc["input_ids"]).loss
    return torch.exp(loss).item()

def lexical_diversity(text: str) -> float:
    tokens = re.findall(r"\w+", text.lower())
    return len(set(tokens)) / len(tokens) if tokens else 0.0

# 3) Main processing loop
def main():
    input_dir  = "convos"
    output_dir = "results"
    os.makedirs(output_dir, exist_ok=True)

    # Process all CSVs in convos/ ending with _convos.csv
    for filepath in glob.glob(os.path.join(input_dir, "*_convos.csv")):
        print(f"▶ Evaluating {filepath}...")
        df = pd.read_csv(filepath)
        records = []

        for _, row in df.iterrows():
            resp = str(row["response"])
            feats = {
                "intensity":     row.get("intensity", None),
                "readability":   textstat.flesch_reading_ease(resp),
                "perplexity":    compute_perplexity(resp),
                "lex_diversity": lexical_diversity(resp),
                "word_count":    len(re.findall(r"\w+", resp)),
            }

            # Optional BLEU if a 'reference' column exists
            if "reference" in df.columns:
                ref = str(row["reference"])
                feats["bleu"] = sentence_bleu(
                    [ref.split()], resp.split(),
                    smoothing_function=smooth_fn
                )
            else:
                feats["bleu"] = None

            records.append(feats)

        # Derive base name and save metrics
        base = os.path.basename(filepath).replace("_convos.csv", "")
        out_path = os.path.join(output_dir, f"{base}_metrics.csv")
        pd.DataFrame(records).to_csv(out_path, index=False)
        print(f"✔ Saved metrics → {out_path}\n")

if __name__ == "__main__":
    main()
