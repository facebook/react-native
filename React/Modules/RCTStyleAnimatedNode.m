/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTStyleAnimatedNode.h"
#import "RCTAnimation.h"

@implementation RCTStyleAnimatedNode {
  NSMutableDictionary *_updatedPropsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary *)config {
  self = [super initWithTag:tag config:config];
  if (self) {
    _updatedPropsDictionary = [NSMutableDictionary new];
  }
  return self;
}

- (NSDictionary *)updatedPropsDictionary {
  return _updatedPropsDictionary;
}

- (void)performUpdate {
  [super performUpdate];
  
  NSDictionary *style = self.config[@"style"];
  if (!style) {
    return;
  }
  
  for (NSString *property in style.allKeys) {
    NSNumber *nodeTag = style[property];
    RCTAnimatedNode *node = self.parentNodes[nodeTag];
    if (node && node.hasUpdated) {
      if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
        RCTValueAnimatedNode *parentNode = (RCTValueAnimatedNode *)node;
        [_updatedPropsDictionary setObject:parentNode.value forKey:property];
      }
      if ([node isKindOfClass:[RCTTransformAnimatedNode class]]) {
        RCTTransformAnimatedNode *parentNode = (RCTTransformAnimatedNode *)node;
        if (parentNode.updatedPropsDictionary.count) {
          [_updatedPropsDictionary addEntriesFromDictionary:parentNode.updatedPropsDictionary];
        }
      }
    }
  }
}

- (void)cleanupAnimationUpdate {
  [super cleanupAnimationUpdate];
  [_updatedPropsDictionary removeAllObjects];
}

@end
