/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTClipboard.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <UIKit/UIKit.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTClipboard () <NativeClipboardSpec>
@end

@implementation RCTClipboard

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(setString : (NSString *)content)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ?: @"");
}

RCT_EXPORT_METHOD(getString : (RCTPromiseResolveBlock)resolve reject : (__unused RCTPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
                                              nativeInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
                                                 perfLogger:(id<RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<NativeClipboardSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class RCTClipboardCls(void)
{
  return RCTClipboard.class;
}
