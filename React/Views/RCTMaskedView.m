/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMaskedView.h"
#import "UIView+React.h"

@implementation RCTMaskedView

- (void)didUpdateReactSubviews
{
  [super didUpdateReactSubviews];
 
  // We have to reset the maskView to nil in case the mask
  // element changes -- iOS requires it to be fully reset.
  self.maskView = nil;
  
  // RCTMaskedView expects that the first subview rendered is the mask.
  UIView *maskView = [self.reactSubviews firstObject];
  // It needs to be removed from the superview before it can be set as a mask.
  [maskView removeFromSuperview];
  self.maskView = maskView;
}

- (void)displayLayer:(CALayer *)layer
{
  // RCTView uses displayLayer to do border rendering.
  // We don't need to do that in RCTMaskedView, so we
  // stub this method and override the default implementation.
}

@end
