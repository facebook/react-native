/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptorRegistry.h"

#include <react/core/ShadowNodeFragment.h>
#include <react/uimanager/ComponentDescriptorProviderRegistry.h>
#include <react/uimanager/primitives.h>

namespace facebook {
namespace react {

ComponentDescriptorRegistry::ComponentDescriptorRegistry(
    ComponentDescriptorParameters const &parameters,
    ComponentDescriptorProviderRegistry const &providerRegistry)
    : parameters_(parameters), providerRegistry_(providerRegistry) {}

void ComponentDescriptorRegistry::add(
    ComponentDescriptorProvider componentDescriptorProvider) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);

  auto componentDescriptor = componentDescriptorProvider.constructor(
      {parameters_.eventDispatcher,
       parameters_.contextContainer,
       componentDescriptorProvider.flavor});
  assert(
      componentDescriptor->getComponentHandle() ==
      componentDescriptorProvider.handle);
  assert(
      componentDescriptor->getComponentName() ==
      componentDescriptorProvider.name);

  auto sharedComponentDescriptor = std::shared_ptr<ComponentDescriptor const>(
      std::move(componentDescriptor));
  _registryByHandle[componentDescriptorProvider.handle] =
      sharedComponentDescriptor;
  _registryByName[componentDescriptorProvider.name] = sharedComponentDescriptor;

  if (strcmp(componentDescriptorProvider.name, "UnimplementedNativeView") ==
      0) {
    auto *self = const_cast<ComponentDescriptorRegistry *>(this);
    self->setFallbackComponentDescriptor(sharedComponentDescriptor);
  }
}

void ComponentDescriptorRegistry::registerComponentDescriptor(
    SharedComponentDescriptor componentDescriptor) const {
  ComponentHandle componentHandle = componentDescriptor->getComponentHandle();
  _registryByHandle[componentHandle] = componentDescriptor;

  ComponentName componentName = componentDescriptor->getComponentName();
  _registryByName[componentName] = componentDescriptor;
}

static std::string componentNameByReactViewName(std::string viewName) {
  // We need this function only for the transition period;
  // eventually, all names will be unified.

  std::string rctPrefix("RCT");
  if (std::mismatch(rctPrefix.begin(), rctPrefix.end(), viewName.begin())
          .first == rctPrefix.end()) {
    // If `viewName` has "RCT" prefix, remove it.
    viewName.erase(0, rctPrefix.length());
  }

  // Fabric uses slightly new names for Text components because of differences
  // in semantic.
  if (viewName == "Text") {
    return "Paragraph";
  }
  if (viewName == "VirtualText") {
    return "Text";
  }

  if (viewName == "ImageView") {
    return "Image";
  }

  if (viewName == "AndroidHorizontalScrollView") {
    return "ScrollView";
  }

  if (viewName == "RKShimmeringView") {
    return "ShimmeringView";
  }

  if (viewName == "RefreshControl") {
    return "PullToRefreshView";
  }

  if (viewName == "AndroidProgressBar") {
    return "ActivityIndicatorView";
  }

  // We need this temporarily for testing purposes until we have proper
  // implementation of core components.
  if (viewName == "ScrollContentView" ||
      viewName == "AndroidHorizontalScrollContentView" // Android
  ) {
    return "View";
  }

  return viewName;
}

ComponentDescriptor const &ComponentDescriptorRegistry::at(
    std::string const &componentName) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  auto unifiedComponentName = componentNameByReactViewName(componentName);

  auto it = _registryByName.find(unifiedComponentName);
  if (it == _registryByName.end()) {
    mutex_.unlock_shared();
    providerRegistry_.request(unifiedComponentName.c_str());
    mutex_.lock_shared();

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

ComponentDescriptor const *ComponentDescriptorRegistry::
    findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
        ComponentHandle componentHandle) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  auto iterator = _registryByHandle.find(componentHandle);
  if (iterator == _registryByHandle.end()) {
    return nullptr;
  }

  return iterator->second.get();
}

ComponentDescriptor const &ComponentDescriptorRegistry::at(
    ComponentHandle componentHandle) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  return *_registryByHandle.at(componentHandle);
}

SharedShadowNode ComponentDescriptorRegistry::createNode(
    Tag tag,
    std::string const &viewName,
    SurfaceId surfaceId,
    folly::dynamic const &propsDynamic,
    SharedEventTarget const &eventTarget) const {
  auto unifiedComponentName = componentNameByReactViewName(viewName);
  auto const &componentDescriptor = this->at(unifiedComponentName);

  auto const eventEmitter =
      componentDescriptor.createEventEmitter(std::move(eventTarget), tag);
  auto const props =
      componentDescriptor.cloneProps(nullptr, RawProps(propsDynamic));
  auto const state = componentDescriptor.createInitialState(
      ShadowNodeFragment{surfaceId, tag, props, eventEmitter});

  return componentDescriptor.createShadowNode({
      /* .tag = */ tag,
      /* .surfaceId = */ surfaceId,
      /* .props = */ props,
      /* .eventEmitter = */ eventEmitter,
      /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
      /* .localData = */ ShadowNodeFragment::localDataPlaceholder(),
      /* .state = */ state,
  });
}

void ComponentDescriptorRegistry::setFallbackComponentDescriptor(
    SharedComponentDescriptor descriptor) {
  _fallbackComponentDescriptor = descriptor;
  registerComponentDescriptor(descriptor);
}

ComponentDescriptor::Shared
ComponentDescriptorRegistry::getFallbackComponentDescriptor() const {
  return _fallbackComponentDescriptor;
}

} // namespace react
} // namespace facebook
