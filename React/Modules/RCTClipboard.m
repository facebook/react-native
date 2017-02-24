/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTClipboard.h"

#import <UIKit/UIKit.h>

@implementation RCTClipboard

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"clipboardChanged"];
}

- (void)startObserving {
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self selector:@selector(clipboardChanged:) name:UIPasteboardChangedNotification object:[UIPasteboard generalPasteboard]];
  [nc addObserver:self selector:@selector(clipboardChanged:) name:UIPasteboardRemovedNotification object:[UIPasteboard generalPasteboard]];
}

- (void)stopObserving {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)clipboardChanged:(NSNotification*)notification{
  [self sendEventWithName:@"clipboardChanged" body:nil];
}

RCT_EXPORT_METHOD(setString:(NSString *)content)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

RCT_EXPORT_METHOD(getString:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ? : @""));
}

@end
