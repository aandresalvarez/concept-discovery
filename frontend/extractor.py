import glob
import os


def get_base_dir():
    return os.path.dirname(os.path.abspath(__file__))


def read_files(file_paths):
    for file_path in file_paths:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    yield file_path, content
            except Exception as e:
                print(f"Failed to read {file_path}: {e}")
        else:
            print(f"File does not exist: {file_path}")


def is_excluded(file_path, base_dir, exclude_dirs):
    for exclude_dir in exclude_dirs:
        full_exclude_path = os.path.normpath(
            os.path.join(base_dir, exclude_dir))
        if file_path.startswith(full_exclude_path):
            return True
    return False


def get_files_from_patterns(base_dir, patterns, extensions, exclude_files,
                            exclude_dirs):
    exclude_set = {
        os.path.normpath(os.path.join(base_dir, ex_file))
        for ex_file in exclude_files
    }
    files_found = []
    files_excluded = []

    for pattern in patterns:
        full_pattern = os.path.join(base_dir, pattern)
        print(f"Searching for pattern: {full_pattern}")

        for file_path in glob.glob(full_pattern, recursive=True):
            file_path = os.path.normpath(file_path)
            if os.path.isfile(file_path):
                if any(file_path.endswith(ext) for ext in extensions) and \
                        file_path not in exclude_set and not is_excluded(file_path, base_dir, exclude_dirs):
                    files_found.append(file_path)
                else:
                    files_excluded.append(file_path)

    if files_excluded:
        print(f"Excluded files: {files_excluded}")

    return files_found


def write_to_markdown(output_file, files_content):
    with open(output_file, 'w', encoding='utf-8') as file:
        for path, content in files_content:
            file.write(f"## File: {path}\n```\n{content}\n```\n\n")
    print(f"Written to markdown: {output_file}")


def check_conflicts(include_files, exclude_files):
    include_set = set(include_files)
    exclude_set = set(exclude_files)
    conflicts = include_set & exclude_set
    if conflicts:
        raise ValueError(
            f"Conflicting files found in include and exclude lists: {conflicts}"
        )


# Using glob patterns to include all files and subdirectories
patterns = ['**/*']  # No leading slash means it’s relative to base_dir

# File extensions to include
extensions = [
    '.md', '.py', '.mako', '.html', '.css', '.js', '.ts', '.tsx', '.jsx',
    '.json'
]

# Specific files to include and exclude in the root directory
include_files = ["main.py", "tailwind.config.js"]
exclude_files = ["extractor.py", "output.md"]

# Folders to exclude
exclude_dirs = ['node_modules', 'dist',
                'build']  # Add any folders you want to exclude

# Output markdown file path
output_markdown_file = 'output.md'

try:
    # Check for conflicts between include and exclude files
    check_conflicts(include_files, exclude_files)

    # Base directory
    base_dir = get_base_dir()

    # Normalize include and exclude file paths
    include_file_paths = [
        os.path.normpath(os.path.join(base_dir, file_name))
        for file_name in include_files
    ]
    exclude_file_paths = [
        os.path.normpath(os.path.join(base_dir, file_name))
        for file_name in exclude_files
    ]

    # Get files from patterns, excluding specified files and directories
    pattern_files = get_files_from_patterns(base_dir, patterns, extensions,
                                            exclude_file_paths, exclude_dirs)

    # Combine all file paths
    all_file_paths = pattern_files + [
        file_path for file_path in include_file_paths
        if file_path not in exclude_file_paths
    ]

    if not all_file_paths:
        print("No files found matching the specified patterns and extensions.")
    else:
        print(f"All file paths: {len(all_file_paths)} files found.")

        # Read all files
        files_content = list(read_files(all_file_paths))

        if not files_content:
            print("No content read from the files.")
        else:
            print(f"Number of files read: {len(files_content)}")

            # Write all to markdown
            write_to_markdown(output_markdown_file, files_content)

            print(
                f"Markdown file '{output_markdown_file}' has been created with the content of {len(files_content)} files."
            )

except ValueError as e:
    print(f"Error: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
