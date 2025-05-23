import os
import pandas as pd
from sklearn.model_selection import train_test_split

# --- Choose which feature route to run ---
USE_TFIDF = False  # set to True to use TF-IDF, False for embeddings

# --- File paths ---
base_folder = '/Users/rayhwang/Desktop/PromptCoach'
input_path = os.path.join(base_folder, 'merged_preprocessed.csv')
output_folder = os.path.join(base_folder, 'features')
os.makedirs(output_folder, exist_ok=True)

# --- Verify input exists ---
if not os.path.isfile(input_path):
    raise FileNotFoundError(f"Cannot find input file: {input_path}")

# --- Load data ---
df = pd.read_csv(input_path)
texts = df['prompt_clean'].astype(str)
labels = df['label']

# --- Train/test split ---
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels,
    test_size=0.2,
    stratify=labels,
    random_state=42
)

if USE_TFIDF:
    from sklearn.feature_extraction.text import TfidfVectorizer
    import joblib

    vect = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
    X_train_vec = vect.fit_transform(X_train)
    X_test_vec = vect.transform(X_test)

    # Save
    joblib.dump(vect, os.path.join(output_folder, 'tfidf_vectorizer.joblib'))
    joblib.dump((X_train_vec, X_test_vec, y_train, y_test),
                os.path.join(output_folder, 'data_tfidf.pkl'))
    print("TF-IDF features saved to", output_folder)

else:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        raise ImportError(
            "The 'sentence-transformers' package is required for embeddings.\n"
            "Please install it with:\n\n    pip install sentence-transformers\n"
        )
    import numpy as np

    model = SentenceTransformer('all-MiniLM-L6-v2')
    X_train_vec = model.encode(X_train.tolist(), show_progress_bar=True)
    X_test_vec = model.encode(X_test.tolist(), show_progress_bar=True)

    # Save
    np.save(os.path.join(output_folder, 'X_train_emb.npy'), X_train_vec)
    np.save(os.path.join(output_folder, 'X_test_emb.npy'), X_test_vec)
    y_train.to_csv(os.path.join(output_folder, 'y_train.csv'), index=False)
    y_test.to_csv(os.path.join(output_folder, 'y_test.csv'), index=False)
    print("Embedding features saved to", output_folder)
