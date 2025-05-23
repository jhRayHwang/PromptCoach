import os, numpy as np, pandas as pd, joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# 1. Load data
base = '/Users/rayhwang/Desktop/PromptCoach/features'
X_train = np.load (os.path.join(base, 'X_train_emb.npy'))
X_test  = np.load (os.path.join(base, 'X_test_emb.npy'))
y_train = pd.read_csv(os.path.join(base, 'y_train.csv')).iloc[:,0]
y_test  = pd.read_csv(os.path.join(base, 'y_test.csv')).iloc[:,0]

# 2. Train
clf = RandomForestClassifier(n_estimators=200, min_samples_leaf=2, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

# 3. Evaluate
y_pred  = clf.predict(X_test)
y_proba = clf.predict_proba(X_test)[:,1]
print(classification_report(y_test, y_pred))
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
print("ROC AUC:", roc_auc_score(y_test, y_proba))

# 4. Save
joblib.dump(clf, os.path.join(base, 'rf_emb_model.joblib'))
print("Saved model to rf_emb_model.joblib")
