/*
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
- (ModuleConstants<JS::NativePlatformConstantsIOS::Constants>)constantsToExport
{
  return (ModuleConstants<JS::NativePlatformConstantsIOS::Constants>)[self getConstants];
}

- (ModuleConstants<JS::NativePlatformConstantsIOS::Constants>)getConstants
{
  UIDevice *device = [UIDevice currentDevice];
  auto versions = RCTGetReactNativeVersion();
  return typedConstants<JS::NativePlatformConstantsIOS::Constants>({
    .forceTouchAvailable = RCTForceTouchAvailable() ? true : false,
    .osVersion = [device systemVersion],
    .systemName = [device systemName],
    .interfaceIdiom = interfaceIdiom([device userInterfaceIdiom]),
    .isTesting = RCTRunningInTestEnvironment() ? true : false,
    .reactNativeVersion = JS::NativePlatformConstantsIOS::ConstantsReactNativeVersion::Builder({
      .minor = [versions[@"minor"] doubleValue],
      .major = [versions[@"major"] doubleValue],
      .patch = [versions[@"patch"] doubleValue],
      .prerelease = [versions[@"prerelease"] isKindOfClass: [NSNull class]] ? folly::Optional<double>{} : [versions[@"prerelease"] doubleValue]
    }),
  });
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return std::make_shared<NativePlatformConstantsIOSSpecJSI>(self, jsInvoker);
}

@end

Class RCTPlatformCls(void) {
  return RCTPlatform.class;
}
