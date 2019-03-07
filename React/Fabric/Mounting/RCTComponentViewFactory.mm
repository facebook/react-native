/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewFactory.h"

#import <React/RCTAssert.h>
#import <react/core/ReactPrimitives.h>

#import "RCTActivityIndicatorViewComponentView.h"
#import "RCTImageComponentView.h"
#import "RCTParagraphComponentView.h"
#import "RCTRootComponentView.h"
#import "RCTScrollViewComponentView.h"
#import "RCTSliderComponentView.h"
#import "RCTSwitchComponentView.h"
#import "RCTViewComponentView.h"

using namespace facebook::react;

@implementation RCTComponentViewFactory {
  std::unordered_map<ComponentHandle, Class<RCTComponentViewProtocol>> _registry;
}

+ (RCTComponentViewFactory *)standardComponentViewFactory
{
  RCTAssertMainQueue();

  RCTComponentViewFactory *componentViewFactory = [[RCTComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[RCTViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTScrollViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTImageComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTActivityIndicatorViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTSliderComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTSwitchComponentView class]];

  return componentViewFactory;
}

- (void)registerComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass
{
  RCTAssertMainQueue();

  ComponentHandle componentHandle = [componentViewClass componentHandle];
  _registry[componentHandle] = componentViewClass;
}

- (UIView<RCTComponentViewProtocol> *)createComponentViewWithComponentHandle:
    (facebook::react::ComponentHandle)componentHandle
{
  RCTAssertMainQueue();

  auto iterator = _registry.find(componentHandle);
  RCTAssert(
      iterator != _registry.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  Class componentViewClass = iterator->second;
  return [[componentViewClass alloc] init];
}

@end
