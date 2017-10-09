/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextSelection.h"

@implementation RCTTextSelection

- (instancetype)initWithStart:(NSInteger)start end:(NSInteger)end
{
  if (self = [super init]) {
    _start = start;
    _end = end;
  }
  return self;
}

@end

@implementation RCTConvert (RCTTextSelection)

+ (RCTTextSelection *)RCTTextSelection:(id)json
{
  if ([json isKindOfClass:[NSDictionary class]]) {
    NSInteger start = [self NSInteger:json[@"start"]];
    NSInteger end = [self NSInteger:json[@"end"]];
    return [[RCTTextSelection alloc] initWithStart:start end:end];
  }

  return nil;
}

@end
