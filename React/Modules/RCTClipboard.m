/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTClipboard.h"

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

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
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ? : @""));
#else // [TODO(macOS ISS#2323203)
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  resolve(([pasteboard stringForType:NSPasteboardTypeString] ? : @""));
#endif // ]TODO(macOS ISS#2323203)
}

@end
