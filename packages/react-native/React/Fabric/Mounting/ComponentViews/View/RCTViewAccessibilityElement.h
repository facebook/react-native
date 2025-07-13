/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * A UIAcccessibilityElement representing a RCTViewComponentView from an
 * accessibility standpoint. This enables RCTViewComponentView's to reference
 * themselves in `accessibilityElements` without actually being an accessibility
 * element. If it were, then iOS would not call into `accessibilityElements`.
 */
@interface RCTViewAccessibilityElement : UIAccessibilityElement

@property (readonly) RCTViewComponentView *view;

- (instancetype)initWithView:(RCTViewComponentView *)view;

@end

NS_ASSUME_NONNULL_END
