import pandas as pd
import os

# 1. Path to your merged data
base_folder = '/Users/rayhwang/Desktop/PromptCoach'
input_path = os.path.join(base_folder, 'merged_data.csv')
output_path = os.path.join(base_folder, 'merged_labeled.csv')

# 2. Read in the merged data
df = pd.read_csv(input_path)

# 3. Compute median thresholds (or pick whatever cutoffs you like)
median_read = df['readability'].median()
median_perp = df['perplexity'].median()
median_lex  = df['lex_diversity'].median()

# 4. Create binary label: 1 if all “good” conditions met, else 0
df['label'] = (
    (df['readability'] >= median_read) &
    (df['perplexity'] <= median_perp) &
    (df['lex_diversity'] >= median_lex)
).astype(int)

# 5. Save out your labeled file
df.to_csv(output_path, index=False)

# 6. Quick confirmation
print(f"Labeled data saved to: {output_path}")
print(df[['readability','perplexity','lex_diversity','label']].head())
