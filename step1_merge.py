import pandas as pd
import glob
import os


# 1. Set the folders where your CSV files live
base_folder = '/Users/rayhwang/Desktop/PromptCoach'
convos_folder = os.path.join(base_folder, 'convos')
metrics_folder = os.path.join(base_folder, 'results')

# 2. Find all files matching the patterns *_convos.csv and *_metrics.csv
convos_files = glob.glob(os.path.join(convos_folder, '*_convos.csv'))
metrics_files = glob.glob(os.path.join(metrics_folder, '*_metrics.csv'))

# 3. Load each group into a list of DataFrames
convos_list = [pd.read_csv(f) for f in convos_files]
metrics_list = [pd.read_csv(f) for f in metrics_files]

# 4. Concatenate into two master DataFrames
convos_df = pd.concat(convos_list, ignore_index=True)
metrics_df = pd.concat(metrics_list, ignore_index=True)

# 5. Merge side-by-side on index
merged_df = pd.concat(
    [convos_df.reset_index(drop=True), metrics_df.reset_index(drop=True)],
    axis=1
)

# 6. Save the result
output_path = os.path.join(base_folder, 'merged_data.csv')

# 7. Print a preview so you can verify
print(merged_df.head())
