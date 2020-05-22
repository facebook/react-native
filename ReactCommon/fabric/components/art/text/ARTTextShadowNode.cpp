/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ARTTextShadowNode.h"
#include <Glog/logging.h>
#include <react/components/art/Text.h>

namespace facebook {
namespace react {

extern const char ARTTextComponentName[] = "ARTText";

Element::Shared ARTTextShadowNode::getElement() const {
  auto props = getConcreteProps();
  return std::make_shared<Text>(
      props.opacity,
      props.transform,
      props.d,
      props.stroke,
      props.strokeDash,
      props.fill,
      props.strokeWidth,
      props.strokeCap,
      props.strokeJoin,
      props.alignment,
      props.frame);
}

} // namespace react
} // namespace facebook
