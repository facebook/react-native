/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptorProviderRegistry.h"

namespace facebook::react {

void ComponentDescriptorProviderRegistry::add(
    const ComponentDescriptorProvider &provider) const {
  std::unique_lock<butter::shared_mutex> lock(mutex_);

  /*
  // TODO: T57583139
  The assert is temporarily disabled to reduce the volume of the signal.
  assert(
      componentDescriptorProviders_.find(provider.handle) ==
          componentDescriptorProviders_.end() &&
      "Attempt to register an already registered ComponentDescriptorProvider.");
  */

  if (componentDescriptorProviders_.find(provider.handle) !=
      componentDescriptorProviders_.end()) {
    // Re-registering a provider makes no sense because it's copyable: already
    // registered one is as good as any new can be.
    return;
  }

  componentDescriptorProviders_.insert({provider.handle, provider});

  for (auto const &weakRegistry : componentDescriptorRegistries_) {
    auto registry = weakRegistry.lock();
    if (!registry) {
      continue;
    }

    registry->add(provider);
  }
}

void ComponentDescriptorProviderRegistry::setComponentDescriptorProviderRequest(
    ComponentDescriptorProviderRequest componentDescriptorProviderRequest)
    const {
  std::shared_lock<butter::shared_mutex> lock(mutex_);
  componentDescriptorProviderRequest_ =
      std::move(componentDescriptorProviderRequest);
}

void ComponentDescriptorProviderRegistry::request(
    ComponentName componentName) const {
  ComponentDescriptorProviderRequest componentDescriptorProviderRequest;

  {
    std::shared_lock<butter::shared_mutex> lock(mutex_);
    componentDescriptorProviderRequest = componentDescriptorProviderRequest_;
  }

  if (componentDescriptorProviderRequest) {
    componentDescriptorProviderRequest(componentName);
  }
}

ComponentDescriptorRegistry::Shared
ComponentDescriptorProviderRegistry::createComponentDescriptorRegistry(
    ComponentDescriptorParameters const &parameters) const {
  std::shared_lock<butter::shared_mutex> lock(mutex_);

  auto registry = std::make_shared<ComponentDescriptorRegistry const>(
      parameters, *this, parameters.contextContainer);

  for (auto const &pair : componentDescriptorProviders_) {
    registry->add(pair.second);
  }

  componentDescriptorRegistries_.push_back(registry);

  return registry;
}

} // namespace facebook::react
