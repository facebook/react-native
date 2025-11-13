/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptorRegistry.h"

#include "componentNameByReactViewName.h"

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/legacyviewmanagerinterop/UnstableLegacyViewManagerAutomaticComponentDescriptor.h>
#include <react/renderer/components/legacyviewmanagerinterop/UnstableLegacyViewManagerAutomaticShadowNode.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <utility>
#include <thread>

#ifdef __ANDROID__
#include <fbjni/fbjni.h>
#endif


namespace facebook::react {

ComponentDescriptorRegistry::ComponentDescriptorRegistry(
    ComponentDescriptorParameters parameters,
    const ComponentDescriptorProviderRegistry& providerRegistry,
    ContextContainer::Shared contextContainer)
    : parameters_(std::move(parameters)),
      providerRegistry_(providerRegistry),
      contextContainer_(std::move(contextContainer)) {}

void ComponentDescriptorRegistry::addMultipleAsync(
    std::vector<ComponentDescriptorProvider> providers) const {
  // Copy everything we need before the thread starts
  auto parametersCopy = parameters_;
  auto contextContainerCopy = contextContainer_;

  auto self = shared_from_this();

  // Start detached thread - registry stays alive until completion due to strong self reference
  std::thread([self, providers = std::move(providers), parametersCopy, contextContainerCopy]() {
    // Ensure this C++ thread is attached to the JVM before touching JNI
    #ifdef __ANDROID__
      facebook::jni::Environment::ensureCurrentThreadIsAttached();
    #endif

    std::unique_lock lock(self->mutex_);

    for (const auto& provider : providers) {
      auto componentDescriptor = provider.constructor(
          {parametersCopy.eventDispatcher,
           contextContainerCopy,
           provider.flavor});

      react_native_assert(componentDescriptor->getComponentHandle() == provider.handle);
      react_native_assert(componentDescriptor->getComponentName() == provider.name);

      auto sharedComponentDescriptor =
          std::shared_ptr<const ComponentDescriptor>(std::move(componentDescriptor));

      self->_registryByHandle[provider.handle] = sharedComponentDescriptor;
      self->_registryByName[provider.name] = sharedComponentDescriptor;
    }
  }).detach();
}

void ComponentDescriptorRegistry::add(
    ComponentDescriptorProvider componentDescriptorProvider) const {
  std::unique_lock lock(mutex_);

  auto componentDescriptor = componentDescriptorProvider.constructor(
      {parameters_.eventDispatcher,
       parameters_.contextContainer,
       componentDescriptorProvider.flavor});
  react_native_assert(
      componentDescriptor->getComponentHandle() ==
      componentDescriptorProvider.handle);
  react_native_assert(
      componentDescriptor->getComponentName() ==
      componentDescriptorProvider.name);

  auto sharedComponentDescriptor = std::shared_ptr<const ComponentDescriptor>(
      std::move(componentDescriptor));
  _registryByHandle[componentDescriptorProvider.handle] =
      sharedComponentDescriptor;
  _registryByName[componentDescriptorProvider.name] = sharedComponentDescriptor;
}

void ComponentDescriptorRegistry::registerComponentDescriptor(
    const SharedComponentDescriptor& componentDescriptor) const {
  std::unique_lock lock(mutex_);

  ComponentHandle componentHandle = componentDescriptor->getComponentHandle();
  _registryByHandle[componentHandle] = componentDescriptor;

  ComponentName componentName = componentDescriptor->getComponentName();
  _registryByName[componentName] = componentDescriptor;
}

const ComponentDescriptor& ComponentDescriptorRegistry::at(
    const std::string& componentName) const {
  std::shared_lock lock(mutex_);

  auto unifiedComponentName = componentNameByReactViewName(componentName);

  auto it = _registryByName.find(unifiedComponentName);
  if (it == _registryByName.end()) {
    lock.unlock();
    providerRegistry_.request(unifiedComponentName.c_str());
    lock.lock();

    it = _registryByName.find(unifiedComponentName);

    /*
     * TODO: T54849676
     * Uncomment the `assert` after the following block that checks
     * `_fallbackComponentDescriptor` is no longer needed. The assert assumes
     * that `componentDescriptorProviderRequest` is always not null and register
     * some component on every single request.
     */
    // assert(it != _registryByName.end());
  }

  if (it == _registryByName.end()) {
    if (ReactNativeFeatureFlags::useFabricInterop()) {
      // When interop is enabled, if the component is not found we rely on
      // UnstableLegacyViewManagerAutomaticComponentDescriptor to support legacy
      // components in new architecture.
      auto componentDescriptor = std::make_shared<
          const UnstableLegacyViewManagerAutomaticComponentDescriptor>(
          parameters_, unifiedComponentName);
      registerComponentDescriptor(componentDescriptor);
      return *_registryByName.find(unifiedComponentName)->second;
    } else {
      // When interop is disabled, if the component is not found we rely on
      // fallbackComponentDescriptor (default:
      // UnimplementedNativeViewComponentDescriptor).
      // UnimplementedNativeViewComponentDescriptor displays a View in debug
      // mode to alert the developer that the component is not properly
      // configured, and an empty view in release mode.
      if (_fallbackComponentDescriptor == nullptr) {
        throw std::invalid_argument(
            ("Unable to find componentDescriptor for " + unifiedComponentName)
                .c_str());
      } else {
        return *_fallbackComponentDescriptor.get();
      }
    }
  }

  return *it->second;
}

const ComponentDescriptor* ComponentDescriptorRegistry::
    findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
        ComponentHandle componentHandle) const {
  std::shared_lock lock(mutex_);

  auto iterator = _registryByHandle.find(componentHandle);
  if (iterator == _registryByHandle.end()) {
    return nullptr;
  }

  return iterator->second.get();
}

const ComponentDescriptor& ComponentDescriptorRegistry::at(
    ComponentHandle componentHandle) const {
  std::shared_lock lock(mutex_);

  return *_registryByHandle.at(componentHandle);
}

bool ComponentDescriptorRegistry::hasComponentDescriptorAt(
    ComponentHandle componentHandle) const {
  std::shared_lock lock(mutex_);

  auto iterator = _registryByHandle.find(componentHandle);
  return iterator != _registryByHandle.end();
}

void ComponentDescriptorRegistry::setFallbackComponentDescriptor(
    const SharedComponentDescriptor& descriptor) {
  _fallbackComponentDescriptor = descriptor;
  registerComponentDescriptor(descriptor);
}

ComponentDescriptor::Shared
ComponentDescriptorRegistry::getFallbackComponentDescriptor() const {
  return _fallbackComponentDescriptor;
}

} // namespace facebook::react
