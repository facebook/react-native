/**
 * Copyright (c) Facebook, Inc. and its affilities.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentEvent.h"

#import "RCTAssert.h"

@implementation RCTComponentEvent
{
  NSArray *_arguments;
}

@synthesize eventName = _eventName;
@synthesize viewTag = _viewTag;

- (instancetype)initWithName:(NSString *)name viewTag:(NSNumber *)viewTag body:(NSDictionary *)body
{
  if (self = [super init]) {
    NSMutableDictionary *mutableBody = [NSMutableDictionary dictionaryWithDictionary:body];
    mutableBody[@"target"] = viewTag;

    _eventName = RCTNormalizeInputEventName(name);
    _viewTag = viewTag;
    _arguments = @[_viewTag, _eventName, mutableBody];
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
