/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ARTSolidColor.h"

#import "RCTConvert+ART.h"
#import "RCTLog.h"

@implementation ARTSolidColor
{
  CGColorRef _color;
}

- (instancetype)initWithArray:(NSArray *)array
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
