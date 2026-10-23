/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import <React/RCTConstants.h>
#import <React/RCTI18nUtil.h>
#import <React/RCTSurfacePresenterStub.h>
#import "RCTI18nManager.h"

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTI18nManager () <NativeI18nManagerSpec>
@end

@implementation RCTI18nManager {
  __weak id<RCTSurfacePresenterStub> _surfacePresenter;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}

- (void)forceRTL:(BOOL)value resolve:(RCTPromiseResolveBlock)resolve reject:(__unused RCTPromiseRejectBlock)reject
{
  BOOL wasRTL = [[RCTI18nUtil sharedInstance] isRTL];
  [[RCTI18nUtil sharedInstance] forceRTL:value];
  [self _relayoutIfNeeded:wasRTL resolve:resolve];
}

- (void)_relayoutIfNeeded:(BOOL)wasRTL resolve:(RCTPromiseResolveBlock)resolve
{
  if ([[RCTI18nUtil sharedInstance] isRTL] == wasRTL) {
    resolve(nil);
    return;
  }

  id<RCTSurfacePresenterStub> surfacePresenter = _surfacePresenter;

  dispatch_async(dispatch_get_main_queue(), ^{
    // Only the surfaces of this React instance read the new layout direction
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTLayoutDirectionDidChangeNotification
                                                        object:surfacePresenter];
    resolve(nil);
  });
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[RCTI18nUtil sharedInstance] isRTL]),
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
