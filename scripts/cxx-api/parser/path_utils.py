# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import subprocess


def get_repo_root() -> str:
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
        return os.path.join(get_repo_root(), react_native_dir)

    # Use realpath to resolve symlinks — in Buck's link-tree, __file__
    # is a symlink back to the source tree, so this gives the correct
    # source location for relative path resolution.
    script_dir = os.path.dirname(os.path.realpath(__file__))
    return os.path.normpath(
        os.path.join(
            script_dir,  # scripts/cxx-api/parser/
            "..",  # scripts/cxx-api/
            "..",  # scripts/
            "..",  # react-native-github/
        )
    )
