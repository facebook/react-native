/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTShape.h>

@implementation ARTShape

- (void)setD:(CGPathRef)d
{
  if (d == _d) {
    return;
  }
  [self invalidate];
  CGPathRelease(_d);
  _d = CGPathRetain(d);
}

- (void)dealloc
{
  CGPathRelease(_d);
}

- (void)renderLayerTo:(CGContextRef)context
{
  if ((!self.fill && !self.stroke) || !self.d) {
    return;
  }

  CGPathDrawingMode mode = kCGPathStroke;
  if (self.fill) {
    if ([self.fill applyFillColor:context]) {
      mode = kCGPathFill;
    } else {
      CGContextSaveGState(context);
      CGContextAddPath(context, self.d);
      CGContextClip(context);
      [self.fill paint:context];
      CGContextRestoreGState(context);
      if (!self.stroke) {
        return;
      }
    }
  }
  if (self.stroke) {
    CGContextSetStrokeColorWithColor(context, self.stroke);
    CGContextSetLineWidth(context, self.strokeWidth);
    CGContextSetLineCap(context, self.strokeCap);
    CGContextSetLineJoin(context, self.strokeJoin);
    ARTCGFloatArray dash = self.strokeDash;
    if (dash.count) {
      CGContextSetLineDash(context, 0, dash.array, dash.count);
    }
    if (mode == kCGPathFill) {
      mode = kCGPathFillStroke;
    }
  }

  CGContextAddPath(context, self.d);
  CGContextDrawPath(context, mode);
}

@end
