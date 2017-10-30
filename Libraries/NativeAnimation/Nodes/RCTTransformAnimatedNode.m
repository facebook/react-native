/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTransformAnimatedNode.h"
#import "RCTValueAnimatedNode.h"

@implementation RCTTransformAnimatedNode
{
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config;
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

  NSArray<NSDictionary *> *transformConfigs = self.config[@"transforms"];
  NSMutableArray<NSDictionary *> *transform = [NSMutableArray arrayWithCapacity:transformConfigs.count];
  for (NSDictionary *transformConfig in transformConfigs) {
    NSString *type = transformConfig[@"type"];
    NSString *property = transformConfig[@"property"];
    NSNumber *value;
    if ([type isEqualToString: @"animated"]) {
      NSNumber *nodeTag = transformConfig[@"nodeTag"];
      RCTAnimatedNode *node = [self.parentNodes objectForKey:nodeTag];
      if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
        continue;
      }
      RCTValueAnimatedNode *parentNode = (RCTValueAnimatedNode *)node;
      value = @(parentNode.value);
    } else {
      value = transformConfig[@"value"];
    }
    [transform addObject:@{property: value}];
  }

  _propsDictionary[@"transform"] = transform;
}

@end
