/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewFactory.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTConversions.h>
#import <React/RCTLog.h>

#import <shared_mutex>
#import <unordered_map>
#import <unordered_set>

#import <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#import <react/renderer/componentregistry/componentNameByReactViewName.h>
#import <react/renderer/componentregistry/native/NativeComponentRegistryBinding.h>
#import <react/renderer/components/view/LayoutConformanceComponentDescriptor.h>
#import <react/renderer/core/PropsParserContext.h>
#import <react/renderer/core/ReactPrimitives.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTFabricComponentPlugin/RCTFabricPluginProvider.h>
#else
#import <React/RCTFabricComponentsPlugins.h>
#endif

#import <React/RCTComponentViewClassDescriptor.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTImageComponentView.h>
#import <React/RCTLegacyViewManagerInteropComponentView.h>
#import <React/RCTMountingTransactionObserving.h>
#import <React/RCTParagraphComponentView.h>
#import <React/RCTRootComponentView.h>
#import <React/RCTTextInputComponentView.h>
#import <React/RCTUnimplementedViewComponentView.h>
#import <React/RCTViewComponentView.h>

#import <objc/runtime.h>

using namespace facebook;
using namespace facebook::react;

// Allow JS runtime to register native components as needed. For static view configs.
void RCTInstallNativeComponentRegistryBinding(facebook::jsi::Runtime &runtime)
{
  auto hasComponentProvider = [](const std::string &name) -> bool {
    return [[RCTComponentViewFactory currentComponentViewFactory]
        registerComponentIfPossible:componentNameByReactViewName(name)];
  };
  bindHasComponentProvider(runtime, std::move(hasComponentProvider));
}

static Class<RCTComponentViewProtocol> RCTComponentViewClassWithName(const char *componentName)
{
  return RCTFabricComponentsProvider(componentName);
}

@implementation RCTComponentViewFactory {
  std::unordered_map<ComponentHandle, RCTComponentViewClassDescriptor> _componentViewClasses;
  std::unordered_set<std::string> _registeredComponentsNames;
  ComponentDescriptorProviderRegistry _providerRegistry;
  std::shared_mutex _mutex;
}

+ (RCTComponentViewFactory *)currentComponentViewFactory
{
  static dispatch_once_t onceToken;
  static RCTComponentViewFactory *componentViewFactory;

  dispatch_once(&onceToken, ^{
    componentViewFactory = [RCTComponentViewFactory new];
    [componentViewFactory registerComponentViewClass:[RCTRootComponentView class]];
    [componentViewFactory registerComponentViewClass:[RCTParagraphComponentView class]];
    componentViewFactory->_providerRegistry.add(
        concreteComponentDescriptorProvider<LayoutConformanceComponentDescriptor>());

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
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionWillMount:withSurfaceTelemetry:)),
    .observesMountingTransactionDidMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionDidMount:withSurfaceTelemetry:)),
    .shouldBeRecycled = [viewClass respondsToSelector:@selector(shouldBeRecycled)]
        ? (bool)[viewClass performSelector:@selector(shouldBeRecycled)]
        : true,
  };
#pragma clang diagnostic pop
}

- (BOOL)registerComponentIfPossible:(const std::string &)name
{
  if (_registeredComponentsNames.find(name) != _registeredComponentsNames.end()) {
    // Component has already been registered.
    return YES;
  }

  // Paper name: we prepare this variables to warn the user
  // when the component is registered in both Fabric and in the
  // interop layer, so they can remove that
  NSString *componentNameString = RCTNSStringFromString(name);

  // Fallback 1: Call provider function for component view class.
  Class<RCTComponentViewProtocol> klass = RCTComponentViewClassWithName(name.c_str());
  if (klass) {
    [self registerComponentViewClass:klass];
    return YES;
  }

  // Fallback 2: Ask the provider and check in the dictionary provided
  if (self.thirdPartyFabricComponentsProvider) {
    // Test whether a provider has been passed to avoid potentially expensive conversions
    // between C++ and ObjC strings.
    NSString *objcName = [NSString stringWithCString:name.c_str() encoding:NSUTF8StringEncoding];
    klass = self.thirdPartyFabricComponentsProvider.thirdPartyFabricComponents[objcName];
    if (klass) {
      [self registerComponentViewClass:klass];
      return YES;
    }
  }

  // Fallback 3: Try to use Paper Interop.
  // TODO(T174674274): Implement lazy loading of legacy view managers in the new architecture.
  if (RCTFabricInteropLayerEnabled() && [RCTLegacyViewManagerInteropComponentView isSupported:componentNameString]) {
    RCTLogNewArchitectureValidation(
        RCTNotAllowedInBridgeless,
        self,
        [NSString
            stringWithFormat:
                @"Legacy ViewManagers should be migrated to Fabric ComponentViews in the new architecture to reduce risk. Component using interop layer: %@",
                componentNameString]);

    auto flavor = std::make_shared<const std::string>(name);
    auto componentName = ComponentName{flavor->c_str()};
    auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
    auto constructor = [RCTLegacyViewManagerInteropComponentView componentDescriptorProvider].constructor;

    [self _addDescriptorToProviderRegistry:ComponentDescriptorProvider{
                                               componentHandle, componentName, flavor, constructor}];

    _componentViewClasses[componentHandle] =
        [self _componentViewClassDescriptorFromClass:[RCTLegacyViewManagerInteropComponentView class]];
    return YES;
  }

  // Fallback 4: use <UnimplementedView> if component doesn't exist.
  auto flavor = std::make_shared<const std::string>(name);
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
  std::unique_lock lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses[componentDescriptorProvider.handle] =
      [self _componentViewClassDescriptorFromClass:componentViewClass];
  [self _addDescriptorToProviderRegistry:componentDescriptorProvider];

  auto supplementalComponentDescriptorProviders = [componentViewClass supplementalComponentDescriptorProviders];
  for (const auto &provider : supplementalComponentDescriptorProviders) {
    [self _addDescriptorToProviderRegistry:provider];
  }
}

- (void)_addDescriptorToProviderRegistry:(const ComponentDescriptorProvider &)provider
{
  _registeredComponentsNames.insert(provider.name);
  _providerRegistry.add(provider);
}

- (RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle
{
  RCTAssertMainQueue();
  std::shared_lock lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  auto componentViewClassDescriptor = iterator->second;
  Class viewClass = componentViewClassDescriptor.viewClass;

  return RCTComponentViewDescriptor{
      .view = [viewClass new],
      .observesMountingTransactionWillMount = componentViewClassDescriptor.observesMountingTransactionWillMount,
      .observesMountingTransactionDidMount = componentViewClassDescriptor.observesMountingTransactionDidMount,
      .shouldBeRecycled = componentViewClassDescriptor.shouldBeRecycled,
  };
}

- (facebook::react::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (facebook::react::ComponentDescriptorParameters)parameters
{
  std::shared_lock lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
