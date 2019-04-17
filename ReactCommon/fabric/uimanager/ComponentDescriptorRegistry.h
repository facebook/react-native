// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <better/map.h>
#include <react/core/ComponentDescriptor.h>

namespace facebook {
namespace react {

class ComponentDescriptorRegistry;

using SharedComponentDescriptorRegistry =
    std::shared_ptr<const ComponentDescriptorRegistry>;

/*
 * Registry of particular `ComponentDescriptor`s.
 */
class ComponentDescriptorRegistry {
 public:
  using Shared = std::shared_ptr<const ComponentDescriptorRegistry>;

  void registerComponentDescriptor(
      SharedComponentDescriptor componentDescriptor);

  ComponentDescriptor const &at(ComponentName const &componentName) const;
  ComponentDescriptor const &at(ComponentHandle componentHandle) const;

  SharedShadowNode createNode(
      Tag tag,
      ComponentName const &viewName,
      Tag rootTag,
      folly::dynamic const &props,
      SharedEventTarget const &eventTarget) const;

  void setFallbackComponentDescriptor(SharedComponentDescriptor descriptor);
  ComponentDescriptor::Shared getFallbackComponentDescriptor() const;

 private:
  better::map<ComponentHandle, SharedComponentDescriptor> _registryByHandle;
  better::map<ComponentName, SharedComponentDescriptor> _registryByName;
  ComponentDescriptor::Shared _fallbackComponentDescriptor;
};

} // namespace react
} // namespace facebook
