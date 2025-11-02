"""
Complete ML Pipeline Runner
Runs preprocessing and training in sequence
"""

import subprocess
import sys
import os

def run_script(script_name):
    """Run a Python script and handle errors"""
    print(f"\n{'='*60}")
    print(f"Running: {script_name}")
    print('='*60)
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            check=True,
            capture_output=False
        )
        print(f"\n✓ {script_name} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ {script_name} failed with error code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"\n✗ Script not found: {script_name}")
        return False


def main():
    """Run the complete ML pipeline"""
    print("="*60)
    print("BK Pulse - Complete ML Pipeline")
    print("="*60)
    
    scripts = [
        'preprocess.py',
        'train_model.py'
    ]
    
    # Check if we're in the ml directory
    if not os.path.exists('preprocess.py'):
        print("\n⚠ Warning: Scripts not found in current directory.")
        print("Please run this script from the ml/ directory:")
        print("  cd ml")
        print("  python run_pipeline.py")
        sys.exit(1)
    
    # Run scripts in sequence
    for script in scripts:
        success = run_script(script)
        if not success:
            print(f"\n✗ Pipeline stopped at {script}")
            print("Please fix the errors and try again.")
            sys.exit(1)
    
    print("\n" + "="*60)
    print("✓ Complete ML Pipeline Finished Successfully!")
    print("="*60)
    print("\nNext steps:")
    print("  - Review model metrics in data/models/metrics/")
    print("  - Best model saved in data/models/")


if __name__ == '__main__':
    main()

