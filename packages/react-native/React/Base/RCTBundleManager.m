/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleManager.h"
#import <React/RCTBundleURLProvider.h>
#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTLog.h"

@implementation RCTBundleConfiguration

+ (instancetype)defaultConfiguration
{
  return [[self alloc] initWithBundleFilePath:nil packagerServerScheme:nil packagerServerHost:nil bundlePath:nil];
}

- (instancetype)initWithBundleFilePath:(NSURL *)bundleFilePath
{
  return [self initWithBundleFilePath:bundleFilePath packagerServerScheme:nil packagerServerHost:nil bundlePath:nil];
}

- (instancetype)initWithPackagerServerScheme:(NSString *)packagerServerScheme
                          packagerServerHost:(NSString *)packagerServerHost
                                  bundlePath:(NSString *)bundlePath
{
  return [self initWithBundleFilePath:nil
                 packagerServerScheme:packagerServerScheme
                   packagerServerHost:packagerServerHost
                           bundlePath:bundlePath];
}

- (instancetype)initWithBundleFilePath:(NSURL *)bundleFilePath
                  packagerServerScheme:(NSString *)packagerServerScheme
                    packagerServerHost:(NSString *)packagerServerHost
                            bundlePath:(NSString *)bundlePath
{
  if (self = [super init]) {
    _bundleFilePath = bundleFilePath;
    _packagerServerScheme = packagerServerScheme;
    _packagerServerHost = packagerServerHost;
    _bundlePath = bundlePath;
    _packagerOptionsUpdater = ^NSMutableArray<NSURLQueryItem *> *(NSMutableArray<NSURLQueryItem *> *options)
    {
      return options;
    };
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
    NSArray<NSURLQueryItem *> *jsBundleURLQuery =
        [[RCTBundleURLProvider sharedSettings] createJSBundleURLQuery:_packagerServerHost
                                                       packagerScheme:_packagerServerScheme];

    NSArray<NSURLQueryItem *> *updatedBundleURLQuery = _packagerOptionsUpdater((NSMutableArray *)jsBundleURLQuery);
    NSString *path = [NSString stringWithFormat:@"/%@.bundle", _bundlePath];
    return [[RCTBundleURLProvider class] resourceURLForResourcePath:path
                                                       packagerHost:_packagerServerHost
                                                             scheme:_packagerServerScheme
                                                         queryItems:updatedBundleURLQuery];
  }

  if (_bundleFilePath) {
    if (!_bundleFilePath.fileURL) {
      RCTLogError(@"Bundle file path must be a file URL");
      return nil;
    }

    return _bundleFilePath;
  }

  return fallbackURLProvider();
}

@end

@implementation RCTBundleManager {
#ifndef RCT_REMOVE_LEGACY_ARCH
  __weak RCTBridge *_bridge;
#endif // RCT_REMOVE_LEGACY_ARCH
  RCTBridgelessBundleURLGetter _bridgelessBundleURLGetter;
  RCTBridgelessBundleURLSetter _bridgelessBundleURLSetter;
  RCTBridgelessBundleURLGetter _bridgelessBundleURLDefaultGetter;
}

- (instancetype)initWithBundleConfig:(RCTBundleConfiguration *)bundleConfig
{
  if (self = [super init]) {
    self.bundleConfig = bundleConfig ? bundleConfig : [RCTBundleConfiguration defaultConfiguration];
  }

  return self;
}

- (instancetype)init
{
  return [self initWithBundleConfig:[RCTBundleConfiguration defaultConfiguration]];
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
