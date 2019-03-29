/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const RCTAttributedStringIsHighlightedAttributeName =
    @"IsHighlighted";
NSString *const RCTAttributedStringParentShadowNode = @"ParentShadowNode";

/**
 * Constructs ready-to-render `NSAttributedString` by given `AttributedString`.
 */
NSAttributedString *RCTNSAttributedStringFromAttributedString(
    const facebook::react::AttributedString &attributedString);

@interface RCTSharedShadowNodeWrapper : NSObject
@property(nonatomic, assign) facebook::react::SharedShadowNode node;
@end

NS_ASSUME_NONNULL_END
