# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Unit tests for parse_config()"""

import unittest

from ..parser.config import parse_config


class TestParseConfig(unittest.TestCase):
    """Test cases for parsing API view configuration."""

    # =========================================================================
    # Basic cases
    # =========================================================================

    def test_empty_config(self):
        """Empty config returns empty list"""
        result = parse_config({}, "/base/dir")
        self.assertEqual(result, [])

    def test_single_view_no_variants(self):
        """Single view without variants"""
        config = {
            "ReactCommon": {
                "include_codegen": False,
                "inputs": ["packages/react-native/ReactCommon"],
                "exclude_patterns": ["*/jni/*"],
                "definitions": {"FOO": 1},
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].snapshot_name, "ReactCommon")
        self.assertEqual(
            result[0].inputs, ["/base/dir/packages/react-native/ReactCommon"]
        )
        self.assertEqual(result[0].exclude_patterns, ["*/jni/*"])
        self.assertEqual(result[0].definitions, {"FOO": 1})

    def test_single_view_with_variants(self):
        """Single view with debug and release variants"""
        config = {
            "ReactCommon": {
                "include_codegen": False,
                "inputs": ["packages/react-native/ReactCommon"],
                "exclude_patterns": [],
                "definitions": {},
                "variants": {
                    "debug": {"definitions": {"DEBUG": 1}},
                    "release": {"definitions": {"NDEBUG": 1}},
                },
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)

        names = {r.snapshot_name for r in result}
        self.assertIn("ReactCommonDebug", names)
        self.assertIn("ReactCommonRelease", names)

        debug = next(r for r in result if r.snapshot_name == "ReactCommonDebug")
        self.assertEqual(debug.definitions, {"DEBUG": 1})

        release = next(r for r in result if r.snapshot_name == "ReactCommonRelease")
        self.assertEqual(release.definitions, {"NDEBUG": 1})

    # =========================================================================
    # Definition merging
    # =========================================================================

    def test_base_definitions_merged_with_variant(self):
        """Base definitions are merged with variant definitions"""
        config = {
            "ReactAndroid": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {"RN_SERIALIZABLE_STATE": 1, "ANDROID": 1},
                "variants": {
                    "debug": {"definitions": {"DEBUG": 1}},
                    "release": {"definitions": {"NDEBUG": 1}},
                },
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)

        debug = next(r for r in result if r.snapshot_name == "ReactAndroidDebug")
        self.assertEqual(
            debug.definitions,
            {"RN_SERIALIZABLE_STATE": 1, "ANDROID": 1, "DEBUG": 1},
        )

        release = next(r for r in result if r.snapshot_name == "ReactAndroidRelease")
        self.assertEqual(
            release.definitions,
            {"RN_SERIALIZABLE_STATE": 1, "ANDROID": 1, "NDEBUG": 1},
        )

    def test_variant_definitions_override_base(self):
        """Variant definitions override base definitions with same key"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {"MODE": "base", "SHARED": 1},
                "variants": {
                    "debug": {"definitions": {"MODE": "debug"}},
                },
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0].definitions,
            {"MODE": "debug", "SHARED": 1},
        )

    def test_empty_variant_definitions(self):
        """Variant with empty definitions still inherits base"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {"BASE": 1},
                "variants": {
                    "debug": {"definitions": {}},
                },
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].definitions, {"BASE": 1})

    def test_none_variant_definitions(self):
        """Variant with None definitions still inherits base"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {"BASE": 1},
                "variants": {
                    "debug": {"definitions": None},
                },
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].definitions, {"BASE": 1})

    # =========================================================================
    # Input path resolution
    # =========================================================================

    def test_relative_paths_resolved(self):
        """Relative paths are joined with base_dir"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": ["packages/foo", "packages/bar"],
                "exclude_patterns": [],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].inputs,
            ["/base/dir/packages/foo", "/base/dir/packages/bar"],
        )

    def test_absolute_paths_preserved(self):
        """Absolute paths are not modified"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": ["/absolute/path/foo", "relative/path"],
                "exclude_patterns": [],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].inputs,
            ["/absolute/path/foo", "/base/dir/relative/path"],
        )

    def test_empty_inputs(self):
        """Empty inputs list"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].inputs, [])

    def test_none_inputs(self):
        """None inputs treated as empty list"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": None,
                "exclude_patterns": [],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].inputs, [])

    # =========================================================================
    # Codegen path handling
    # =========================================================================

    def test_codegen_path_added_when_include_codegen_true(self):
        """Codegen path is appended when include_codegen is true"""
        config = {
            "TestView": {
                "include_codegen": True,
                "inputs": ["packages/foo"],
                "exclude_patterns": [],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir", codegen_path="/codegen/path")

        self.assertIn("/codegen/path", result[0].inputs)
        self.assertEqual(len(result[0].inputs), 2)

    def test_codegen_path_not_added_when_include_codegen_false(self):
        """Codegen path is not added when include_codegen is false"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": ["packages/foo"],
                "exclude_patterns": [],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir", codegen_path="/codegen/path")

        self.assertNotIn("/codegen/path", result[0].inputs)
        self.assertEqual(len(result[0].inputs), 1)

    def test_codegen_path_not_added_when_none(self):
        """Codegen path not added when codegen_path is None"""
        config = {
            "TestView": {
                "include_codegen": True,
                "inputs": ["packages/foo"],
                "exclude_patterns": [],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir", codegen_path=None)

        self.assertEqual(len(result[0].inputs), 1)

    # =========================================================================
    # Multiple views
    # =========================================================================

    def test_multiple_views(self):
        """Multiple views are all parsed"""
        config = {
            "ViewA": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {"A": 1},
            },
            "ViewB": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {"B": 1},
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)
        names = {r.snapshot_name for r in result}
        self.assertEqual(names, {"ViewA", "ViewB"})

    def test_multiple_views_with_variants(self):
        """Multiple views each with variants"""
        config = {
            "ViewA": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {},
                "variants": {
                    "debug": {"definitions": {"DEBUG": 1}},
                    "release": {"definitions": {"NDEBUG": 1}},
                },
            },
            "ViewB": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {},
                "variants": {
                    "debug": {"definitions": {"DEBUG": 1}},
                },
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 3)
        names = {r.snapshot_name for r in result}
        self.assertEqual(names, {"ViewADebug", "ViewARelease", "ViewBDebug"})

    # =========================================================================
    # Exclude patterns
    # =========================================================================

    def test_exclude_patterns_preserved(self):
        """Exclude patterns are passed through unchanged"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": ["*/jni/*", "*/platform/ios/*"],
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].exclude_patterns,
            ["*/jni/*", "*/platform/ios/*"],
        )

    def test_none_exclude_patterns(self):
        """None exclude_patterns treated as empty list"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": None,
                "definitions": {},
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].exclude_patterns, [])

    # =========================================================================
    # Variant naming
    # =========================================================================

    def test_variant_name_capitalized(self):
        """Variant names are capitalized in snapshot name"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": {},
                "variants": {
                    "debug": {"definitions": {}},
                    "release": {"definitions": {}},
                    "profile": {"definitions": {}},
                },
            }
        }
        result = parse_config(config, "/base/dir")

        names = {r.snapshot_name for r in result}
        self.assertEqual(names, {"TestViewDebug", "TestViewRelease", "TestViewProfile"})

    # =========================================================================
    # Edge cases
    # =========================================================================

    def test_missing_optional_fields(self):
        """Config with missing optional fields uses defaults"""
        config = {"TestView": {}}
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].snapshot_name, "TestView")
        self.assertEqual(result[0].inputs, [])
        self.assertEqual(result[0].exclude_patterns, [])
        self.assertEqual(result[0].definitions, {})

    def test_none_definitions(self):
        """None definitions treated as empty dict"""
        config = {
            "TestView": {
                "include_codegen": False,
                "inputs": [],
                "exclude_patterns": [],
                "definitions": None,
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].definitions, {})


if __name__ == "__main__":
    unittest.main()
