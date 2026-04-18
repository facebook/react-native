/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * When the configured `lineHeight` (encoded in `paragraphStyle.maximumLineHeight`)
 * exceeds the font's natural line height, UIKit's draw paths anchor glyphs to the
 * bottom of the paragraph line box. These helpers contain the small set of
 * transformations needed to re-center the glyph and the caret across the various
 * UIKit rendering paths used by `<TextInput>`.
 */

/*
 * Returns a copy of `defaultTextAttributes` with `paragraphStyle.{min,max}LineHeight`
 * zeroed when greater than the font's line height. UITextField / UITextView feed
 * `defaultTextAttributes` into `typingAttributes`, so handing them a stripped copy
 * makes the typed-text path render at the font's natural metrics — vertical centering
 * then positions the glyph in the bounds and the caret rect (sized from the same line
 * box) shrinks to match. Returns the input dictionary unchanged if no strip is needed.
 */
NSDictionary<NSAttributedStringKey, id> *RCTStripDefaultTextAttributesLineHeight(
    NSDictionary<NSAttributedStringKey, id> *defaultTextAttributes);

/*
 * Per-range zero of `paragraphStyle.{min,max}LineHeight` on `attributedString`,
 * preserving any other paragraph-style fields (alignment, indent) the user may have
 * set on nested <Text>. No-ops on ranges that already have a zero line-height stub.
 */
void RCTStripAttributedStringLineHeights(NSMutableAttributedString *attributedString);

/*
 * Adds `NSBaselineOffsetAttributeName` to `placeholderAttributes` when
 * `paragraphStyle.maximumLineHeight > font.lineHeight`. The placeholder UILabel
 * draw path used by both UITextField.attributedPlaceholder and
 * RCTUITextView._placeholderView honors baseline offset, so a single uniform offset
 * is all that's needed to re-center the placeholder glyph in the line box.
 */
void RCTApplyPlaceholderBaselineOffset(NSMutableDictionary<NSAttributedStringKey, id> *placeholderAttributes);

NS_ASSUME_NONNULL_END
