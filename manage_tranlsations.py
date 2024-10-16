import json
import os
import shutil
from pathlib import Path
import logging
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import ell

# --------------------------------------------------------------------------------
# INSTRUCTIONS:
# 1. BACKUP all translation files:
#    Run: python manage_translations.py backup
#
# 2. RESTORE translation files from backup:
#    Run: python manage_translations.py restore
#
# 3. UPDATE ALL KEYS in the translation files:
#    Run: python manage_translations.py update_all --concurrency 5
#
# 4. UPDATE SPECIFIC KEYS in the translation files:
#    Run: python manage_translations.py update_specific --keys key1 key2 --concurrency 5
#    Example: python manage_translations.py update_specific --keys mainTitle description
#    (You can update multiple keys by passing them as arguments)
#
# OPTIONS:
# --concurrency: Number of concurrent threads (default is 5). This optimizes translation tasks.
# --------------------------------------------------------------------------------

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Paths to the locales directory and backup directory
LOCALES_DIR = Path('/home/runner/workspace/frontend/public/locales')
BACKUP_DIR = Path('/home/runner/workspace/frontend/public/locales_backup')


# ELL translation function with error handling
@ell.simple(model="gpt-4o-mini")
def translate(text, target_language):
    """You are a helpful assistant"""  # System prompt
    return f"Translate {text} into {target_language}!"  # User prompt


# --------------------------------------------------------------------------------
# BACKUP FUNCTION: Creates a backup of all JSON translation files in a separate folder.
# --------------------------------------------------------------------------------
def backup_files():
    """Create a backup of all JSON files in a separate folder."""
    try:
        if not BACKUP_DIR.exists():
            BACKUP_DIR.mkdir(parents=True)

        for file_path in LOCALES_DIR.rglob('*.json'):
            relative_path = file_path.relative_to(LOCALES_DIR)
            backup_file_path = BACKUP_DIR / relative_path
            backup_file_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file_path, backup_file_path)
            logging.info(f"Backed up {file_path} to {backup_file_path}")
    except Exception as e:
        logging.error(f"Error during backup: {e}")


# --------------------------------------------------------------------------------
# RESTORE FUNCTION: Restores all translation files from the backup folder.
# --------------------------------------------------------------------------------
def restore_backup():
    """Restore all JSON files from the backup folder to the original location."""
    try:
        if not BACKUP_DIR.exists():
            logging.error("No backup directory found!")
            return

        for backup_file_path in BACKUP_DIR.rglob('*.json'):
            relative_path = backup_file_path.relative_to(BACKUP_DIR)
            original_file_path = LOCALES_DIR / relative_path
            original_file_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(backup_file_path, original_file_path)
            logging.info(
                f"Restored {backup_file_path} to {original_file_path}")
    except Exception as e:
        logging.error(f"Error during restore: {e}")


