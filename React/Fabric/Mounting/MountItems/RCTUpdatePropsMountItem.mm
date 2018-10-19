/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUpdatePropsMountItem.h"

#import "RCTComponentViewRegistry.h"

using namespace facebook::react;

@implementation RCTUpdatePropsMountItem {
  ReactTag _tag;
  SharedProps _oldProps;
  SharedProps _newProps;
}

- (instancetype)initWithTag:(ReactTag)tag
                   oldProps:(SharedProps)oldProps
                   newProps:(SharedProps)newProps
{
  if (self = [super init]) {
    _tag = tag;
    _oldProps = oldProps;
    _newProps = newProps;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  UIView<RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];
  [componentView updateProps:_newProps oldProps:_oldProps];
}

@end
