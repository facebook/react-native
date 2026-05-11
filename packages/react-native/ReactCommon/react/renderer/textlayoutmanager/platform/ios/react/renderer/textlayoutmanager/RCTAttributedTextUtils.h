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

// Custom attribute key for ranges that should render a wavy decoration line.
// UIKit's `NSUnderlineStyle` enum has no native wavy value, so we suppress the
// framework-drawn underline / strikethrough for these ranges and paint the
// wave ourselves in `RCTTextLayoutManager`'s drawing pass using WebKit's
// formula (`controlPointDistance = fontSize * 1.5 / 16`, `step = fontSize / 4.5`).
// Stored as an NSDictionary with @"line" -> @"underline" or @"line-through"
// and @"color" -> UIColor (the decoration color, falling back to the
// foreground color when no `textDecorationColor` was specified).
NSString *const RCTWavyDecorationAttributeName = @"RCTWavyDecoration";

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

static inline NSData *RCTWrapEventEmitter(const std::shared_ptr<const facebook::react::EventEmitter> &eventEmitter)
{
  auto eventEmitterPtr = new std::weak_ptr<const facebook::react::EventEmitter>(eventEmitter);
  return [[NSData alloc] initWithBytesNoCopy:eventEmitterPtr
                                      length:sizeof(eventEmitterPtr)
                                 deallocator:^(void *ptrToDelete, NSUInteger) {
                                   delete (std::weak_ptr<const facebook::react::EventEmitter> *)ptrToDelete;
                                 }];
}

static inline std::shared_ptr<const facebook::react::EventEmitter> RCTUnwrapEventEmitter(NSData *data)
{
  if (data.length == 0) {
    return nullptr;
  }

  auto weakPtr = dynamic_cast<std::weak_ptr<const facebook::react::EventEmitter> *>(
      (std::weak_ptr<const facebook::react::EventEmitter> *)data.bytes);
  if (weakPtr != nullptr) {
    return weakPtr->lock();
  }

  return nullptr;
}

NS_ASSUME_NONNULL_END
