/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTStyleAnimatedNode.h>
#import <React/RCTAnimationUtils.h>
#import <React/RCTValueAnimatedNode.h>
#import <React/RCTTransformAnimatedNode.h>
#import <React/RCTColorAnimatedNode.h>

@implementation RCTStyleAnimatedNode
{
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config])) {
    _propsDictionary = [NSMutableDictionary new];
  }
  return self;
}

- (NSDictionary *)propsDictionary
{
  return _propsDictionary;
}

- (void)performUpdate
{
  [super performUpdate];

  NSDictionary<NSString *, NSNumber *> *style = self.config[@"style"];
  [style enumerateKeysAndObjectsUsingBlock:^(NSString *property, NSNumber *nodeTag, __unused BOOL *stop) {
    RCTAnimatedNode *node = [self.parentNodes objectForKey:nodeTag];
    if (node) {
      if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
        RCTValueAnimatedNode *valueAnimatedNode = (RCTValueAnimatedNode *)node;
        _propsDictionary[property] = @(valueAnimatedNode.value);
      } else if ([node isKindOfClass:[RCTTransformAnimatedNode class]]) {
        RCTTransformAnimatedNode *transformAnimatedNode = (RCTTransformAnimatedNode *)node;
        [_propsDictionary addEntriesFromDictionary:transformAnimatedNode.propsDictionary];
      } else if ([node isKindOfClass:[RCTColorAnimatedNode class]]) {
        RCTColorAnimatedNode *colorAnimatedNode = (RCTColorAnimatedNode *)node;
        _propsDictionary[property] = @(colorAnimatedNode.color);
      }
    }
  }];
}

@end
