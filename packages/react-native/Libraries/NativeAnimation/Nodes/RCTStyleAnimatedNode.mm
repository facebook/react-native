/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTAnimationUtils.h>
#import <React/RCTColorAnimatedNode.h>
#import <React/RCTObjectAnimatedNode.h>
#import <React/RCTStyleAnimatedNode.h>
#import <React/RCTTransformAnimatedNode.h>
#import <React/RCTValueAnimatedNode.h>

@implementation RCTStyleAnimatedNode {
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config]) != nullptr) {
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
    if (node != nullptr) {
      if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
        RCTValueAnimatedNode *valueAnimatedNode = (RCTValueAnimatedNode *)node;
        id animatedObject = valueAnimatedNode.animatedObject;
        if (animatedObject != nullptr) {
          _propsDictionary[property] = animatedObject;
        } else {
          _propsDictionary[property] = @(valueAnimatedNode.value);
        }
      } else if ([node isKindOfClass:[RCTTransformAnimatedNode class]]) {
        RCTTransformAnimatedNode *transformAnimatedNode = (RCTTransformAnimatedNode *)node;
        [_propsDictionary addEntriesFromDictionary:transformAnimatedNode.propsDictionary];
      } else if ([node isKindOfClass:[RCTColorAnimatedNode class]]) {
        RCTColorAnimatedNode *colorAnimatedNode = (RCTColorAnimatedNode *)node;
        _propsDictionary[property] = @(colorAnimatedNode.color);
      } else if ([node isKindOfClass:[RCTObjectAnimatedNode class]]) {
        RCTObjectAnimatedNode *objectAnimatedNode = (RCTObjectAnimatedNode *)node;
        _propsDictionary[property] = objectAnimatedNode.value;
      }
    }
  }];
}

@end
