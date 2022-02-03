/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNTMyNativeViewComponentView : RCTViewComponentView

- (UIColor *)UIColorFromHexString:(const std::string)hexString;

@end

NS_ASSUME_NONNULL_END
