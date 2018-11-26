/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCreateMountItem.h"

#import "RCTComponentViewRegistry.h"

using namespace facebook::react;

@implementation RCTCreateMountItem {
  ComponentHandle _componentHandle;
  ReactTag _tag;
}

- (instancetype)initWithComponentHandle:(facebook::react::ComponentHandle)componentHandle
                                    tag:(ReactTag)tag
{
  if (self = [super init]) {
    _componentHandle = componentHandle;
    _tag = tag;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  [registry dequeueComponentViewWithComponentHandle:_componentHandle tag:_tag];
}

@end
