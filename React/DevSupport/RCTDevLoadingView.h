/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <React/RCTBridgeModule.h>

@class RCTLoadingProgress;

@interface RCTDevLoadingView : NSObject <RCTBridgeModule>

+ (void)setEnabled:(BOOL)enabled;
- (void)showMessage:(NSString *)message color:(RCTUIColor *)color backgroundColor:(RCTUIColor *)backgroundColor; // TODO(OSS Candidate ISS#2710739)
- (void)showWithURL:(NSURL *)URL;
- (void)updateProgress:(RCTLoadingProgress *)progress;
- (void)hide;

@end
