/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUpdateStateMountItem.h"

#import "RCTComponentViewRegistry.h"

using namespace facebook::react;

@implementation RCTUpdateStateMountItem {
  ReactTag _tag;
  State::Shared _oldState;
  State::Shared _newState;
}

- (instancetype)initWithTag:(ReactTag)tag
                   oldState:(facebook::react::State::Shared)oldState
                   newState:(facebook::react::State::Shared)newState
{
  if (self = [super init]) {
    _tag = tag;
    _oldState = oldState;
    _newState = newState;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];
  [componentView updateState:_newState oldState:_oldState];
}

@end
