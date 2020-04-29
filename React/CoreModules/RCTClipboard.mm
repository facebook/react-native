/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTClipboard.h"

<<<<<<< HEAD:React/Modules/RCTClipboard.m
#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)
=======
#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <UIKit/UIKit.h>
>>>>>>> fb/0.62-stable:React/CoreModules/RCTClipboard.mm

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


RCT_EXPORT_METHOD(setString:(NSString *)content)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
#else // [TODO(macOS ISS#2323203)
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  [pasteboard setString:(content ? : @"") forType:NSPasteboardTypeString];
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(getString:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ? : @""));
#else // [TODO(macOS ISS#2323203)
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  resolve(([pasteboard stringForType:NSPasteboardTypeString] ? : @""));
#endif // ]TODO(macOS ISS#2323203)
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return std::make_shared<NativeClipboardSpecJSI>(self, jsInvoker);
}

@end

Class RCTClipboardCls(void) {
  return RCTClipboard.class;
}
