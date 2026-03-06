#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from strip_block_comments import strip_block_comments
from strip_deprecated_msg import strip_deprecated_msg
from strip_ns_unavailable import strip_ns_unavailable


def main():
    if len(sys.argv) < 2:
        print("Usage: main.py <filename>", file=sys.stderr)
        sys.exit(1)

    filename = sys.argv[1]

    try:
        with open(filename, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        filtered = strip_block_comments(content)
        filtered = strip_deprecated_msg(filtered)
        filtered = strip_ns_unavailable(filtered)
        print(filtered, end="")
    except Exception as e:
        # On error, output original content to not break the build
        print(f"Warning: Filter error for {filename}: {e}", file=sys.stderr)
        with open(filename, "r", encoding="utf-8", errors="replace") as f:
            print(f.read(), end="")


if __name__ == "__main__":
    main()
