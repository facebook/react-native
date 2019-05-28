// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ComponentDescriptorRegistry.h"

#include <react/core/ShadowNodeFragment.h>
#include <react/uimanager/primitives.h>

namespace facebook {
namespace react {

ComponentDescriptorRegistry::ComponentDescriptorRegistry(
    ComponentDescriptorParameters const &parameters)
    : parameters_(parameters) {}

void ComponentDescriptorRegistry::add(
    ComponentDescriptorProvider componentDescriptorProvider) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);

  auto componentDescriptor = componentDescriptorProvider.constructor(
      parameters_.eventDispatcher, parameters_.contextContainer);
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

  if (componentDescriptorProvider.name == "UnimplementedNativeView") {
    auto *self = const_cast<ComponentDescriptorRegistry *>(this);
    self->setFallbackComponentDescriptor(sharedComponentDescriptor);
  }
}

void ComponentDescriptorRegistry::remove(
    ComponentDescriptorProvider componentDescriptorProvider) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);

  assert(
      _registryByHandle.find(componentDescriptorProvider.handle) !=
      _registryByHandle.end());
  assert(
      _registryByName.find(componentDescriptorProvider.name) !=
      _registryByName.end());

  _registryByHandle.erase(componentDescriptorProvider.handle);
  _registryByName.erase(componentDescriptorProvider.name);
}

void ComponentDescriptorRegistry::registerComponentDescriptor(
    SharedComponentDescriptor componentDescriptor) const {
  ComponentHandle componentHandle = componentDescriptor->getComponentHandle();
  _registryByHandle[componentHandle] = componentDescriptor;

  ComponentName componentName = componentDescriptor->getComponentName();
  _registryByName[componentName] = componentDescriptor;
}

static ComponentName componentNameByReactViewName(ComponentName viewName) {
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

  if (viewName == "AndroidProgressBar") {
    return "ActivityIndicatorView";
  }

  // We need this temporarly for testing purposes until we have proper
  // implementation of core components.
  if (viewName == "SinglelineTextInputView" ||
      viewName == "MultilineTextInputView" || viewName == "AndroidTextInput" ||
      viewName == "SafeAreaView" || viewName == "ScrollContentView" ||
      viewName == "AndroidHorizontalScrollContentView" // Android
  ) {
    return "View";
  }

  return viewName;
}

ComponentDescriptor const &ComponentDescriptorRegistry::at(
    ComponentName const &componentName) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  auto unifiedComponentName = componentNameByReactViewName(componentName);

  auto it = _registryByName.find(unifiedComponentName);
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

ComponentDescriptor const &ComponentDescriptorRegistry::at(
    ComponentHandle componentHandle) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  return *_registryByHandle.at(componentHandle);
}

SharedShadowNode ComponentDescriptorRegistry::createNode(
    Tag tag,
    ComponentName const &viewName,
    SurfaceId surfaceId,
    folly::dynamic const &props,
    SharedEventTarget const &eventTarget) const {
  auto unifiedComponentName = componentNameByReactViewName(viewName);
  auto const &componentDescriptor = this->at(unifiedComponentName);
  return componentDescriptor.createShadowNode({
      /* .tag = */ tag,
      /* .surfaceId = */ surfaceId,
      /* .props = */ componentDescriptor.cloneProps(nullptr, RawProps(props)),
      /* .eventEmitter = */
      componentDescriptor.createEventEmitter(std::move(eventTarget), tag),
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
