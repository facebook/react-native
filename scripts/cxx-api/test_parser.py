# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import difflib
import importlib.resources as ir
import os
import subprocess
import unittest
from importlib.abc import Traversable
from pathlib import Path
from typing import Iterable

from .parser import build_snapshot


def _resource_root() -> Traversable:
    """Get the root directory containing test cases.

    Resources are included directly via glob(["tests/**/*"]) in BUCK.
    Files are mapped at their original paths (e.g., tests/test1/...).
    """
    pkg_root = ir.files(__package__ if __package__ else "__main__")
    return pkg_root / "tests"


def _iter_case_dirs(root: Traversable) -> Iterable[Traversable]:
    """Iterate over test case directories."""
    return sorted([p for p in root.iterdir() if p.is_dir()], key=lambda p: p.name)


def _assert_text_equal_with_diff(
    tc: unittest.TestCase, expected: str, got: str, *, case: str
) -> None:
    if expected == got:
        return
    diff = "\n".join(
        difflib.unified_diff(
            expected.splitlines(),
            got.splitlines(),
            fromfile=f"{case}/snapshot.api (expected)",
            tofile=f"{case}/generated (got)",
            lineterm="",
        )
    )
    tc.fail(diff)


def _generate_doxygen_api(case_dir_path: str, doxygen_config_path: str) -> None:
    """Run doxygen to generate XML API documentation."""
    result = subprocess.run(
        ["doxygen", doxygen_config_path],
        cwd=case_dir_path,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Doxygen failed: {result.stderr}")


def _get_source_tests_dir() -> Path:
    """Get the actual source directory for tests (for writing snapshots).

    This finds the original source directory, not the packaged resources.
    Used when UPDATE_SNAPSHOT=1 to write new snapshots.
    """
    source_tests_path = os.environ.get("SOURCE_TESTS_PATH")
    if not source_tests_path:
        raise RuntimeError("SOURCE_TESTS_PATH environment variable is not set")

    from .parser import _get_repo_root

    return Path(_get_repo_root()) / source_tests_path


def _make_case_test(case_dir: Traversable, tests_root: Traversable):
    """Create a test method for a specific test case directory."""

    def _test(self: unittest.TestCase) -> None:
        update = os.environ.get("UPDATE_SNAPSHOT") == "1"

        # Use as_file() on the entire tests directory to get real filesystem paths
        # This ensures the doxygen config and case directories are accessible
        with ir.as_file(tests_root) as tests_root_path:
            case_dir_path = tests_root_path / case_dir.name
            doxygen_config_path = tests_root_path / ".doxygen.config.template"

            # Run doxygen to generate the XML
            _generate_doxygen_api(str(case_dir_path), str(doxygen_config_path))

            # Parse the generated XML
            xml_dir = case_dir_path / "api" / "xml"
            snapshot = build_snapshot(str(xml_dir))
            got_snapshot = snapshot.rstrip() + "\n"

            expected_snapshot_path = case_dir_path / "snapshot.api"

            # For writing snapshots, use the actual source directory
            # when updating, otherwise use the packaged resource
            if update or not expected_snapshot_path.exists():
                # Write to actual source directory
                source_tests_dir = _get_source_tests_dir()
                source_snapshot_path = source_tests_dir / case_dir.name / "snapshot.api"
                source_snapshot_path.write_text(got_snapshot)
                print(f"Updated snapshot: {source_snapshot_path}")
                return

            expected_snapshot = expected_snapshot_path.read_text()
            _assert_text_equal_with_diff(
                self, expected_snapshot, got_snapshot, case=case_dir.name
            )

    return _test


class TestApiSnapshots(unittest.TestCase):
    pass


# Dynamically generate test methods for each case directory
_root = _resource_root()
for _case_dir in _iter_case_dirs(_root):
    _test_name = f"test_{_case_dir.name}"
    setattr(TestApiSnapshots, _test_name, _make_case_test(_case_dir, _root))
