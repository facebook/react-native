/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

@class RCTLoadingProgress;

@protocol RCTDevLoadingViewProtocol <NSObject>
+ (void)setEnabled:(BOOL)enabled;
- (void)showMessage:(NSString *)message color:(RCTUIColor *)color backgroundColor:(RCTUIColor *)backgroundColor; // TODO(OSS Candidate ISS#2710739)
- (void)showWithURL:(NSURL *)URL;
- (void)updateProgress:(RCTLoadingProgress *)progress;
- (void)hide;
@end
