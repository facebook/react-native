/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptorRegistry.h"

#include "componentNameByReactViewName.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNodeFragment.h>

#include <utility>

namespace facebook::react {

ComponentDescriptorRegistry::ComponentDescriptorRegistry(
    ComponentDescriptorParameters parameters,
    const ComponentDescriptorProviderRegistry& providerRegistry,
    ContextContainer::Shared contextContainer)
    : parameters_(std::move(parameters)),
      providerRegistry_(providerRegistry),
      contextContainer_(std::move(contextContainer)) {}

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
    if (_fallbackComponentDescriptor == nullptr) {
      throw std::invalid_argument(
          ("Unable to find componentDescriptor for " + unifiedComponentName)
              .c_str());
    }
    return *_fallbackComponentDescriptor.get();
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

ShadowNode::Shared ComponentDescriptorRegistry::createNode(
    Tag tag,
    const std::string& viewName,
    SurfaceId surfaceId,
    const folly::dynamic& propsDynamic,
    const InstanceHandle::Shared& instanceHandle) const {
  auto unifiedComponentName = componentNameByReactViewName(viewName);
  const auto& componentDescriptor = this->at(unifiedComponentName);

  const auto fragment =
      ShadowNodeFamilyFragment{tag, surfaceId, instanceHandle};
  auto family = componentDescriptor.createFamily(fragment);
  const auto props = componentDescriptor.cloneProps(
      PropsParserContext{surfaceId, *contextContainer_.get()},
      nullptr,
      RawProps(propsDynamic));
  const auto state = componentDescriptor.createInitialState(props, family);

  return componentDescriptor.createShadowNode(
      {
          /* .props = */ props,
          /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
          /* .state = */ state,
      },
      family);
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
