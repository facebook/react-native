/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTRadialGradient.h>

#import <React/RCTLog.h>

#import "RCTConvert+ART.h"

@implementation ARTRadialGradient
{
  CGGradientRef _gradient;
  CGPoint _focusPoint;
  CGPoint _centerPoint;
  CGFloat _radius;
  CGFloat _radiusRatio;
}

- (instancetype)initWithArray:(NSArray<NSNumber *> *)array
{
  if ((self = [super initWithArray:array])) {
    if (array.count < 7) {
      RCTLogError(@"-[%@ %@] expects 7 elements, received %@",
                  self.class, NSStringFromSelector(_cmd), array);
      return nil;
    }
    _radius = [RCTConvert CGFloat:array[3]];
    _radiusRatio = [RCTConvert CGFloat:array[4]] / _radius;
    _focusPoint.x = [RCTConvert CGFloat:array[1]];
    _focusPoint.y = [RCTConvert CGFloat:array[2]] / _radiusRatio;
    _centerPoint.x = [RCTConvert CGFloat:array[5]];
    _centerPoint.y = [RCTConvert CGFloat:array[6]] / _radiusRatio;
    _gradient = CGGradientRetain([RCTConvert CGGradient:array offset:7]);
  }
  return self;
}

- (void)dealloc
{
  CGGradientRelease(_gradient);
}

- (void)paint:(CGContextRef)context
{
  CGAffineTransform transform = CGAffineTransformMakeScale(1, _radiusRatio);
  CGContextConcatCTM(context, transform);
  CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;
  CGContextDrawRadialGradient(context, _gradient, _focusPoint, 0, _centerPoint, _radius, extendOptions);
}

@end
