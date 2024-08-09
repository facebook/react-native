/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>
#import <React/RCTUIKit.h> // [macOS]
#import <string>

NS_ASSUME_NONNULL_BEGIN

@interface RCTPlatformView (ColorOverlays) // [macOS]

- (void)setBackgroundColorWithColorString:(NSString *)colorString;
- (void)addColorOverlays:(const NSArray *)overlayColors;
- (void)removeOverlays;
+ (RCTUIColor *)RCTUIColorFromHexString:(const std::string)hexString; // [macOS]

@end

NS_ASSUME_NONNULL_END
