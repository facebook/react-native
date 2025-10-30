/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import <React/RCTI18nUtil.h>
#import "RCTI18nManager.h"

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTI18nManager () <NativeI18nManagerSpec>
@end

@implementation RCTI18nManager

+ (NSString *)moduleName
{
  return @"I18nManager";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_METHOD(allowRTL : (BOOL)value)
{
  [[RCTI18nUtil sharedInstance] allowRTL:value];
}

RCT_EXPORT_METHOD(forceRTL : (BOOL)value)
{
  [[RCTI18nUtil sharedInstance] forceRTL:value];
}

RCT_EXPORT_METHOD(swapLeftAndRightInRTL : (BOOL)value)
{
  [[RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL" : @([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeI18nManagerSpecJSI>(params);
}

@end

Class RCTI18nManagerCls(void)
{
  return RCTI18nManager.class;
}
