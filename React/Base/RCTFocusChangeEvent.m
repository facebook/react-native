/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFocusChangeEvent.h"

#import "RCTAssert.h"

@implementation RCTFocusChangeEvent

+ (instancetype)focusEventWithReactTag:(NSNumber *)reactTag
{
  RCTFocusChangeEvent *event = [[self alloc] initWithName:@"focus"
                                                  viewTag:reactTag
                                                     body:@{}];
  return event;
}

+ (instancetype)blurEventWithReactTag:(NSNumber *)reactTag
{
  RCTFocusChangeEvent *event = [[self alloc] initWithName:@"blur"
                                                  viewTag:reactTag
                                                     body:@{}];
  return event;
}

@end
