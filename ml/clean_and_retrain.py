"""
Complete Pipeline: Clean Dataset and Retrain Model
Prepares dataset and retrains model.
"""

import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"{description}")
    print(f"{'='*60}")
    print(f"Running: {command}\n")
    
    result = subprocess.run(
        command,
        shell=True,
        cwd=BASE_DIR,
        capture_output=False,
        text=True
    )
    
    if result.returncode != 0:
        print(f"\n❌ Error: {description} failed!")
        return False
    
    print(f"\n✅ {description} completed successfully")
    return True

def main():
    """Main pipeline execution"""
    print("="*60)
    print("BK Pulse - Clean Dataset and Retrain Model Pipeline")
    print("="*60)
    print("\nThis will:")
    print("  1. Clean dataset")
    print("  2. Update preprocessing to use cleaned dataset")
    print("  3. Preprocess data")
    print("  4. Train model")
    print("\n⚠️  This will overwrite existing processed data and models!")
    
    response = input("\nContinue? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("Cancelled.")
        return
    
    # Step 1: Clean dataset
    if not run_command(
        "python ml/clean_dataset.py",
        "Step 1: Cleaning Dataset"
    ):
        print("\n❌ Pipeline failed at dataset cleaning")
        return
    
    # Step 2: Update preprocess.py to use cleaned dataset
    print(f"\n{'='*60}")
    print("Step 2: Updating Preprocessing Script")
    print(f"{'='*60}")
    
    preprocess_file = BASE_DIR / 'ml' / 'preprocess.py'
    with open(preprocess_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_path = "bk_simulated_churn_dataset_clean.csv"
    new_path = "bk_pulse_customer_dataset.csv"
    
    if new_path in content:
        print("✅ Preprocessing script already uses cleaned dataset")
    elif old_path in content:
        content = content.replace(old_path, new_path)
        with open(preprocess_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated preprocessing script to use cleaned dataset")
    else:
        print("⚠️  Could not find dataset path in preprocessing script")
        print("   Please manually update ml/preprocess.py")
    
    # Step 3: Preprocess data
    if not run_command(
        "python ml/preprocess.py",
        "Step 3: Preprocessing Data"
    ):
        print("\n❌ Pipeline failed at preprocessing")
        return
    
    # Step 4: Train model
    if not run_command(
        "python ml/train_model.py",
        "Step 4: Training Model"
    ):
        print("\n❌ Pipeline failed at model training")
        return
    
    # Success
    print("\n" + "="*60)
    print("✅ Pipeline Complete!")
    print("="*60)
    print("\nSummary:")
    print("  ✅ Dataset cleaned")
    print("  ✅ Data preprocessed")
    print("  ✅ Model trained")
    print("\nNext steps:")
    print("  - Check model metrics in data/models/metrics/")
    print("  - Update production model if needed")
    print("  - Test predictions with new model")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Pipeline interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)

