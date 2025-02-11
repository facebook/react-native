/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTStatusBarManager.h"
#import "CoreModulesPlugins.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>

@interface RCTStatusBarManager () <NativeStatusBarManagerIOSSpec>
@end

@implementation RCTStatusBarManager

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getHeight : (RCTResponseSenderBlock)callback) {}

RCT_EXPORT_METHOD(setStyle : (NSString *)style animated : (BOOL)animated) {}

RCT_EXPORT_METHOD(setHidden : (BOOL)hidden withAnimation : (NSString *)withAnimation) {}

RCT_EXPORT_METHOD(setNetworkActivityIndicatorVisible : (BOOL)visible) {}

- (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)getConstants
{
  __block facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants> constants;
  RCTUnsafeExecuteOnMainQueueSync(^{
    constants = facebook::react::typedConstants<JS::NativeStatusBarManagerIOS::Constants>({
        .HEIGHT = 0,
        .DEFAULT_BACKGROUND_COLOR = std::nullopt,
    });
  });

  return constants;
}

- (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)constantsToExport
{
  return (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)[self getConstants];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeStatusBarManagerIOSSpecJSI>(params);
}

@end

Class RCTStatusBarManagerCls(void)
{
  return RCTStatusBarManager.class;
}
