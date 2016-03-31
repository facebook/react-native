/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModalHostViewManager.h"

#import "RCTBridge.h"
#import "RCTModalHostView.h"
#import "RCTTouchHandler.h"

@implementation RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

RCT_EXPORT_MODULE()

- (UIView *)view
{
  UIView *view = [[RCTModalHostView alloc] initWithBridge:self.bridge];
  if (_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)invalidate
{
  for (RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onShow, RCTDirectEventBlock)

@end
