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
#import <better/set.h>

#import <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#import <react/renderer/componentregistry/componentNameByReactViewName.h>
#import <react/renderer/componentregistry/native/NativeComponentRegistryBinding.h>
#import <react/renderer/core/ReactPrimitives.h>

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

void RCTInstallNativeComponentRegistryBinding(facebook::jsi::Runtime &runtime)
{
  auto hasComponentProvider = [](std::string const &name) -> bool {
    return [[RCTComponentViewFactory currentComponentViewFactory]
        registerComponentIfPossible:componentNameByReactViewName(name)];
  };
  NativeComponentRegistryBinding::install(runtime, std::move(hasComponentProvider));
}

static Class<RCTComponentViewProtocol> RCTComponentViewClassWithName(const char *componentName)
{
  return RCTFabricComponentsProvider(componentName);
}

@implementation RCTComponentViewFactory {
  better::map<ComponentHandle, RCTComponentViewClassDescriptor> _componentViewClasses;
  better::set<std::string> _registeredComponentsNames;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (RCTComponentViewFactory *)currentComponentViewFactory
{
  static dispatch_once_t onceToken;
  static RCTComponentViewFactory *componentViewFactory;

  dispatch_once(&onceToken, ^{
    componentViewFactory = [[RCTComponentViewFactory alloc] init];
    [componentViewFactory registerComponentViewClass:[RCTRootComponentView class]];
    [componentViewFactory registerComponentViewClass:[RCTViewComponentView class]];
    [componentViewFactory registerComponentViewClass:[RCTParagraphComponentView class]];
    [componentViewFactory registerComponentViewClass:[RCTTextInputComponentView class]];

    Class<RCTComponentViewProtocol> imageClass = RCTComponentViewClassWithName("Image");
    [componentViewFactory registerComponentViewClass:imageClass];

    componentViewFactory->_providerRegistry.setComponentDescriptorProviderRequest(
        [](ComponentName requestedComponentName) {
          [componentViewFactory registerComponentIfPossible:requestedComponentName];
        });
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

- (BOOL)registerComponentIfPossible:(std::string const &)name
{
  if (_registeredComponentsNames.find(name) != _registeredComponentsNames.end()) {
    // Component has already been registered.
    return YES;
  }

  // Fallback 1: Call provider function for component view class.
  Class<RCTComponentViewProtocol> klass = RCTComponentViewClassWithName(name.c_str());
  if (klass) {
    [self registerComponentViewClass:klass];
    return YES;
  }

  // Fallback 2: Try to use Paper Interop.
  if ([RCTLegacyViewManagerInteropComponentView isSupported:RCTNSStringFromString(name)]) {
    auto flavor = std::make_shared<std::string const>(name);
    auto componentName = ComponentName{flavor->c_str()};
    auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
    auto constructor = [RCTLegacyViewManagerInteropComponentView componentDescriptorProvider].constructor;

    [self _addDescriptorToProviderRegistry:ComponentDescriptorProvider{
                                               componentHandle, componentName, flavor, constructor}];

    _componentViewClasses[componentHandle] =
        [self _componentViewClassDescriptorFromClass:[RCTLegacyViewManagerInteropComponentView class]];
    return YES;
  }

  // Fallback 3: use <UnimplementedView> if component doesn't exist.
  auto flavor = std::make_shared<std::string const>(name);
  auto componentName = ComponentName{flavor->c_str()};
  auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
  auto constructor = [RCTUnimplementedViewComponentView componentDescriptorProvider].constructor;

  [self _addDescriptorToProviderRegistry:ComponentDescriptorProvider{
                                             componentHandle, componentName, flavor, constructor}];

  _componentViewClasses[componentHandle] =
      [self _componentViewClassDescriptorFromClass:[RCTUnimplementedViewComponentView class]];

  // No matching class exists for `name`.
  return NO;
}

- (void)registerComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass
{
  RCTAssert(componentViewClass, @"RCTComponentViewFactory: Provided `componentViewClass` is `nil`.");
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses[componentDescriptorProvider.handle] =
      [self _componentViewClassDescriptorFromClass:componentViewClass];
  [self _addDescriptorToProviderRegistry:componentDescriptorProvider];

  auto supplementalComponentDescriptorProviders = [componentViewClass supplementalComponentDescriptorProviders];
  for (const auto &provider : supplementalComponentDescriptorProviders) {
    [self _addDescriptorToProviderRegistry:provider];
  }
}

- (void)_addDescriptorToProviderRegistry:(ComponentDescriptorProvider const &)provider
{
  _registeredComponentsNames.insert(provider.name);
  _providerRegistry.add(provider);
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
