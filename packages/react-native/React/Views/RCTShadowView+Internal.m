/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTShadowView+Layout.h"

@interface RCTShadowView () {
  __weak RCTRootShadowView *_rootView;
}

@end

@implementation RCTShadowView (Internal)

- (void)setRootView:(RCTRootShadowView *)rootView
{
  _rootView = rootView;
}

@end
