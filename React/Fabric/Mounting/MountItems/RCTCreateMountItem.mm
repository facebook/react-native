/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCreateMountItem.h"

#import "RCTComponentViewRegistry.h"

@implementation RCTCreateMountItem {
  NSString *_componentName;
  ReactTag _tag;
}

- (instancetype)initWithComponentName:(NSString *)componentName
                                  tag:(ReactTag)tag
{
  if (self = [super init]) {
    _componentName = componentName;
    _tag = tag;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  [registry dequeueComponentViewWithName:_componentName tag:_tag];
}

@end
