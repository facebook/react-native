/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropComponentDescriptor.h"
#include <React/RCTBridge.h>
#include <React/RCTComponentData.h>
#include <React/RCTModuleData.h>
#include <React/RCTUIManager.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/ManagedObjectWrapper.h>
#include "LegacyViewManagerInteropState.h"
#include "RCTLegacyViewManagerInteropCoordinator.h"

namespace facebook {
namespace react {

static std::string moduleNameFromComponentName(const std::string &componentName)
{
  // TODO: remove FB specific code (T56174424)
  if (componentName == "StickerInputView") {
    return "FBStickerInputViewManager";
  }
  std::string fbPrefix("FB");
  if (std::mismatch(fbPrefix.begin(), fbPrefix.end(), componentName.begin()).first == fbPrefix.end()) {
    // If `moduleName` has "FB" prefix.
    return componentName + "Manager";
  }
  return "RCT" + componentName + "Manager";
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
  Class module = NSClassFromString(RCTNSStringFromString(moduleName));
  assert(module);
  RCTBridge *bridge = (RCTBridge *)unwrapManagedObjectWeakly(contextContainer->at<std::shared_ptr<void>>("Bridge"));
  RCTComponentData *componentData = [[RCTComponentData alloc] initWithManagerClass:module bridge:bridge];
  return wrapManagedObject([[RCTLegacyViewManagerInteropCoordinator alloc] initWithComponentData:componentData
                                                                                          bridge:bridge]);
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
