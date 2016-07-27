/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTStyleAnimatedNode.h"
#import "RCTAnimationUtils.h"
#import "RCTValueAnimatedNode.h"
#import "RCTTransformAnimatedNode.h"

@implementation RCTStyleAnimatedNode
{
  NSMutableDictionary<NSString *, NSNumber *> *_stylesDictionary;
  CATransform3D _transform;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config;
{
  if ((self = [super initWithTag:tag config:config])) {
    _stylesDictionary = [NSMutableDictionary new];
    _transform = CATransform3DIdentity;
  }
  return self;
}

- (void)performUpdate
{
  [super performUpdate];

  __block CATransform3D xform = CATransform3DIdentity;
  NSDictionary<NSString *, NSNumber *> *style = self.config[@"style"];
  [style enumerateKeysAndObjectsUsingBlock:^(NSString *property, NSNumber *nodeTag, __unused BOOL *stop) {
    RCTAnimatedNode *node = self.parentNodes[nodeTag];
    if (node) {
      if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
        RCTValueAnimatedNode *parentNode = (RCTValueAnimatedNode *)node;
        [_stylesDictionary setObject:@(parentNode.value) forKey:property];
      } else if ([node isKindOfClass:[RCTTransformAnimatedNode class]]) {
        RCTTransformAnimatedNode *parentNode = (RCTTransformAnimatedNode *)node;
        xform = CATransform3DConcat(xform, parentNode.transform);
      }
    }
  }];

  _transform = xform;
}

@end
