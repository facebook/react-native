# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import subprocess

from doxmlparser import index

DOXYGEN_CONFIG_FILE = ".doxygen.config.generated"


def _get_repo_root() -> str:
    """Get the repository root via git."""
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Could not determine repo root via 'git rev-parse': {result.stderr}"
        )
    return result.stdout.strip()


def get_react_native_dir() -> str:
    """
    Get the path to the react-native package directory.

    This function handles two execution contexts:
    1. Buck execution: Uses REACT_NATIVE_DIR env var + git repo root
    2. Direct Python invocation: Uses __file__ relative path
    """
    react_native_dir = os.environ.get("REACT_NATIVE_DIR")
    if react_native_dir:
        return os.path.join(_get_repo_root(), react_native_dir)

    # Use realpath to resolve symlinks — in Buck's link-tree, __file__
    # is a symlink back to the source tree, so this gives the correct
    # source location for relative path resolution.
    script_dir = os.path.dirname(os.path.realpath(__file__))
    return os.path.normpath(
        os.path.join(
            script_dir,  # scripts/cxx-api/
            "..",  # scripts/
            "..",  # react-native-github/
            "packages",
            "react-native",
        )
    )


def build_doxygen_config(
    directory: str,
    include_directories: list[str] | None = None,
    exclude_patterns: list[str] | None = None,
    definitions: dict[str, str | int] | None = None,
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

    definitions_str = " ".join([f"{key}={value}" for key, value in definitions.items()])

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


def build_snapshot(xml_dir) -> str:
    """
    TODO
    """
    index_path = os.path.join(xml_dir, "index.xml")
    if not os.path.exists(index_path):
        print(f"Doxygen entry point not found at {index_path}")

    root = index.parse(index_path)

    for comp in root.compound:
        print(comp.kind)

    return ""


if __name__ == "__main__":
    # Define the path to the ReactCommon directory
    react_native_dir = get_react_native_dir()

    # If there is already an output directory, delete it
    if os.path.exists(os.path.join(react_native_dir, "api")):
        print("Deleting existing output directory")
        subprocess.run(["rm", "-rf", os.path.join(react_native_dir, "api")])

    # Generate the Doxygen config file
    print("Generating Doxygen config file")
    build_doxygen_config(
        react_native_dir,
        include_directories=["ReactAndroid"],
        exclude_patterns=["*/ios/*"],
        definitions={"RN_SERIALIZABLE_STATE": 1},
    )

    print("Running Doxygen")

    # Run doxygen with the config file
    result = subprocess.run(
        ["doxygen", DOXYGEN_CONFIG_FILE],
        cwd=react_native_dir,
        capture_output=True,
        text=True,
    )

    # Check the result
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    else:
        print("Success")
        build_snapshot(os.path.join(react_native_dir, "api", "xml"))
