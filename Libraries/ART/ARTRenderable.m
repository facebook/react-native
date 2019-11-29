/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTRenderable.h>

@implementation ARTRenderable

- (void)setFill:(ARTBrush *)fill
{
  [self invalidate];
  _fill = fill;
}

- (void)setStroke:(CGColorRef)stroke
{
  if (stroke == _stroke) {
    return;
  }
  [self invalidate];
  CGColorRelease(_stroke);
  _stroke = CGColorRetain(stroke);
}

- (void)setStrokeWidth:(CGFloat)strokeWidth
{
  [self invalidate];
  _strokeWidth = strokeWidth;
}

- (void)setStrokeCap:(CGLineCap)strokeCap
{
  [self invalidate];
  _strokeCap = strokeCap;
}

- (void)setStrokeJoin:(CGLineJoin)strokeJoin
{
  [self invalidate];
  _strokeJoin = strokeJoin;
}

- (void)setStrokeDash:(ARTCGFloatArray)strokeDash
{
  if (strokeDash.array == _strokeDash.array) {
    return;
  }
  if (_strokeDash.array) {
    free(_strokeDash.array);
  }
  [self invalidate];
  _strokeDash = strokeDash;
}

- (void)dealloc
{
  CGColorRelease(_stroke);
  if (_strokeDash.array) {
    free(_strokeDash.array);
  }
}

- (void)renderTo:(CGContextRef)context
{
  if (self.opacity <= 0 || self.opacity >= 1 || (self.fill && self.stroke)) {
    // If we have both fill and stroke, we will need to paint this using normal compositing
    [super renderTo: context];
    return;
  }
  // This is a terminal with only one painting. Therefore we don't need to paint this
  // off-screen. We can just composite it straight onto the buffer.
  CGContextSaveGState(context);
  CGContextConcatCTM(context, self.transform);
  CGContextSetAlpha(context, self.opacity);
  [self renderLayerTo:context];
  CGContextRestoreGState(context);
}

- (void)renderLayerTo:(CGContextRef)context
{
  // abstract
}

@end
