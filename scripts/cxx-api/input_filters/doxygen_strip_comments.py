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


def main():
    if len(sys.argv) < 2:
        print("Usage: doxygen_strip_comments.py <filename>", file=sys.stderr)
        sys.exit(1)

    filename = sys.argv[1]

    try:
        with open(filename, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        filtered = strip_block_comments(content)
        print(filtered, end="")
    except Exception as e:
        # On error, output original content to not break the build
        print(f"Warning: Filter error for {filename}: {e}", file=sys.stderr)
        with open(filename, "r", encoding="utf-8", errors="replace") as f:
            print(f.read(), end="")


if __name__ == "__main__":
    main()
