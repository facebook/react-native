/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentRegistryResolver.h"

#include <android/log.h>

namespace facebook {
namespace react {

void ComponentRegistryResolver::addComponentManager(
    std::string name,
    bool isRootComponent,
    std::function<std::shared_ptr<facebook::react::ComponentManager>(
        const std::string &name)> f) {
  ComponentResolverData data = {isRootComponent, std::move(f)};
  resolverMap_.insert({name, data});
}

bool ComponentRegistryResolver::containsComponentManager(
    std::string componentName) const {
  return resolverMap_.contains(componentName);
}

std::shared_ptr<facebook::react::ComponentManager>
ComponentRegistryResolver::getComponentManager(
    std::string componentName) const {
  auto iterator = resolverMap_.find(componentName);
  if (iterator != resolverMap_.end()) {
    return iterator->second.getComponentManagerFunction(componentName);
  }

  return nullptr;
}

bool ComponentRegistryResolver::isRootComponent(
    std::string componentName) const {
  auto iterator = resolverMap_.find(componentName);
  if (iterator != resolverMap_.end()) {
    return iterator->second.isRootComponent;
  }

  return false;
}

} // namespace react
} // namespace facebook
