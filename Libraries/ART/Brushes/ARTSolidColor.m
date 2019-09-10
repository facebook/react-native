/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTSolidColor.h>

#import <React/RCTLog.h>

#import "RCTConvert+ART.h"

@implementation ARTSolidColor
{
  CGColorRef _color;
}

- (instancetype)initWithArray:(NSArray<NSNumber *> *)array
{
  if ((self = [super initWithArray:array])) {
    _color = CGColorRetain([RCTConvert CGColor:array offset:1]);
  }
  return self;
}

- (void)dealloc
{
  CGColorRelease(_color);
}

- (BOOL)applyFillColor:(CGContextRef)context
{
  CGContextSetFillColorWithColor(context, _color);
  return YES;
}

@end
