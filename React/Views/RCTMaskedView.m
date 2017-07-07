/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMaskedView.h"

@implementation RCTMaskedView {
  UIView *_reactMaskView;
}

- (void) layoutSubviews
{
  [super layoutSubviews];
  
  // When a mask is set on this view, we need to make sure
  // the mask view isn't in the view hierarchy (iOS won't use
  // the view as a mask if it exists in the view hierarchy).
  // Then reset the `maskView` property to make sure that
  // the mask is set correctly.
  if (_reactMaskView != nil) {
    if (_reactMaskView.superview != nil) {
      [_reactMaskView removeFromSuperview];
    }
    self.maskView = _reactMaskView;
  }
}

- (void)displayLayer:(CALayer *)layer
{
  // RCTView uses displayLayer to do border rendering.
  // We don't need to do that in RCTMaskedView, so we
  // stub this method and override the default implementation.
}

- (void)setReactMaskView:(UIView*)view
{
  _reactMaskView = view;
}

@end
