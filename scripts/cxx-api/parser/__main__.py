# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Entry point for running the parser package as a script.
"""

import os
import subprocess

from .main import build_snapshot
from .path_utils import get_react_native_dir

DOXYGEN_CONFIG_FILE = ".doxygen.config.generated"

RUN_ON_REACT_NATIVE = False


def build_doxygen_config(
    directory: str,
    include_directories: list[str] = None,
    exclude_patterns: list[str] = None,
    definitions: dict[str, str | int] = None,
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

    # read the template file
    with open(os.path.join(directory, ".doxygen.config.template")) as f:
        template = f.read()

    # replace the placeholder with the actual path
    config = (
        template.replace("${ADDITIONAL_INPUTS}", include_directories_str)
        .replace("${ADDITIONAL_EXCLUDE_PATTERNS}", exclude_patterns_str)
        .replace("${PREDEFINED}", definitions_str)
    )

    # write the config file
    with open(os.path.join(directory, DOXYGEN_CONFIG_FILE), "w") as f:
        f.write(config)


def main():
    # Define the path to the react-native directory
    react_native_dir = (
        f"{get_react_native_dir()}/packages/react-native"
        if RUN_ON_REACT_NATIVE
        else f"{get_react_native_dir()}/scripts/cxx-api/manual_test"
    )
    print(f"Running in directory: {react_native_dir}")

    # If there is already an output directory, delete it
    if os.path.exists(os.path.join(react_native_dir, "api")):
        print("Deleting existing output directory")
        subprocess.run(["rm", "-rf", os.path.join(react_native_dir, "api")])

    # Generate the Doxygen config file
    print("Generating Doxygen config file")
    if RUN_ON_REACT_NATIVE:
        build_doxygen_config(
            react_native_dir,
            include_directories=["ReactAndroid"],
            exclude_patterns=["*/platform/ios/*"],
            definitions={"RN_SERIALIZABLE_STATE": 1},
        )
    else:
        build_doxygen_config(react_native_dir)

    print("Running Doxygen")

    # Run doxygen with the config file
    result = subprocess.run(
        ["doxygen", DOXYGEN_CONFIG_FILE],
        cwd=react_native_dir,
        capture_output=True,
        text=True,
    )

    # Delete the Doxygen config file
    print("Deleting Doxygen config file")
    subprocess.run(["rm", DOXYGEN_CONFIG_FILE], cwd=react_native_dir)

    # Check the result
    if result.returncode != 0:
        print(f"Doxygen finished with error: {result.stderr}")
    else:
        print("Doxygen finished successfully")

    if RUN_ON_REACT_NATIVE:
        # build snapshot, convert to string, and save to file
        snapshot = build_snapshot(os.path.join(react_native_dir, "api", "xml"))
        snapshot_string = snapshot.to_string()
        with open(os.path.join(react_native_dir, "api", "snapshot.api"), "w") as f:
            f.write(snapshot_string)
    else:
        build_snapshot(os.path.join(react_native_dir, "api", "xml")).print()


if __name__ == "__main__":
    main()
