/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTGroupShadowNode.h>
#include <Glog/logging.h>
#include <react/components/art/Element.h>
#include <react/components/art/Group.h>

namespace facebook {
namespace react {

extern const char ARTGroupComponentName[] = "ARTGroup";

Element::Shared ARTGroupShadowNode::getElement() const {
  auto elements = Element::ListOfShared{};
  for (auto const &child : getChildren()) {
    auto node = std::dynamic_pointer_cast<ARTBaseShadowNode const>(child);
    if (node) {
      elements.push_back(node->getElement());
    }
  }

  auto props = getConcreteProps();
  return std::make_shared<Group>(
      props.opacity, props.transform, elements, props.clipping);
}
} // namespace react
} // namespace facebook
