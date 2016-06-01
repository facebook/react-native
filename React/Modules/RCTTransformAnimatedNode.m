/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTransformAnimatedNode.h"
#import "RCTAnimation.h"

@implementation RCTTransformAnimatedNode {
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
  
  NSDictionary *transforms = self.config[@"transform"];
  if (!transforms) {
    return;
  }
  for (NSString *property in transforms.allKeys) {
    NSNumber *nodeTag = transforms[property];
    RCTAnimatedNode *node = self.parentNodes[nodeTag];
    if (node && node.hasUpdated && [node isKindOfClass:[RCTValueAnimatedNode class]]) {
      RCTValueAnimatedNode *parentNode = (RCTValueAnimatedNode *)node;
      [_updatedPropsDictionary setObject:parentNode.value forKey:property];
    }
  }
}

- (void)cleanupAnimationUpdate {
  [super cleanupAnimationUpdate];
  [_updatedPropsDictionary removeAllObjects];
}

@end
