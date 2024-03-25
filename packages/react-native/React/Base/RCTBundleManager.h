/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

typedef NSURL * (^RCTBridgelessBundleURLGetter)(void);
typedef void (^RCTBridgelessBundleURLSetter)(NSURL *bundleURL);

/**
 * A class that allows NativeModules/TurboModules to read/write the bundleURL, with or without the bridge.
 */
@interface RCTBundleManager : NSObject
- (void)setBridge:(RCTBridge *)bridge;
- (void)setBridgelessBundleURLGetter:(RCTBridgelessBundleURLGetter)getter
                           andSetter:(RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(RCTBridgelessBundleURLGetter)defaultGetter;
- (void)resetBundleURL;
@property NSURL *bundleURL;
@end
