/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUpdateLayoutMetricsMountItem.h"

#import "RCTComponentViewRegistry.h"

using namespace facebook::react;

@implementation RCTUpdateLayoutMetricsMountItem {
  ReactTag _tag;
  LayoutMetrics _oldLayoutMetrics;
  LayoutMetrics _newLayoutMetrics;
}

- (instancetype)initWithTag:(ReactTag)tag
           oldLayoutMetrics:(facebook::react::LayoutMetrics)oldLayoutMetrics
           newLayoutMetrics:(facebook::react::LayoutMetrics)newLayoutMetrics
{
  if (self = [super init]) {
    _tag = tag;
    _oldLayoutMetrics = oldLayoutMetrics;
    _newLayoutMetrics = newLayoutMetrics;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  [componentView updateLayoutMetrics:_newLayoutMetrics
                    oldLayoutMetrics:_oldLayoutMetrics];
}

@end
