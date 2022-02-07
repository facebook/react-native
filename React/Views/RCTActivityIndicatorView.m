/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTActivityIndicatorView.h"

@implementation RCTActivityIndicatorView {
}

- (void)setHidden:(BOOL)hidden
{
  if ([self hidesWhenStopped] && ![self isAnimating]) {
    [super setHidden:YES];
  } else {
    [super setHidden:hidden];
  }
}

@end
