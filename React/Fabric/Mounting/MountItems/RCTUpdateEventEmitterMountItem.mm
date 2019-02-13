/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUpdateEventEmitterMountItem.h"

#import "RCTComponentViewRegistry.h"

using namespace facebook::react;

@implementation RCTUpdateEventEmitterMountItem {
  ReactTag _tag;
  SharedEventEmitter _eventEmitter;
}

- (instancetype)initWithTag:(ReactTag)tag
              eventEmitter:(SharedEventEmitter)eventEmitter
{
  if (self = [super init]) {
    _tag = tag;
    _eventEmitter = eventEmitter;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  [componentView updateEventEmitter:_eventEmitter];
}

@end
