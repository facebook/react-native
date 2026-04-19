/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTObjectAnimatedNode.h"
#import "RCTValueAnimatedNode.h"

NSString *const VALUE_KEY = @"value";
NSString *const NODE_TAG_KEY = @"nodeTag";

@implementation RCTObjectAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  id value = self.config[VALUE_KEY];
  if ([value isKindOfClass:[NSDictionary class]]) {
    _value = [self _performUpdateHelperDictionary:(NSDictionary *)value];
  } else if ([value isKindOfClass:[NSArray class]]) {
    _value = [self _performUpdateHelperArray:(NSArray *)value];
  }
}

- (NSDictionary<NSString *, id> *)_performUpdateHelperDictionary:(NSDictionary<NSString *, id> *)source
{
  NSMutableDictionary<NSString *, id> *result = [NSMutableDictionary new];
  for (NSString *key in source) {
    result[key] = [self _convertValue:source[key]];
  }
  return result;
}

- (NSArray *)_performUpdateHelperArray:(NSArray *)source
{
  NSMutableArray *result = [NSMutableArray array];
  for (id value in source) {
    [result addObject:[self _convertValue:value]];
  }
  return result;
}

- (id)_convertValue:(id)value
{
  if ([value isKindOfClass:[NSDictionary class]]) {
    NSDictionary<NSString *, id> *dict = (NSDictionary *)value;
    id nodeTag = [dict objectForKey:NODE_TAG_KEY];
    if ((nodeTag != nullptr) && [nodeTag isKindOfClass:[NSNumber class]]) {
      RCTAnimatedNode *node = [self.parentNodes objectForKey:(NSNumber *)nodeTag];
      if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
        RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
        return @(valueNode.value);
      }
    }
    return [self _performUpdateHelperDictionary:dict];
  } else if ([value isKindOfClass:[NSArray class]]) {
    return [self _performUpdateHelperArray:(NSArray *)value];
  } else {
    return value;
  }
}

@end
