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
#import <React/RCTBundleURLProvider.h>

@implementation RCTCustomBundleConfiguration

- (instancetype)initWithBundleFilePath:(NSURL *)bundleFilePath
{
  if (self = [super init]) {
    _bundleFilePath = bundleFilePath;
  }
  
  return self;
}

- (instancetype)initWithPackagerServerScheme:(NSString *)packagerServerScheme packagerServerHost:(NSString *)packagerServerHost
{
  if (self = [super init]) {
    _packagerServerScheme = packagerServerScheme;
    _packagerServerHost = packagerServerHost;
  }
  
  return self;
}

- (NSString *)getPackagerServerScheme
{
  if (!_packagerServerScheme) {
    return [[RCTBundleURLProvider sharedSettings] packagerScheme];
  }
  
  return _packagerServerScheme;
}

- (NSString *)getPackagerServerHost
{
  if (!_packagerServerHost) {
    return [[RCTBundleURLProvider sharedSettings] packagerServerHostPort];
  }
  
  return _packagerServerHost;
}

- (NSURL *)getBundleURL:(NSURL * (^)(void))fallbackURLProvider
{
  if (_packagerServerScheme && _packagerServerHost) {
    NSArray<NSURLQueryItem *> *jsBundleURLQuery = [[RCTBundleURLProvider sharedSettings] createJSBundleURLQuery:_packagerServerHost packagerScheme:_packagerServerScheme];
    
    return [[RCTBundleURLProvider class] resourceURLForResourcePath:@"js/RNTesterApp.ios"
                                         packagerHost:_packagerServerHost
                                         scheme:_packagerServerScheme
                                         queryItems:jsBundleURLQuery];
  }
  
  if (_bundleFilePath) {
    // TODO: modify bundle path
  }
  
  return fallbackURLProvider();
}

- (void)clean
{
  _packagerServerHost = nil;
  _packagerServerScheme = nil;
  _bundleFilePath = nil;
}

@end

@implementation RCTBundleManager {
#ifndef RCT_FIT_RM_OLD_RUNTIME
  __weak RCTBridge *_bridge;
#endif // RCT_FIT_RM_OLD_RUNTIME
  RCTBridgelessBundleURLGetter _bridgelessBundleURLGetter;
  RCTBridgelessBundleURLSetter _bridgelessBundleURLSetter;
  RCTBridgelessBundleURLGetter _bridgelessBundleURLDefaultGetter;
}
@synthesize customBundleConfig;

#ifndef RCT_FIT_RM_OLD_RUNTIME
- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}
#endif // RCT_FIT_RM_OLD_RUNTIME

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
#ifndef RCT_FIT_RM_OLD_RUNTIME
  if (_bridge) {
    _bridge.bundleURL = bundleURL;
    return;
  }
#endif // RCT_FIT_RM_OLD_RUNTIME

  RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLSetter must not be nil.");
  _bridgelessBundleURLSetter(bundleURL);
}

- (NSURL *)bundleURL
{
#ifndef RCT_FIT_RM_OLD_RUNTIME
  if (_bridge) {
    return _bridge.bundleURL;
  }
#endif // RCT_FIT_RM_OLD_RUNTIME

  RCTAssert(
      _bridgelessBundleURLGetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLGetter must not be nil.");

  return _bridgelessBundleURLGetter();
}

- (void)resetBundleURL
{
#ifndef RCT_FIT_RM_OLD_RUNTIME
  RCTBridge *strongBridge = _bridge;
  if (strongBridge) {
    strongBridge.bundleURL = [strongBridge.delegate sourceURLForBridge:strongBridge];
    return;
  }
#endif // RCT_FIT_RM_OLD_RUNTIME

  RCTAssert(
      _bridgelessBundleURLDefaultGetter != nil,
      @"RCTBundleManager: In bridgeless mode, default RCTBridgelessBundleURLGetter must not be nil.");
  RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLSetter must not be nil.");

  _bridgelessBundleURLSetter(_bridgelessBundleURLDefaultGetter());
}

@end
