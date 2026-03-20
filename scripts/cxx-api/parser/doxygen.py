# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Doxygen configuration and execution utilities.
"""

import os
import subprocess
import sys

_DOXYGEN_CONFIG_FILE = ".doxygen.config.generated"


def get_doxygen_bin() -> str:
    return os.environ.get("DOXYGEN_BIN", "doxygen")


def build_doxygen_config(
    directory: str,
    include_directories: list[str] = None,
    exclude_patterns: list[str] = None,
    definitions: dict[str, str | int] = None,
    input_filter: str = None,
) -> None:
    if include_directories is None:
        include_directories = []
    if exclude_patterns is None:
        exclude_patterns = []
    if definitions is None:
        definitions = {}

    include_directories_str = " ".join(include_directories)
    exclude_patterns_str = "\\\n".join(exclude_patterns)
    if len(exclude_patterns) > 0:
        exclude_patterns_str = f"\\\n{exclude_patterns_str}"

    definitions_str = " ".join(
        [
            f'{key}="{value}"' if isinstance(value, str) else f"{key}={value}"
            for key, value in definitions.items()
        ]
    )

    input_filter_str = input_filter if input_filter else ""

    with open(os.path.join(directory, ".doxygen.config.template")) as f:
        template = f.read()

    config = (
        template.replace("${INPUTS}", include_directories_str)
        .replace("${EXCLUDE_PATTERNS}", exclude_patterns_str)
        .replace("${PREDEFINED}", definitions_str)
        .replace("${DOXYGEN_INPUT_FILTER}", input_filter_str)
    )

    with open(os.path.join(directory, _DOXYGEN_CONFIG_FILE), "w") as f:
        f.write(config)


def run_doxygen(
    working_dir: str,
    include_directories: list[str],
    exclude_patterns: list[str],
    definitions: dict[str, str | int],
    input_filter: str = None,
    verbose: bool = True,
) -> None:
    """Generate Doxygen config, run Doxygen, and clean up the config file."""
    if verbose:
        print("  Generating Doxygen config file")

    build_doxygen_config(
        working_dir,
        include_directories=include_directories,
        exclude_patterns=exclude_patterns,
        definitions=definitions,
        input_filter=input_filter,
    )

    if verbose:
        print("  Running Doxygen")
        if input_filter:
            print(f"    Using input filter: {input_filter}")

    doxygen_bin = get_doxygen_bin()

    result = subprocess.run(
        [doxygen_bin, _DOXYGEN_CONFIG_FILE],
        cwd=working_dir,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        if verbose:
            print(f"  Doxygen finished with error: {result.stderr}")
        sys.exit(1)
    elif verbose:
        print("  Doxygen finished successfully")

    if verbose:
        print("  Deleting Doxygen config file")
    os.remove(os.path.join(working_dir, _DOXYGEN_CONFIG_FILE))
