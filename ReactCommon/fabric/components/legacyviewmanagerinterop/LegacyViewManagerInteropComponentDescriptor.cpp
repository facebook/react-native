/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropComponentDescriptor.h"
#include "LegacyViewManagerInteropState.h"

namespace facebook {
namespace react {

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

  // Storing a component name inside the ShadowNode.
  auto state = LegacyViewManagerInteropState{};
  state.componentName =
      *std::static_pointer_cast<std::string const>(this->flavor_);

  legacyViewManagerInteropShadowNode->setStateData(std::move(state));
}
} // namespace react
} // namespace facebook
