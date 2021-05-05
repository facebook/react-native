/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTBridgeModule.h"

@implementation RCTBundleManager {
  __weak RCTBridge *_bridge;
  RCTBridgelessBundleURLGetter _bridgelessBundleURLGetter;
  RCTBridgelessBundleURLSetter _bridgelessBundleURLSetter;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessBundleURLGetter:(RCTBridgelessBundleURLGetter)getter andSetter:(RCTBridgelessBundleURLSetter)setter
{
  _bridgelessBundleURLGetter = getter;
  _bridgelessBundleURLSetter = setter;
}

- (void)setBundleURL:(NSURL *)bundleURL
{
  if (_bridge) {
    _bridge.bundleURL = bundleURL;
    return;
  }

  RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLSetter must not be nil.");
  _bridgelessBundleURLSetter(bundleURL);
}

- (NSURL *)bundleURL
{
  if (_bridge) {
    return _bridge.bundleURL;
  }

  RCTAssert(
      _bridgelessBundleURLGetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLGetter must not be nil.");

  return _bridgelessBundleURLGetter();
}

@end
