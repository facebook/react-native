/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTComponentEvent.h"

#import "RCTAssert.h"

@implementation RCTComponentEvent
{
  NSArray *_arguments;
}

@synthesize eventName = _eventName;
@synthesize viewTag = _viewTag;

- (instancetype)initWithName:(NSString *)name body:(NSDictionary *)body
{
  if (self = [super init]) {
    NSNumber *target = body[@"target"];
    name = RCTNormalizeInputEventName(name);
    
    if (RCT_DEBUG) {
      RCTAssert([target isKindOfClass:[NSNumber class]],
                @"Event body dictionary must include a 'target' property containing a React tag");
    }
    
    _eventName = name;
    _viewTag = target;
    _arguments = @[target, name, body];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (NSArray *)arguments
{
  return _arguments;
}

- (BOOL)canCoalesce
{
  return NO;
}

+ (NSString *)moduleDotMethod
{
  return @"RCTEventEmitter.receiveEvent";
}

@end
