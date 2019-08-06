/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ARTSurfaceView.h"

#import <React/RCTLog.h>

#import "ARTNode.h"

@implementation ARTSurfaceView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.opaque = NO;
  }

  return self;
}

- (void)insertReactSubview:(RCTUIView *)subview atIndex:(NSInteger)atIndex // TODO(macOS ISS#3536887)
{
  [super insertReactSubview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeReactSubview:(RCTUIView *)subview // TODO(macOS ISS#3536887)
{
  [super removeReactSubview:subview];
  [self invalidate];
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are inserted by insertReactSubview:
}

- (void)invalidate
{
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  [super drawRect:rect];
#endif // ]TODO(macOS ISS#2323203)
  CGContextRef context = UIGraphicsGetCurrentContext();
  for (ARTNode *node in self.subviews) {
    [node renderTo:context];
  }
}

@end
