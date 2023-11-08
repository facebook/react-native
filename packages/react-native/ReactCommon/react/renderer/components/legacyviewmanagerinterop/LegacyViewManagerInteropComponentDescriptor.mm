/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropComponentDescriptor.h"
#include <React/RCTBridge.h>
#include <React/RCTBridgeModuleDecorator.h>
#include <React/RCTComponentData.h>
#include <React/RCTEventDispatcher.h>
#include <React/RCTModuleData.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/ManagedObjectWrapper.h>
#include "LegacyViewManagerInteropState.h"
#include "RCTLegacyViewManagerInteropCoordinator.h"

namespace facebook {
namespace react {

static std::string moduleNameFromComponentNameNoRCTPrefix(const std::string &componentName)
{
  // TODO: remove FB specific code (T56174424)
  if (componentName == "StickerInputView") {
    return "FBStickerInputViewManager";
  }

  if (componentName == "FDSTooltipView") {
    return "FBReactFDSTooltipViewManager";
  }

  std::string fbPrefix("FB");
  if (std::mismatch(fbPrefix.begin(), fbPrefix.end(), componentName.begin()).first == fbPrefix.end()) {
    // If `moduleName` has "FB" prefix.
    return componentName + "Manager";
  }

  std::string artPrefix("ART");
  if (std::mismatch(artPrefix.begin(), artPrefix.end(), componentName.begin()).first == artPrefix.end()) {
    return componentName + "Manager";
  }

  std::string rnPrefix("RN");
  if (std::mismatch(rnPrefix.begin(), rnPrefix.end(), componentName.begin()).first == rnPrefix.end()) {
    return componentName + "Manager";
  }

  return componentName + "Manager";
}

inline NSString *RCTNSStringFromString(const std::string &string)
{
  return [NSString stringWithUTF8String:string.c_str()];
}

static Class getViewManagerFromComponentName(const std::string &componentName)
{
  auto viewManagerName = moduleNameFromComponentNameNoRCTPrefix(componentName);

  // 1. Try to get the manager with the RCT prefix.
  auto rctViewManagerName = "RCT" + viewManagerName;
  Class viewManagerClass = NSClassFromString(RCTNSStringFromString(rctViewManagerName));
  if (viewManagerClass) {
    return viewManagerClass;
  }

  // 2. Try to get the manager without the prefix.
  viewManagerClass = NSClassFromString(RCTNSStringFromString(viewManagerName));
  if (viewManagerClass) {
    return viewManagerClass;
  }

  return nil;
}

static Class getViewManagerClass(const std::string &componentName, RCTBridge *bridge)
{
  Class viewManager = getViewManagerFromComponentName(componentName);
  if (viewManager != nil) {
    return viewManager;
  }

  // If all the heuristics fail, let's try to retrieve the view manager from the bridge/bridgeProxy
  if (bridge != nil) {
    return [[bridge moduleForName:RCTNSStringFromString(componentName)] class];
  }

  return nil;
}

static const std::shared_ptr<void> constructCoordinator(
    const ContextContainer::Shared &contextContainer,
    const ComponentDescriptor::Flavor &flavor)
{
  auto optionalBridge = contextContainer->find<std::shared_ptr<void>>("Bridge");
  RCTBridge *bridge;
  if (optionalBridge) {
    bridge = unwrapManagedObjectWeakly(optionalBridge.value());
  }

  auto componentName = *std::static_pointer_cast<std::string const>(flavor);
  Class viewManagerClass = getViewManagerClass(componentName, bridge);
  assert(viewManagerClass);

  auto optionalEventDispatcher = contextContainer->find<std::shared_ptr<void>>("RCTEventDispatcher");
  RCTEventDispatcher *eventDispatcher;
  if (optionalEventDispatcher) {
    eventDispatcher = unwrapManagedObject(optionalEventDispatcher.value());
  }

  auto optionalModuleDecorator = contextContainer->find<std::shared_ptr<void>>("RCTBridgeModuleDecorator");
  RCTBridgeModuleDecorator *bridgeModuleDecorator;
  if (optionalModuleDecorator) {
    bridgeModuleDecorator = unwrapManagedObject(optionalModuleDecorator.value());
  }

  RCTComponentData *componentData = [[RCTComponentData alloc] initWithManagerClass:viewManagerClass
                                                                            bridge:bridge
                                                                   eventDispatcher:eventDispatcher];
  return wrapManagedObject([[RCTLegacyViewManagerInteropCoordinator alloc]
      initWithComponentData:componentData
                     bridge:bridge
      bridgelessInteropData:bridgeModuleDecorator]);
}

LegacyViewManagerInteropComponentDescriptor::LegacyViewManagerInteropComponentDescriptor(
    ComponentDescriptorParameters const &parameters)
    : ConcreteComponentDescriptor(parameters), _coordinator(constructCoordinator(contextContainer_, flavor_))
{
}

ComponentHandle LegacyViewManagerInteropComponentDescriptor::getComponentHandle() const
{
  return reinterpret_cast<ComponentHandle>(getComponentName());
}

ComponentName LegacyViewManagerInteropComponentDescriptor::getComponentName() const
{
  return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
}

void LegacyViewManagerInteropComponentDescriptor::adopt(ShadowNode::Unshared const &shadowNode) const
{
  ConcreteComponentDescriptor::adopt(shadowNode);

  assert(std::dynamic_pointer_cast<LegacyViewManagerInteropShadowNode>(shadowNode));
  auto legacyViewManagerInteropShadowNode = std::static_pointer_cast<LegacyViewManagerInteropShadowNode>(shadowNode);

  auto state = LegacyViewManagerInteropState{};
  state.coordinator = _coordinator;

  legacyViewManagerInteropShadowNode->setStateData(std::move(state));
}
} // namespace react
} // namespace facebook
