/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ARTShape.h"

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
  if ((!self.fill && !self.stroke && !self.gradientStroke.count) || !self.d) {
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
  
  if (self.stroke && !self.gradientStroke.count) {
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
    CGContextAddPath(context, self.d);
  }
  
  if (self.gradientStroke.count) {
    CGFloat* colors = self.gradientStroke.array;
    CGContextAddPath(context, self.d);
    CGRect rect = CGContextGetPathBoundingBox(context);
    CGRect insettedRect = CGRectInset(rect, -(self.strokeWidth/2), -(self.strokeWidth/2));

    CGColorSpaceRef baseSpace = CGColorSpaceCreateDeviceRGB();
    CGGradientRef gradient = CGGradientCreateWithColorComponents(baseSpace, colors, NULL, self.gradientStroke.count/4);
    CGColorSpaceRelease(baseSpace), baseSpace = NULL;
    
    CGContextSetLineWidth(context, self.strokeWidth);
    CGContextSetLineCap(context, self.strokeCap);
    CGContextSetLineJoin(context, self.strokeJoin);
    
    CGContextReplacePathWithStrokedPath(context);
    CGContextClip(context);
    
    // Define the start and end points for the gradient
    // This determines the direction in which the gradient is drawn
    CGPoint startPoint = CGPointMake(CGRectGetMinX(insettedRect), CGRectGetMinY(insettedRect));
    CGPoint endPoint = CGPointMake(CGRectGetMaxX(insettedRect), CGRectGetMinY(insettedRect));
    

    CGContextDrawLinearGradient(context, gradient, startPoint, endPoint, 0);
    CGGradientRelease(gradient), gradient = NULL;
  }

  CGContextDrawPath(context, mode);
}

@end
