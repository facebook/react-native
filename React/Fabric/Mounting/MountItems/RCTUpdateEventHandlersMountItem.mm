/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUpdateEventHandlersMountItem.h"

#import "RCTComponentViewRegistry.h"

using namespace facebook::react;

@implementation RCTUpdateEventHandlersMountItem {
  ReactTag _tag;
  SharedEventHandlers _eventHandlers;
}

- (instancetype)initWithTag:(ReactTag)tag
              eventHandlers:(SharedEventHandlers)eventHandlers
{
  if (self = [super init]) {
    _tag = tag;
    _eventHandlers = eventHandlers;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  [componentView updateEventHandlers:_eventHandlers];
}

@end
