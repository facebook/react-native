/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewFactory.h"

#import <React/RCTAssert.h>
#import <React/RCTConversions.h>

#import <better/map.h>
#import <better/mutex.h>

#import <react/core/ReactPrimitives.h>
#import <react/uimanager/ComponentDescriptorProviderRegistry.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTFabricComponentPlugin/RCTFabricPluginProvider.h>
#else
#import "RCTFabricComponentsPlugins.h"
#endif

#import "RCTComponentViewClassDescriptor.h"
#import "RCTFabricComponentsPlugins.h"
#import "RCTImageComponentView.h"
#import "RCTLegacyViewManagerInteropComponentView.h"
#import "RCTMountingTransactionObserving.h"
#import "RCTParagraphComponentView.h"
#import "RCTRootComponentView.h"
#import "RCTTextInputComponentView.h"
#import "RCTUnimplementedViewComponentView.h"
#import "RCTViewComponentView.h"

#import <objc/runtime.h>

using namespace facebook::react;

static Class<RCTComponentViewProtocol> RCTComponentViewClassWithName(const char *componentName)
{
  return RCTFabricComponentsProvider(componentName);
}

@implementation RCTComponentViewFactory {
  better::map<ComponentHandle, RCTComponentViewClassDescriptor> _componentViewClasses;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (RCTComponentViewFactory *)standardComponentViewFactory
{
  RCTComponentViewFactory *componentViewFactory = [[RCTComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[RCTRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[RCTTextInputComponentView class]];

  Class<RCTComponentViewProtocol> imageClass = RCTComponentViewClassWithName("Image");
  [componentViewFactory registerComponentViewClass:imageClass];

  auto providerRegistry = &componentViewFactory->_providerRegistry;

  providerRegistry->setComponentDescriptorProviderRequest(
      [providerRegistry, componentViewFactory](ComponentName requestedComponentName) {
        // Fallback 1: Call provider function for component view class.
        Class<RCTComponentViewProtocol> klass = RCTComponentViewClassWithName(requestedComponentName);
        if (klass) {
          [componentViewFactory registerComponentViewClass:klass];
          return;
        }

        // Fallback 2: Try to use Paper Interop.
        if ([RCTLegacyViewManagerInteropComponentView isSupported:RCTNSStringFromString(requestedComponentName)]) {
          auto flavor = std::make_shared<std::string const>(requestedComponentName);
          auto componentName = ComponentName{flavor->c_str()};
          auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
          auto constructor = [RCTLegacyViewManagerInteropComponentView componentDescriptorProvider].constructor;

          providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

          componentViewFactory->_componentViewClasses[componentHandle] = [componentViewFactory
              _componentViewClassDescriptorFromClass:[RCTLegacyViewManagerInteropComponentView class]];
          return;
        }

        // Fallback 3: Finally use <UnimplementedView>.
        auto flavor = std::make_shared<std::string const>(requestedComponentName);
        auto componentName = ComponentName{flavor->c_str()};
        auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
        auto constructor = [RCTUnimplementedViewComponentView componentDescriptorProvider].constructor;

        providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

        componentViewFactory->_componentViewClasses[componentHandle] =
            [componentViewFactory _componentViewClassDescriptorFromClass:[RCTUnimplementedViewComponentView class]];
      });

  return componentViewFactory;
}

- (RCTComponentViewClassDescriptor)_componentViewClassDescriptorFromClass:(Class<RCTComponentViewProtocol>)viewClass
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  return RCTComponentViewClassDescriptor
  {
    .viewClass = viewClass,
    .observesMountingTransactionWillMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionWillMountWithMetadata:)),
    .observesMountingTransactionDidMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionDidMountWithMetadata:)),
  };
#pragma clang diagnostic pop
}

- (void)registerComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses[componentDescriptorProvider.handle] =
      [self _componentViewClassDescriptorFromClass:componentViewClass];
  _providerRegistry.add(componentDescriptorProvider);

  auto supplementalComponentDescriptorProviders = [componentViewClass supplementalComponentDescriptorProviders];
  for (const auto &provider : supplementalComponentDescriptorProviders) {
    _providerRegistry.add(provider);
  }
}

- (RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle
{
  RCTAssertMainQueue();
  std::shared_lock<better::shared_mutex> lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  auto componentViewClassDescriptor = iterator->second;
  Class viewClass = componentViewClassDescriptor.viewClass;

  return RCTComponentViewDescriptor{
      .view = [[viewClass alloc] init],
      .observesMountingTransactionWillMount = componentViewClassDescriptor.observesMountingTransactionWillMount,
      .observesMountingTransactionDidMount = componentViewClassDescriptor.observesMountingTransactionDidMount,
  };
}

- (facebook::react::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (facebook::react::ComponentDescriptorParameters)parameters
{
  std::shared_lock<better::shared_mutex> lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
