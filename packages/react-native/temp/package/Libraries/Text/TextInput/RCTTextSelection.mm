/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextSelection.h>

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
