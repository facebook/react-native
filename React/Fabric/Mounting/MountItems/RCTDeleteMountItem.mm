/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDeleteMountItem.h"

#import "RCTComponentViewRegistry.h"

@implementation RCTDeleteMountItem {
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
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  if (componentView == nil) {
    return;
  }

  [registry enqueueComponentViewWithName:_componentName tag:_tag componentView:componentView];
}

@end
