/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ARTBrush.h"

#import <React/RCTDefines.h>

@implementation ARTBrush

- (instancetype)initWithArray:(NSArray *)data
{
  return [super init];
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (BOOL)applyFillColor:(CGContextRef)context
{
  return NO;
}

- (void)paint:(CGContextRef)context
{
  // abstract
}

@end
