/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

NS_ASSUME_NONNULL_BEGIN

#if !TARGET_OS_OSX // [macOS]
@interface RCTAccessibilityElement : UIAccessibilityElement
#else // [macOS
@interface RCTAccessibilityElement : NSAccessibilityElement
#endif // macOS]

/*
 * Frame of the accessibility element in parent coordinate system.
 * Set to `CGRectZero` to use size of the container.
 *
 * Default value: `CGRectZero`.
 */
@property (nonatomic, assign) CGRect frame;
@end

NS_ASSUME_NONNULL_END
