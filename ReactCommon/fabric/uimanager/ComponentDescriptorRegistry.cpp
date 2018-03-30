// Copyright 2004-present Facebook. All Rights Reserved.

#include "ComponentDescriptorRegistry.h"

namespace facebook {
namespace react {

void ComponentDescriptorRegistry::registerComponentDescriptor(SharedComponentDescriptor componentDescriptor) {
  ComponentHandle componentHandle = componentDescriptor->getComponentHandle();
  _registryByHandle[componentHandle] = componentDescriptor;

  ComponentName componentName = componentDescriptor->getComponentName();
  _registryByName[componentName] = componentDescriptor;
}

const SharedComponentDescriptor ComponentDescriptorRegistry::operator[](const SharedShadowNode &shadowNode) {
  ComponentHandle componentHandle = shadowNode->getComponentHandle();
  return _registryByHandle[componentHandle];
}

const SharedComponentDescriptor ComponentDescriptorRegistry::operator[](const ComponentName &componentName) {
  return _registryByName[componentName];
}

} // namespace react
} // namespace facebook
