import os
import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import textstat
import nltk
nltk.download('punkt', quiet=True)
# sometimes word_tokenize also needs the 'punkt_tab' variant:
nltk.download('punkt_tab', quiet=True)
from nltk.tokenize import word_tokenize
import matplotlib.pyplot as plt

# Ensure NLTK data is available
nltk.download('punkt', quiet=True)

# 1) Perplexity Calculator using GPT-2
class PerplexityCalculator:
    def __init__(self, model_name='gpt2'):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name).to(
            torch.device("cuda" if torch.cuda.is_available() else "cpu")
        )
    def perplexity(self, text):
        enc = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=1024).to(self.model.device)
        with torch.no_grad():
            loss = self.model(**enc, labels=enc['input_ids']).loss
        return torch.exp(loss).item()

# 2) Lexical diversity
def lexical_diversity(text):
    tokens = word_tokenize(text.lower())
    return len(set(tokens)) / len(tokens) if tokens else 0.0

# 3) Evaluate a single file
def evaluate_file(path, pp_calc):
    df = pd.read_csv(path)
    records = []
    for _, row in df.iterrows():
        resp = row['response']
        records.append({
            'intensity': row.get('intensity', None),
            'readability': textstat.flesch_reading_ease(resp),
            'perplexity': pp_calc.perplexity(resp),
            'lex_diversity': lexical_diversity(resp)
        })
    return pd.DataFrame(records)

# 4) Main routine
def main():
    # List your three files here
    files = {
        'anger':   'anger_responses.csv',
        'anxious': 'anxious_responses.csv',
        'sad':     'sad_responses.csv'
    }
    
    # Initialize perplexity calculator
    pp_calc = PerplexityCalculator('gpt2')
    
    # Dictionary to hold metrics per emotion
    metrics = {}
    
    # Evaluate each
    for emo, filepath in files.items():
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            continue
        print(f"▶ Evaluating {filepath}...")
        mdf = evaluate_file(filepath, pp_calc)
        metrics[emo] = mdf
        out_csv = f"{emo}_metrics.csv"
        mdf.to_csv(out_csv, index=False)
        print(f"✔ Saved metrics → {out_csv}")
    
    # 5) Plot average metrics across emotions
    for metric in ['readability', 'perplexity', 'lex_diversity']:
        plt.figure(figsize=(6,4))
        values = [metrics[emo][metric].mean() for emo in metrics]
        plt.bar(metrics.keys(), values)
        plt.xlabel("Emotion")
        plt.ylabel(metric.replace('_',' ').title())
        plt.title(f"Average {metric.replace('_',' ').title()} by Emotion")
        plt.tight_layout()
        filename = f"avg_{metric}.png"
        plt.savefig(filename)
        print(f"📊 Saved plot → {filename}")
        plt.show()

if __name__ == "__main__":
    main()
