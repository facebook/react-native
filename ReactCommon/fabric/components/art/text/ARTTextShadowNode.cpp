/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ARTTextShadowNode.h"
#include <Glog/logging.h>
#include <react/components/art/ARTText.h>

namespace facebook {
namespace react {

extern const char ARTTextComponentName[] = "ARTText";

ARTElement::Shared ARTTextShadowNode::getARTElement() const {
  auto props = getConcreteProps();
  return std::make_shared<ARTText>(
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
