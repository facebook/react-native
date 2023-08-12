/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#import "objc/runtime.h"
#import <React/RCTAssert.h>
#import <React/RCTUtils.h>
#import <RCTConvert.h>
#import <RCTHandledKey.h>
#import <RCTViewKeyboardEvent.h>

#if TARGET_OS_OSX

@implementation RCTHandledKey

+ (NSArray<NSString *> *)validModifiers {
  // keep in sync with actual properties and RCTViewKeyboardEvent
  return @[@"altKey", @"ctrlKey", @"metaKey", @"shiftKey"];
}

+ (BOOL)event:(NSEvent *)event matchesFilter:(NSArray<RCTHandledKey *> *)filter {
  for (RCTHandledKey *key in filter) {
	if ([key matchesEvent:event]) {
	  return YES;
	}
  }

  return NO;
}

+ (BOOL)key:(NSString *)key matchesFilter:(NSArray<RCTHandledKey *> *)filter {
  for (RCTHandledKey *aKey in filter) {
	if ([[aKey key] isEqualToString:key]) {
	  return YES;
	}
  }

  return NO;
}

- (instancetype)initWithKey:(NSString *)key {
  if ((self = [super init])) {
    self.key = key;
  }
  return self;
}

- (BOOL)matchesEvent:(NSEvent *)event
{
  NSEventType type = [event type];
  if (type != NSEventTypeKeyDown && type != NSEventTypeKeyUp) {
    RCTFatal(RCTErrorWithMessage([NSString stringWithFormat:@"Wrong event type (%d) sent to -[RCTHandledKey matchesEvent:]", (int)type]));
    return NO;
  }

  NSDictionary *body = [RCTViewKeyboardEvent bodyFromEvent:event];
  NSString *key = body[@"key"];
  if (key == nil) {
    RCTFatal(RCTErrorWithMessage(@"Event body has missing value for 'key'"));
    return NO;
  }

  if (![key isEqualToString:self.key]) {
    return NO;
  }

  NSArray<NSString *> *modifiers = [RCTHandledKey validModifiers];
  for (NSString *modifier in modifiers) {
    NSNumber *myValue = [self valueForKey:modifier];

    if (myValue == nil) {
		continue;
	}

	NSNumber *eventValue = (NSNumber *)body[modifier];
	if (eventValue == nil) {
		RCTFatal(RCTErrorWithMessage([NSString stringWithFormat:@"Event body has missing value for '%@'", modifier]));
		return NO;
	}

	if (![eventValue isKindOfClass:[NSNumber class]]) {
		RCTFatal(RCTErrorWithMessage([NSString stringWithFormat:@"Event body has unexpected value of class '%@' for '%@'",
			NSStringFromClass(object_getClass(eventValue)), modifier]));
		return NO;
    }

	if (![myValue isEqualToNumber:body[modifier]]) {
		return NO;
	}
  }

  return YES;  // keys matched; all present modifiers matched
}

@end

@implementation RCTConvert (RCTHandledKey)

+ (RCTHandledKey *)RCTHandledKey:(id)json
{
  // legacy way of specifying validKeysDown and validKeysUp -- here we ignore the modifiers when comparing to the NSEvent
  if ([json isKindOfClass:[NSString class]]) {
    return [[RCTHandledKey alloc] initWithKey:(NSString *)json];
  }

  // modern way of specifying validKeys and validKeysUp -- here we assume missing modifiers to mean false\NO
  if ([json isKindOfClass:[NSDictionary class]]) {
    NSDictionary *dict = (NSDictionary *)json;
    NSString *key = dict[@"key"];
    if (key == nil) {
      RCTLogConvertError(dict, @"a RCTHandledKey -- must include \"key\"");
      return nil;
    }

	RCTHandledKey *handledKey = [[RCTHandledKey alloc] initWithKey:key];
    NSArray<NSString *> *modifiers = RCTHandledKey.validModifiers;
    for (NSString *key in modifiers) {
      id value = dict[key];
      if (value == nil) {
        value = @NO;	// assume NO -- instead of nil i.e. "don't care" unlike the string case above.
	  }

      if (![value isKindOfClass:[NSNumber class]]) {
        RCTLogConvertError(value, @"a boolean");
        return nil;
      }

      [handledKey setValue:@([(NSNumber *)value boolValue]) forKey:key];
    }

    return handledKey;
  }

  RCTLogConvertError(json, @"a RCTHandledKey -- allowed types are string and object");
  return nil;
}

@end

#endif
