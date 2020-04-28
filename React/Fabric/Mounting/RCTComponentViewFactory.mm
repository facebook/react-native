/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewFactory.h"

#import <React/RCTAssert.h>
#import <better/map.h>
#import <better/mutex.h>

#import <react/core/ReactPrimitives.h>
#import <react/uimanager/ComponentDescriptorProviderRegistry.h>

#import "RCTActivityIndicatorViewComponentView.h"
#import "RCTImageComponentView.h"
#import "RCTModalHostViewComponentView.h"
#import "RCTParagraphComponentView.h"
#import "RCTPullToRefreshViewComponentView.h"
#import "RCTRootComponentView.h"
#import "RCTScrollViewComponentView.h"
#import "RCTSliderComponentView.h"
#import "RCTSwitchComponentView.h"
#import "RCTUnimplementedNativeComponentView.h"
#import "RCTViewComponentView.h"

using namespace facebook::react;

@implementation RCTComponentViewFactory {
  better::map<ComponentHandle, Class<RCTComponentViewProtocol>> _componentViewClasses;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (RCTComponentViewFactory *)standardComponentViewFactory
{
  RCTComponentViewFactory *componentViewFactory = [[RCTComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[RCTViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTScrollViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTPullToRefreshViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTImageComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTActivityIndicatorViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTSliderComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTSwitchComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTUnimplementedNativeComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTModalHostViewComponentView class]];

  return componentViewFactory;
}

- (void)registerComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses[componentDescriptorProvider.handle] = componentViewClass;
  _providerRegistry.add(componentDescriptorProvider);

  auto supplementalComponentDescriptorProviders = [componentViewClass supplementalComponentDescriptorProviders];
  for (const auto &provider : supplementalComponentDescriptorProviders) {
    _providerRegistry.add(provider);
  }
}

- (void)unregisterComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses.erase(componentDescriptorProvider.handle);
  _providerRegistry.remove(componentDescriptorProvider);
}

- (UIView<RCTComponentViewProtocol> *)createComponentViewWithComponentHandle:
    (facebook::react::ComponentHandle)componentHandle
{
  RCTAssertMainQueue();
  std::shared_lock<better::shared_mutex> lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  Class componentViewClass = iterator->second;
  return [[componentViewClass alloc] init];
}

- (facebook::react::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (facebook::react::ComponentDescriptorParameters)parameters
{
  std::shared_lock<better::shared_mutex> lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
