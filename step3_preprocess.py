import pandas as pd
import re
import os

# 1. Set base folder and file paths
base_folder = '/Users/rayhwang/Desktop/PromptCoach'
input_path = os.path.join(base_folder, 'merged_labeled.csv')
output_path = os.path.join(base_folder, 'merged_preprocessed.csv')

# 2. Load labeled data
df = pd.read_csv(input_path)

# 3. Define a simple preprocessing function
def preprocess_text(text):
    text = str(text).lower()                          # lowercase
    text = re.sub(r'[^a-z0-9\s]', '', text)           # remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()          # collapse whitespace
    return text

# 4. Apply preprocessing
df['prompt_clean'] = df['prompt'].apply(preprocess_text)

# 5. Save the preprocessed dataset
df.to_csv(output_path, index=False)

# 6. Preview
print(f"Preprocessed data saved to: {output_path}")
print(df[['prompt', 'prompt_clean']].head())
