/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSourceCode.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import <React/RCTBridge.h>
#import <React/RCTBundleHolderModule.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTSourceCode () <NativeSourceCodeSpec, RCTBundleHolderModule>
@end

@implementation RCTSourceCode

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;
@synthesize bundleURL = _bundleURL;

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  if (_bridge) {
    return @{
      @"scriptURL" : self.bridge.bundleURL.absoluteString ?: @"",
    };
  }
  return @{
    @"scriptURL" : _bundleURL.absoluteString ?: @"",
  };
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeSourceCodeSpecJSI>(params);
}

@end

Class RCTSourceCodeCls(void)
{
  return RCTSourceCode.class;
}
