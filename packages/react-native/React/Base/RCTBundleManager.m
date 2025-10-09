/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleManager.h"
#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"

@implementation RCTBundleManager {
#ifndef RCT_REMOVE_LEGACY_ARCH
  __weak RCTBridge *_bridge;
#endif // RCT_REMOVE_LEGACY_ARCH
  RCTBridgelessBundleURLGetter _bridgelessBundleURLGetter;
  RCTBridgelessBundleURLSetter _bridgelessBundleURLSetter;
  RCTBridgelessBundleURLGetter _bridgelessBundleURLDefaultGetter;
}

#ifndef RCT_REMOVE_LEGACY_ARCH
- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}
#endif // RCT_REMOVE_LEGACY_ARCH

- (void)setBridgelessBundleURLGetter:(RCTBridgelessBundleURLGetter)getter
                           andSetter:(RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(RCTBridgelessBundleURLGetter)defaultGetter
{
  _bridgelessBundleURLGetter = getter;
  _bridgelessBundleURLSetter = setter;
  _bridgelessBundleURLDefaultGetter = defaultGetter;
}

- (void)setBundleURL:(NSURL *)bundleURL
{
#ifndef RCT_REMOVE_LEGACY_ARCH
  if (_bridge) {
    _bridge.bundleURL = bundleURL;
    return;
  }
#endif // RCT_REMOVE_LEGACY_ARCH

  RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLSetter must not be nil.");
  _bridgelessBundleURLSetter(bundleURL);
}

- (NSURL *)bundleURL
{
#ifndef RCT_REMOVE_LEGACY_ARCH
  if (_bridge) {
    return _bridge.bundleURL;
  }
#endif // RCT_REMOVE_LEGACY_ARCH

  RCTAssert(
      _bridgelessBundleURLGetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLGetter must not be nil.");

  return _bridgelessBundleURLGetter();
}

- (void)resetBundleURL
{
#ifndef RCT_REMOVE_LEGACY_ARCH
  RCTBridge *strongBridge = _bridge;
  if (strongBridge) {
    strongBridge.bundleURL = [strongBridge.delegate sourceURLForBridge:strongBridge];
    return;
  }
#endif // RCT_REMOVE_LEGACY_ARCH

  RCTAssert(
      _bridgelessBundleURLDefaultGetter != nil,
      @"RCTBundleManager: In bridgeless mode, default RCTBridgelessBundleURLGetter must not be nil.");
  RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLSetter must not be nil.");

  _bridgelessBundleURLSetter(_bridgelessBundleURLDefaultGetter());
}

@end
