/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInsertMountItem.h"

#import "RCTComponentViewRegistry.h"

@implementation RCTInsertMountItem {
  ReactTag _childTag;
  ReactTag _parentTag;
  NSInteger _index;
}

- (instancetype)initWithChildTag:(ReactTag)childTag
                       parentTag:(ReactTag)parentTag
                           index:(NSInteger)index
{
  if (self = [super init]) {
    _childTag = childTag;
    _parentTag = parentTag;
    _index = index;
  }

  return self;
}

- (void)executeWithRegistry:(RCTComponentViewRegistry *)registry
{
  UIView<RCTComponentViewProtocol> *childComponentView = [registry componentViewByTag:_childTag];
  UIView<RCTComponentViewProtocol> *parentComponentView = [registry componentViewByTag:_parentTag];

  if (childComponentView == nil || parentComponentView == nil) {
    return;
  }

  [parentComponentView mountChildComponentView:childComponentView
                                         index:_index];
}

@end
