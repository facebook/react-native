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

RCT_EXPORT_METHOD(getClipboardString:(RCTResponseSenderBlock)callback)
{
  UIPasteboard *clipBoard = [UIPasteboard generalPasteboard];
  callback(@[clipBoard.string ? clipBoard.string : @""]);
}

RCT_EXPORT_METHOD(setClipboardString:(NSString *)content)
{
  if (content) {
    UIPasteboard *clipBoard = [UIPasteboard generalPasteboard];
    clipBoard.string = content;
  }
}

@end
