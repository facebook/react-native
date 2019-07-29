/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPlatform.h"

#import <UIKit/UIKit.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTUtils.h>
#import <React/RCTVersion.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

static NSString *interfaceIdiom(UIUserInterfaceIdiom idiom) {
  switch(idiom) {
    case UIUserInterfaceIdiomPhone:
      return @"phone";
    case UIUserInterfaceIdiomPad:
      return @"pad";
    case UIUserInterfaceIdiomTV:
      return @"tv";
    case UIUserInterfaceIdiomCarPlay:
      return @"carplay";
    default:
      return @"unknown";
  }
}

@interface RCTPlatform () <NativePlatformConstantsIOSSpec>
@end

@implementation RCTPlatform

RCT_EXPORT_MODULE(PlatformConstants)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

// TODO: Use the generated struct return type.
- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

// TODO: Use the generated struct return type.
- (NSDictionary<NSString *, id> *)getConstants
{
  UIDevice *device = [UIDevice currentDevice];
  return @{
    @"forceTouchAvailable": @(RCTForceTouchAvailable()),
    @"osVersion": [device systemVersion],
    @"systemName": [device systemName],
    @"interfaceIdiom": interfaceIdiom([device userInterfaceIdiom]),
    @"isTesting": @(RCTRunningInTestEnvironment()),
    @"reactNativeVersion": RCTGetReactNativeVersion(),
  };
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<JSCallInvoker>)jsInvoker
{
  return std::make_shared<NativePlatformConstantsIOSSpecJSI>(self, jsInvoker);
}

@end

Class RCTPlatformCls(void) {
  return RCTPlatform.class;
}
