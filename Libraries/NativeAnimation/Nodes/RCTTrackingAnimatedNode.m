/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTrackingAnimatedNode.h"
#import "RCTValueAnimatedNode.h"
#import "RCTNativeAnimatedNodesManager.h"

@implementation RCTTrackingAnimatedNode

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config;
{
  if ((self = [super initWithTag:tag config:config])) {

  }
  return self;
}

- (void)performUpdate
{
  [super performUpdate];

  NSNumber *nodeTag = self.config[@"toValue"];
  RCTValueAnimatedNode *node = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:nodeTag];

  NSNumber *animationId = self.config[@"animationId"];
  NSNumber *valueNodeTag = self.config[@"value"];

  NSMutableDictionary *config = [NSMutableDictionary dictionaryWithDictionary:self.config[@"animationConfig"]];
  [config setValue:@(node.value) forKey:@"toValue"];

  [self schedulePostUpdate:^(RCTNativeAnimatedNodesManager *manager) {
    [manager startAnimatingNode:animationId
                        nodeTag:valueNodeTag
                         config:config
                    endCallback:nil];
  }];
}

@end

