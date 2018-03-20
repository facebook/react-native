// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <fabric/core/ComponentDescriptor.h>

namespace facebook {
namespace react {

/*
 * Registry of particular `ComponentDescriptor`s.
 */
class ComponentDescriptorRegistry {

public:
  void registerComponentDescriptor(SharedComponentDescriptor componentDescriptor);

  const SharedComponentDescriptor operator[](const SharedShadowNode &shadowNode);
  const SharedComponentDescriptor operator[](const ComponentName &componentName);

private:
  std::unordered_map<ComponentHandle, SharedComponentDescriptor> _registryByHandle;
  std::unordered_map<ComponentName, SharedComponentDescriptor> _registryByName;
};

} // namespace react
} // namespace facebook
