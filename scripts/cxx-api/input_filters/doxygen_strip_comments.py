#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Doxygen input filter to strip block comments from source files.

This prevents Doxygen from incorrectly parsing code examples within
documentation comments as actual code declarations (e.g., @interface,
@protocol examples in doc comments being parsed as real interfaces).

Usage in doxygen config:
    INPUT_FILTER = "python3 /path/to/doxygen_strip_comments.py"
"""

import re
import sys


def strip_block_comments(content: str) -> str:
    """
    Remove all block comments (/* ... */ and /** ... */) from content.
    Preserves line count by replacing comment content with newlines.
    """

    def replace_with_newlines(match: re.Match) -> str:
        # Count newlines in original comment to preserve line numbers
        newline_count = match.group().count("\n")
        return "\n" * newline_count

    # Pattern to match block comments (non-greedy)
    comment_pattern = re.compile(r"/\*[\s\S]*?\*/")

    return comment_pattern.sub(replace_with_newlines, content)


def strip_deprecated_msg(content: str) -> str:
    """
    Remove __deprecated_msg(...) macros and standalone __deprecated annotations
    from content.

    These macros cause Doxygen to produce malformed XML output when they appear
    before @interface declarations, creating __pad0__ artifacts and missing
    members. Standalone __deprecated on method declarations causes the annotation
    to be parsed as a parameter name. Since the macros are stripped, deprecation
    info won't appear in the API snapshot output.
    """
    # Pattern to match __deprecated_msg("...") with any content inside quotes
    pattern = re.compile(r'__deprecated_msg\s*\(\s*"[^"]*"\s*\)\s*')
    content = pattern.sub("", content)

    # Pattern to match standalone __deprecated (not followed by _msg or other suffix)
    standalone_pattern = re.compile(r"\b__deprecated\b(?!_)\s*")
    content = standalone_pattern.sub("", content)

    return content


def main():
    if len(sys.argv) < 2:
        print("Usage: doxygen_strip_comments.py <filename>", file=sys.stderr)
        sys.exit(1)

    filename = sys.argv[1]

    try:
        with open(filename, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        filtered = strip_block_comments(content)
        filtered = strip_deprecated_msg(filtered)
        print(filtered, end="")
    except Exception as e:
        # On error, output original content to not break the build
        print(f"Warning: Filter error for {filename}: {e}", file=sys.stderr)
        with open(filename, "r", encoding="utf-8", errors="replace") as f:
            print(f.read(), end="")


if __name__ == "__main__":
    main()
