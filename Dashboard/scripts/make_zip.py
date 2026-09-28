#!/usr/bin/env python3
"""
Creates a clean, production-ready ZIP file of the entire BHU-DRISHTI codebase.
Excludes node_modules, dist, .git, and cache files.
"""

import os
import zipfile
import sys

EXCLUDE_DIRS = {"node_modules", "dist", ".git", "__pycache__", ".vite"}
EXCLUDE_EXTS = {".pyc", ".log"}

def create_project_zip(output_path="/tmp/bhu_drishti_project.zip", root_dir=None):
    if root_dir is None:
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(root_dir):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in EXCLUDE_EXTS or file.endswith(".zip"):
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, root_dir)
                zipf.write(full_path, arcname=rel_path)

    print(f"Project ZIP successfully generated at: {output_path} ({os.path.getsize(output_path)} bytes)")
    return output_path

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/bhu_drishti_project.zip"
    create_project_zip(out)
