/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentDescriptorProviderRegistry.h"

namespace facebook {
namespace react {

void ComponentDescriptorProviderRegistry::add(
    ComponentDescriptorProvider provider) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);
  componentDescriptorProviders_.insert({provider.handle, provider});

  for (auto const &weakRegistry : componentDescriptorRegistries_) {
    auto registry = weakRegistry.lock();
    if (!registry) {
      continue;
    }

    registry->add(provider);
  }
}

void ComponentDescriptorProviderRegistry::remove(
    ComponentDescriptorProvider provider) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);
  componentDescriptorProviders_.erase(provider.handle);

  for (auto const &weakRegistry : componentDescriptorRegistries_) {
    auto registry = weakRegistry.lock();
    if (!registry) {
      continue;
    }

    registry->remove(provider);
  }
}

void ComponentDescriptorProviderRegistry::setComponentDescriptorProviderRequest(
    ComponentDescriptorProviderRequest componentDescriptorProviderRequest)
    const {
  std::shared_lock<better::shared_mutex> lock(mutex_);
  componentDescriptorProviderRequest_ = componentDescriptorProviderRequest;
}

void ComponentDescriptorProviderRegistry::request(
    ComponentName componentName) const {
  ComponentDescriptorProviderRequest componentDescriptorProviderRequest;

  {
    std::shared_lock<better::shared_mutex> lock(mutex_);
    componentDescriptorProviderRequest = componentDescriptorProviderRequest_;
  }

  if (componentDescriptorProviderRequest) {
    componentDescriptorProviderRequest(componentName);
  }
}

ComponentDescriptorRegistry::Shared
ComponentDescriptorProviderRegistry::createComponentDescriptorRegistry(
    ComponentDescriptorParameters const &parameters) const {
  std::shared_lock<better::shared_mutex> lock(mutex_);

  auto registry =
      std::make_shared<ComponentDescriptorRegistry const>(parameters, *this);

  for (auto const &pair : componentDescriptorProviders_) {
    registry->add(pair.second);
  }

  componentDescriptorRegistries_.push_back(registry);

  return registry;
}

} // namespace react
} // namespace facebook
