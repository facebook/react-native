/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPair.h"

@interface RCTPair ()

@property (nonatomic, strong, readwrite) id first;
@property (nonatomic, strong, readwrite) id second;

@end

@implementation RCTPair

- (instancetype)initWithFirst:(id)first second:(id)second {
  self = [super init];
  if (self) {
    _first = first;
    _second = second;
  }
  return self;
}

@end
