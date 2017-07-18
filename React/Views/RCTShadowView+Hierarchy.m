/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "RCTShadowView+Hierarchy.h"

@implementation RCTShadowView (Hierarchy)

- (nullable RCTRootShadowView *)rootView
{
  RCTShadowView *view = self;
  while (view != nil && ![view isKindOfClass:[RCTRootShadowView class]]) {
    view = view.superview;
  }

  return (RCTRootShadowView *)view;
}

@end
