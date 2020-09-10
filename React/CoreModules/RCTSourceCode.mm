/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSourceCode.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import <React/RCTBridge.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTSourceCode () <NativeSourceCodeSpec>
@end

@implementation RCTSourceCode

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

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
    @"scriptURL" : self.bridge.bundleURL.absoluteString ?: @"",
  };
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
                                              nativeInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
                                                 perfLogger:(id<RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<NativeSourceCodeSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class RCTSourceCodeCls(void)
{
  return RCTSourceCode.class;
}
