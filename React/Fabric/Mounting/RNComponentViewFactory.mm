/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNComponentViewFactory.h"

#import <React/RCTAssert.h>
#import <better/map.h>
#import <better/mutex.h>

#import <react/core/ReactPrimitives.h>
#import <react/uimanager/ComponentDescriptorProviderRegistry.h>

#import "RNActivityIndicatorViewComponentView.h"
#import "RNImageComponentView.h"
#import "RNModalHostViewComponentView.h"
#import "RNParagraphComponentView.h"
#import "RNPullToRefreshViewComponentView.h"
#import "RNRootComponentView.h"
#import "RNScrollViewComponentView.h"
#import "RNSliderComponentView.h"
#import "RNSwitchComponentView.h"
#import "RNUnimplementedNativeComponentView.h"
#import "RNViewComponentView.h"

using namespace facebook::react;

@implementation RNComponentViewFactory {
  better::map<ComponentHandle, Class<RNComponentViewProtocol>> _componentViewClasses;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (RNComponentViewFactory *)standardComponentViewFactory
{
  RNComponentViewFactory *componentViewFactory = [[RNComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[RNViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNScrollViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNPullToRefreshViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNImageComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNActivityIndicatorViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNSliderComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNSwitchComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNUnimplementedNativeComponentView class]];
  [componentViewFactory registerComponentViewClass:[RNModalHostViewComponentView class]];

  return componentViewFactory;
}

- (void)registerComponentViewClass:(Class<RNComponentViewProtocol>)componentViewClass
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

- (void)unregisterComponentViewClass:(Class<RNComponentViewProtocol>)componentViewClass
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses.erase(componentDescriptorProvider.handle);
  _providerRegistry.remove(componentDescriptorProvider);
}

- (UIView<RNComponentViewProtocol> *)createComponentViewWithComponentHandle:
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
