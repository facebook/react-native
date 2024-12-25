/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const RCTAttributedStringEventEmitterKey = @"EventEmitter";

// String representation of either `role` or `accessibilityRole`
NSString *const RCTTextAttributesAccessibilityRoleAttributeName = @"AccessibilityRole";

/*
 * Creates `NSTextAttributes` from given `facebook::react::TextAttributes`
 */
NSMutableDictionary<NSAttributedStringKey, id> *RCTNSTextAttributesFromTextAttributes(
    const facebook::react::TextAttributes &textAttributes);

/*
 * Conversions amond `NSAttributedString`, `AttributedString` and `AttributedStringBox`.
 */
NSAttributedString *RCTNSAttributedStringFromAttributedString(
    const facebook::react::AttributedString &attributedString);

NSAttributedString *RCTNSAttributedStringFromAttributedStringBox(
    const facebook::react::AttributedStringBox &attributedStringBox);

facebook::react::AttributedStringBox RCTAttributedStringBoxFromNSAttributedString(
    NSAttributedString *nsAttributedString);

NSString *RCTNSStringFromStringApplyingTextTransform(NSString *string, facebook::react::TextTransform textTransform);

void RCTApplyBaselineOffset(NSMutableAttributedString *attributedText);

/*
 * Whether two `NSAttributedString` lead to the same underlying displayed text, even if they are not strictly equal.
 * I.e. is one string substitutable for the other when backing a control (which may have some ignorable attributes
 * provided).
 */
BOOL RCTIsAttributedStringEffectivelySame(
    NSAttributedString *text1,
    NSAttributedString *text2,
    NSDictionary<NSAttributedStringKey, id> *insensitiveAttributes,
    const facebook::react::TextAttributes &baseTextAttributes);

@interface RCTWeakEventEmitterWrapper : NSObject
@property (nonatomic, assign) facebook::react::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
