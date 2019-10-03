/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropComponentDescriptor.h"
#include <React/RCTBridge.h>
#include <React/RCTUIManager.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/ManagedObjectWrapper.h>
#include "LegacyViewManagerInteropState.h"
#include "RCTLegacyViewManagerInteropCoordinator.h"

namespace facebook {
namespace react {

static std::string moduleNameFromComponentName(const std::string &componentName)
{
  return componentName + "Manager";
}

inline NSString *RCTNSStringFromString(const std::string &string)
{
  return [NSString stringWithCString:string.c_str() encoding:NSUTF8StringEncoding];
}

static std::shared_ptr<void> const contructCoordinator(
    ContextContainer::Shared const &contextContainer,
    ComponentDescriptor::Flavor const &flavor)
{
  auto componentName = *std::static_pointer_cast<std::string const>(flavor);
  auto moduleName = moduleNameFromComponentName(componentName);
  RCTBridge *bridge = (RCTBridge *)unwrapManagedObject(contextContainer->at<std::shared_ptr<void>>("Bridge"));
  RCTViewManager *viewManager = [bridge moduleForName:RCTNSStringFromString(moduleName) lazilyLoadIfNecessary:YES];
  return wrapManagedObject([[RCTLegacyViewManagerInteropCoordinator alloc] initWithViewManager:viewManager]);
}

LegacyViewManagerInteropComponentDescriptor::LegacyViewManagerInteropComponentDescriptor(
    EventDispatcher::Weak const &eventDispatcher,
    ContextContainer::Shared const &contextContainer,
    ComponentDescriptor::Flavor const &flavor)
    : ConcreteComponentDescriptor(eventDispatcher, contextContainer, flavor),
      _coordinator(contructCoordinator(contextContainer, flavor))
{
}

ComponentHandle
LegacyViewManagerInteropComponentDescriptor::getComponentHandle() const {
  return reinterpret_cast<ComponentHandle>(getComponentName());
}

ComponentName LegacyViewManagerInteropComponentDescriptor::getComponentName()
    const {
  return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
}

void LegacyViewManagerInteropComponentDescriptor::adopt(
    ShadowNode::Unshared shadowNode) const {
  ConcreteComponentDescriptor::adopt(shadowNode);

  assert(std::dynamic_pointer_cast<LegacyViewManagerInteropShadowNode>(
      shadowNode));
  auto legacyViewManagerInteropShadowNode =
      std::static_pointer_cast<LegacyViewManagerInteropShadowNode>(shadowNode);

  auto state = LegacyViewManagerInteropState{};
  state.coordinator = _coordinator;

  legacyViewManagerInteropShadowNode->setStateData(std::move(state));
}
} // namespace react
} // namespace facebook
