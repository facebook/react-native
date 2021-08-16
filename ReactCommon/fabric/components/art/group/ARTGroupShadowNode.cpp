/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTGroupShadowNode.h>
#include <Glog/logging.h>
#include <react/components/art/ARTElement.h>
#include <react/components/art/ARTGroup.h>

namespace facebook {
namespace react {

extern const char ARTGroupComponentName[] = "ARTGroup";

ARTElement::Shared ARTGroupShadowNode::getARTElement() const {
  auto elements = ARTElement::ListOfShared{};
  for (auto const &child : getChildren()) {
    auto node = std::dynamic_pointer_cast<ARTBaseShadowNode const>(child);
    if (node) {
      elements.push_back(node->getARTElement());
    }
  }

  auto props = getConcreteProps();
  return std::make_shared<ARTGroup>(
      props.opacity, props.transform, elements, props.clipping);
}
} // namespace react
} // namespace facebook
