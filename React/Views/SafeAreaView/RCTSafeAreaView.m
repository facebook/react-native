/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSafeAreaView.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

#import "RCTSafeAreaViewLocalData.h"

@implementation RCTSafeAreaView {
  RCTBridge *_bridge;
  UIEdgeInsets _currentSafeAreaInsets;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)decoder)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */

static BOOL UIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold) {
  return
    ABS(insets1.left - insets2.left) <= threshold &&
    ABS(insets1.right - insets2.right) <= threshold &&
    ABS(insets1.top - insets2.top) <= threshold &&
    ABS(insets1.bottom - insets2.bottom) <= threshold;
}

- (void)safeAreaInsetsDidChange
{
  if (![self respondsToSelector:@selector(safeAreaInsets)]) {
    return;
  }

  UIEdgeInsets safeAreaInsets = self.safeAreaInsets;

  if (UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale())) {
    return;
  }

  _currentSafeAreaInsets = safeAreaInsets;

  RCTSafeAreaViewLocalData *localData =
    [[RCTSafeAreaViewLocalData alloc] initWithInsets:safeAreaInsets];
  [_bridge.uiManager setLocalData:localData forView:self];
}

#endif

@end
