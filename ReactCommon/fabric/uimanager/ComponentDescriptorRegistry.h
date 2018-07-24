// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <fabric/core/ComponentDescriptor.h>

namespace facebook {
namespace react {

class ComponentDescriptorRegistry;

using SharedComponentDescriptorRegistry = std::shared_ptr<const ComponentDescriptorRegistry>;

/*
 * Registry of particular `ComponentDescriptor`s.
 */
class ComponentDescriptorRegistry {

public:
  void registerComponentDescriptor(SharedComponentDescriptor componentDescriptor);

  const SharedComponentDescriptor operator[](const SharedShadowNode &shadowNode) const;
  const SharedComponentDescriptor operator[](const ComponentName &componentName) const;

private:
  std::unordered_map<ComponentHandle, SharedComponentDescriptor> _registryByHandle;
  std::unordered_map<ComponentName, SharedComponentDescriptor> _registryByName;
};

} // namespace react
} // namespace facebook