# --------------------------------------------------------------------------------
# UTILITY FUNCTIONS: To load and save JSON files.
# --------------------------------------------------------------------------------
def load_json(filepath):
    """Load a JSON file and return its content."""
    try:
        if not filepath.exists():
            return {}
        with filepath.open('r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error loading JSON file {filepath}: {e}")
        return {}


def save_json(filepath, content):
    """Save content to a JSON file."""
    try:
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with filepath.open('w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
    except Exception as e:
        logging.error(f"Error saving JSON file {filepath}: {e}")


# --------------------------------------------------------------------------------
# FUNCTION: Ensures that new JSON files in the English folder are added to all other languages.
# --------------------------------------------------------------------------------
def ensure_file_exists_for_all_languages(en_file):
    """Ensure that if a new JSON file exists in the English folder,
       the corresponding file exists in all other language folders."""
    for lang_dir in LOCALES_DIR.iterdir():
        if lang_dir.is_dir() and lang_dir.name != 'en':
            lang_file = lang_dir / en_file.relative_to(LOCALES_DIR / 'en')
            if not lang_file.exists():
                save_json(lang_file, {})
                logging.info(
                    f"Created new file {lang_file} for language {lang_dir.name}"
                )


# --------------------------------------------------------------------------------
# FUNCTION: Update all keys in the English files and propagate changes to all languages.
# USAGE: Run python manage_translations.py update_all --concurrency 5
# --------------------------------------------------------------------------------
def update_all_keys(concurrency=5):
    """Update all keys in the English files and propagate the changes to all languages."""
    en_dir = LOCALES_DIR / 'en'
    all_languages = [
        d.name for d in LOCALES_DIR.iterdir() if d.is_dir() and d.name != 'en'
    ]

    for en_file in en_dir.rglob('*.json'):
        en_content = load_json(en_file)
        ensure_file_exists_for_all_languages(en_file)

        tasks = []
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            for lang in all_languages:
                lang_file = LOCALES_DIR / lang / en_file.relative_to(en_dir)
                lang_content = load_json(lang_file)

                def update_language():
                    updated = False
                    for key, value in en_content.items():
                        # Check if the English text has changed
                        existing_translation = lang_content.get(key, "")
                        if existing_translation:
                            new_translation = translate(value, lang)
                            if existing_translation != new_translation:
                                lang_content[key] = new_translation
                                updated = True
                        else:
                            lang_content[key] = translate(value, lang)
                            updated = True
                    if updated:
                        save_json(lang_file, lang_content)
                        logging.info(f"Updated all keys in {lang_file}")

                tasks.append(executor.submit(update_language))

            for future in as_completed(tasks):
                try:
                    future.result()
                except Exception as e:
                    logging.error(f"Error updating translations: {e}")


# --------------------------------------------------------------------------------
# FUNCTION: Update specific keys in the English files and propagate changes to all languages.
# USAGE: Run python manage_translations.py update_specific --keys key1 key2 --concurrency 5
# --------------------------------------------------------------------------------
def update_specific_keys(keys_to_update, concurrency=5):
    """Update specific keys in the English files and propagate changes to all languages."""
    en_dir = LOCALES_DIR / 'en'
    all_languages = [
        d.name for d in LOCALES_DIR.iterdir() if d.is_dir() and d.name != 'en'
    ]

    for en_file in en_dir.rglob('*.json'):
        en_content = load_json(en_file)
        ensure_file_exists_for_all_languages(en_file)

        tasks = []
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            for lang in all_languages:
                lang_file = LOCALES_DIR / lang / en_file.relative_to(en_dir)
                lang_content = load_json(lang_file)

                def update_language():
                    updated = False
                    for key in keys_to_update:
                        if key in en_content:
                            value = en_content[key]
                            existing_translation = lang_content.get(key, "")
                            new_translation = translate(value, lang)
                            if existing_translation != new_translation:
                                lang_content[key] = new_translation
                                updated = True
                    if updated:
                        save_json(lang_file, lang_content)
                        logging.info(
                            f"Updated keys {keys_to_update} in {lang_file}")

                tasks.append(executor.submit(update_language))

            for future in as_completed(tasks):
                try:
                    future.result()
                except Exception as e:
                    logging.error(f"Error updating translations: {e}")


# --------------------------------------------------------------------------------
# MAIN FUNCTION: Parses command-line arguments and executes the corresponding action.
# --------------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description='Manage translation files.')
    parser.add_argument(
        'action',
        choices=['backup', 'restore', 'update_all', 'update_specific'],
        help='Action to perform')
    parser.add_argument('--keys', nargs='*', help='Specific keys to update')
    parser.add_argument('--concurrency',
                        type=int,
                        default=5,
                        help='Number of concurrent threads')
    args = parser.parse_args()

    if args.action == 'backup':
        backup_files()
    elif args.action == 'restore':
        restore_backup()
    elif args.action == 'update_all':
        backup_files()  # Backup before update
        update_all_keys(concurrency=args.concurrency)
    elif args.action == 'update_specific':
        if not args.keys:
            logging.error('Please provide keys to update with --keys')
            return
        backup_files()  # Backup before update
        update_specific_keys(args.keys, concurrency=args.concurrency)
    else:
        logging.error(
            "Invalid action. Please choose from 'backup', 'restore', 'update_all', 'update_specific'."
        )


# Entry point of the script
if __name__ == '__main__':
    main()

# Explanation of the Script
# How to run the script:

# Backup all translation files:
# bash
# Copy code
# python manage_translations.py backup
# Restore files from the backup:
# bash
# Copy code
# python manage_translations.py restore
# Update All Keys: Updates all keys in the translation files:
# bash
# Copy code
# python manage_translations.py update_all --concurrency 5
# Update Specific Keys: Updates only specified keys:
# bash
# Copy code
# python manage_translations.py update_specific --keys mainTitle description
# You can specify multiple keys by passing them after --keys.
# Concurrency: The --concurrency flag controls how many concurrent threads will be used for processing translations. This improves performance for large datasets.

# Logging: The script logs important actions and errors using Python's logging module, which allows for better tracking and debugging.
