# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import unittest

from ..input_filters.doxygen_strip_comments import (
    strip_block_comments,
    strip_deprecated_msg,
)


class TestDoxygenStripComments(unittest.TestCase):
    def test_strips_single_line_block_comment(self):
        content = "/* comment */ code"
        result = strip_block_comments(content)
        self.assertEqual(result, " code")

    def test_strips_multiline_block_comment(self):
        content = """/**
 * Doc comment
 * with multiple lines
 */
@interface RealInterface
@end"""
        result = strip_block_comments(content)
        # Should preserve 4 newlines (one for each line in the comment)
        self.assertEqual(
            result,
            """\n\n\n
@interface RealInterface
@end""",
        )

    def test_preserves_code_outside_comments(self):
        content = """@interface MyClass
- (void)method;
@end"""
        result = strip_block_comments(content)
        self.assertEqual(result, content)

    def test_strips_comment_with_objc_keywords(self):
        """This is the main use case - stripping comments that contain @interface etc."""
        content = """/**
 * Example:
 *   @interface RCT_EXTERN_MODULE(MyModule, NSObject)
 *   @end
 */
@interface RealInterface
@end"""
        result = strip_block_comments(content)
        self.assertNotIn("RCT_EXTERN_MODULE", result)
        self.assertIn("@interface RealInterface", result)

    def test_handles_multiple_comments(self):
        content = """/* first */ code /* second */ more"""
        result = strip_block_comments(content)
        self.assertEqual(result, " code  more")

    def test_handles_empty_content(self):
        result = strip_block_comments("")
        self.assertEqual(result, "")

    def test_handles_no_comments(self):
        content = "just code without comments"
        result = strip_block_comments(content)
        self.assertEqual(result, content)


class TestStripDeprecatedMsg(unittest.TestCase):
    def test_strips_deprecated_msg(self):
        content = '- (void)oldMethod __deprecated_msg("Use newMethod instead.");'
        result = strip_deprecated_msg(content)
        self.assertEqual(result, "- (void)oldMethod ;")

    def test_strips_standalone_deprecated(self):
        content = "- (instancetype)initWithBundleURL:(NSURL *)bundleURL launchOptions:(nullable NSDictionary *)launchOptions __deprecated;"
        result = strip_deprecated_msg(content)
        self.assertEqual(
            result,
            "- (instancetype)initWithBundleURL:(NSURL *)bundleURL launchOptions:(nullable NSDictionary *)launchOptions ;",
        )

    def test_standalone_deprecated_does_not_match_deprecated_msg(self):
        content = '__deprecated_msg("msg") and __deprecated'
        result = strip_deprecated_msg(content)
        self.assertEqual(result, "and ")

    def test_preserves_deprecated_in_identifiers(self):
        content = (
            "- (void)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;"
        )
        result = strip_deprecated_msg(content)
        self.assertEqual(result, content)

    def test_preserves_DEPRECATED_suffix_in_names(self):
        content = "@property (weak) RCTViewRegistry *viewRegistry_DEPRECATED;"
        result = strip_deprecated_msg(content)
        self.assertEqual(result, content)

    def test_handles_no_deprecated(self):
        content = "- (void)normalMethod;"
        result = strip_deprecated_msg(content)
        self.assertEqual(result, content)

    def test_handles_empty_content(self):
        result = strip_deprecated_msg("")
        self.assertEqual(result, "")

    def test_strips_deprecated_before_interface(self):
        content = '__deprecated_msg("This API will be removed.") @interface RCTSurface : NSObject'
        result = strip_deprecated_msg(content)
        self.assertEqual(result, "@interface RCTSurface : NSObject")


if __name__ == "__main__":
    unittest.main()
