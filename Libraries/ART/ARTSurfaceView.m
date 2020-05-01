/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTSurfaceView.h>

#import <React/RCTLog.h>

#import <React/ARTNode.h>

@implementation ARTSurfaceView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.opaque = NO;
  }

  return self;
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeReactSubview:(UIView *)subview
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
  [super drawRect:rect];
  CGContextRef context = UIGraphicsGetCurrentContext();
  for (UIView *subview in self.subviews) {
    if ([subview respondsToSelector:@selector(renderTo:)]) {
      [(ARTNode *)subview renderTo:context];
    } else {
      // This is needed for legacy interop layer. Legacy interop layer
      // is superview of the view that it is bridging, that's why we need
      // to grab its first subview.
      [(ARTNode *)subview.subviews.firstObject renderTo:context];
    }
  }
}

@end
