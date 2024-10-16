import json
import os
import shutil
from pathlib import Path
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import ell

# --------------------------------------------------------------------------------
# INSTRUCTIONS:
# 1. Backup translation files: Choose option 1 from the menu.
# 2. Restore translation files: Choose option 2 from the menu.
# 3. Update all keys: Choose option 3, optimize translation using concurrency.
# 4. Update specific keys: Choose option 4, specify keys.
# 5. Create new language: Choose option 5, auto-translate new language.
# 6. Exit: Choose option 6 to exit.
#
# Translation Optimization: Only un-translated or changed content will be updated.
# --------------------------------------------------------------------------------

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Paths to the locales directory and backup directory
LOCALES_DIR = Path('/home/runner/workspace/frontend/public/locales')
BACKUP_DIR = Path('/home/runner/workspace/frontend/public/locales_backup')


# ELL translation function with an improved prompt
@ell.simple(model="gpt-4o-mini")
def translate(text, target_language):
    """You are a highly accurate translation assistant. Your task is to translate the provided text clearly and concisely into the specified target language. Provide only the translated text with no additional comments or formatting."""

    return f"Translate the following text into {target_language}:\n\n{text}\n\nProvide only the translated text with no additional comments."


# --------------------------------------------------------------------------------
# BACKUP FUNCTION: Create a backup of all JSON translation files in a separate folder.
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
# RESTORE FUNCTION: Restore all translation files from the backup folder.
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
# FUNCTION: Ensure that new JSON files in the English folder are added to all other languages.
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
# Optimization: Only update keys if the content has changed or is missing.
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

                # Only translate missing or changed content
                def update_language(lang_file=lang_file,
                                    lang_content=lang_content,
                                    en_content=en_content,
                                    lang=lang):
                    updated = False
                    for key, value in en_content.items():
                        if key not in lang_content or lang_content[
                                key] != value:
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

                # Only translate missing or changed content for specific keys
                def update_language(lang_file=lang_file,
                                    lang_content=lang_content,
                                    en_content=en_content,
                                    lang=lang,
                                    keys_to_update=keys_to_update):
                    updated = False
                    for key in keys_to_update:
                        if key in en_content and (key not in lang_content
                                                  or lang_content[key]
                                                  != en_content[key]):
                            lang_content[key] = translate(
                                en_content[key], lang)
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
# FUNCTION: Create a new language folder and populate it with translated content.
# --------------------------------------------------------------------------------
def create_new_language(new_language):
    """Create a new language folder and copy all JSON files from English with translated content."""
    new_language_dir = LOCALES_DIR / new_language
    if new_language_dir.exists():
        logging.error(f"Language folder for '{new_language}' already exists.")
        return

    try:
        new_language_dir.mkdir(parents=True)
        en_dir = LOCALES_DIR / 'en'
        for en_file in en_dir.rglob('*.json'):
            new_lang_file = new_language_dir / en_file.relative_to(en_dir)
            en_content = load_json(en_file)
            new_lang_content = {
                key: translate(value, new_language)
                for key, value in en_content.items()
            }
            new_lang_file.parent.mkdir(parents=True, exist_ok=True)
            save_json(new_lang_file, new_lang_content)
            logging.info(
                f"Created and translated {new_lang_file} for new language '{new_language}'"
            )
    except Exception as e:
        logging.error(f"Error creating new language '{new_language}': {e}")


# --------------------------------------------------------------------------------
# MAIN MENU: Displays the menu options and handles user input.
# --------------------------------------------------------------------------------
def main_menu():
    print("\nTranslation Management Tool")
    print("----------------------------")
    print("1. Backup translation files")
    print("2. Restore translation files from backup")
    print("3. Update all keys in all languages")
    print("4. Update specific keys in all languages")
    print("5. Create a new language (with auto-translation)")
    print("6. Exit")

    choice = input("Select an option (1-6): ")

    if choice == '1':
        backup_files()
    elif choice == '2':
        restore_backup()
    elif choice == '3':
        concurrency = input(
            "Enter number of concurrent threads (default 5): ") or 5
        update_all_keys(concurrency=int(concurrency))
    elif choice == '4':
        keys = input("Enter keys to update (separate by spaces): ").split()
        concurrency = input(
            "Enter number of concurrent threads (default 5): ") or 5
        update_specific_keys(keys_to_update=keys, concurrency=int(concurrency))
    elif choice == '5':
        new_language = input(
            "Enter the new language code (e.g., 'es' for Spanish): ").strip()
        create_new_language(new_language)
    elif choice == '6':
        print("Exiting the program.")
        exit()
    else:
        print("Invalid choice. Please select a valid option.")


# --------------------------------------------------------------------------------
# MAIN FUNCTION: Runs the main menu and handles user interactions.
# --------------------------------------------------------------------------------
if __name__ == '__main__':
    while True:
        main_menu()
