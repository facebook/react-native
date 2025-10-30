/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSourceCode.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTSourceCode () <NativeSourceCodeSpec>
@end

@implementation RCTSourceCode

+ (NSString *)moduleName
{
  return @"SourceCode";
}

@synthesize bundleManager = _bundleManager;

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
  return @{
    @"scriptURL" : self.bundleManager.bundleURL.absoluteString ?: @"",
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
