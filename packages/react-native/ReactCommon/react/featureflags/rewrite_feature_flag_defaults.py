#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# pyre-strict

"""Rewrite default return values in ReactNativeFeatureFlagsDefaults.h.

Reads the header from --input, writes the transformed header to stdout.
Overrides are passed as a JSON object via --overrides.
Fails with a non-zero exit code if any requested flag is not found.
"""

from __future__ import annotations

import argparse
import json
import re
import sys


def cxx_literal(value: object) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        s = str(value)
        if isinstance(value, int) or "." not in s:
            s += ".0"
        return s
    raise ValueError(f"Unsupported value type {type(value).__name__} for override")


def rewrite(source: bytes, overrides: dict[str, object]) -> bytes:
    text = source.decode("utf-8")
    for name, value in overrides.items():
        cxx_type = "bool" if isinstance(value, bool) else "double"
        pattern = rf"""
            (                       # group 1: everything up to the value
                {cxx_type} \s+      #   return type
                {re.escape(name)}   #   method name
                \s* \( \s* \)       #   parameter list
                \s+ override        #   override specifier
                \s* \{{             #   opening brace
                [^}}]*?             #   body before the return (non-greedy, no nested braces)
                return \s+          #   return keyword
            )
            [^;]+                   # the value to replace
            ( \s* ; )               # group 2: semicolon
        """
        text, n = re.subn(
            pattern,
            rf"\g<1>{cxx_literal(value)}\2",
            text,
            count=1,
            flags=re.DOTALL | re.VERBOSE,
        )
        if n != 1:
            raise ValueError(f"{name} not matched")

    return text.encode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--overrides", default="{}")
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    overrides: dict[str, object] = json.loads(args.overrides)
    with open(args.input, "rb") as f:
        source = f.read()

    sys.stdout.buffer.write(rewrite(source, overrides))


if __name__ == "__main__":
    main()
