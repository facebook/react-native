/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptorRegistry.h"

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/core/ShadowNodeFragment.h>

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

  // TODO T63839307: remove this condition after deleting TextInlineImage from
  // Paper
  if (viewName == "TextInlineImage") {
    return "Image";
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

  // We need this temporarily for testing purposes until we have proper
  // implementation of core components.
  if (viewName == "ScrollContentView" ||
      viewName == "AndroidHorizontalScrollContentView" // Android
  ) {
    return "View";
  }

  // iOS-only
  if (viewName == "MultilineTextInputView" ||
      viewName == "SinglelineTextInputView") {
    return "TextInput";
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

bool ComponentDescriptorRegistry::hasComponentDescriptorAt(
    ComponentHandle componentHandle) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  auto iterator = _registryByHandle.find(componentHandle);
  if (iterator == _registryByHandle.end()) {
    return false;
  }

  return true;
}

SharedShadowNode ComponentDescriptorRegistry::createNode(
    Tag tag,
    std::string const &viewName,
    SurfaceId surfaceId,
    folly::dynamic const &propsDynamic,
    SharedEventTarget const &eventTarget) const {
  auto unifiedComponentName = componentNameByReactViewName(viewName);
  auto const &componentDescriptor = this->at(unifiedComponentName);

  auto family = componentDescriptor.createFamily(
      ShadowNodeFamilyFragment{tag, surfaceId, nullptr},
      std::move(eventTarget));
  auto const props =
      componentDescriptor.cloneProps(nullptr, RawProps(propsDynamic));
  auto const state =
      componentDescriptor.createInitialState(ShadowNodeFragment{props}, family);

  return componentDescriptor.createShadowNode(
      {
          /* .props = */ props,
          /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
          /* .state = */ state,
      },
      family);
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
