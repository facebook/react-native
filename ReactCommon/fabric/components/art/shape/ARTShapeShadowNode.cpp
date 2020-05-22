/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ARTShapeShadowNode.h"
#include <Glog/logging.h>
#include <react/components/art/ARTShape.h>
namespace facebook {
namespace react {

extern const char ARTShapeComponentName[] = "ARTShape";

ARTElement::Shared ARTShapeShadowNode::getARTElement() const {
  auto props = getConcreteProps();
  return std::make_shared<ARTShape>(
      props.opacity,
      props.transform,
      props.d,
      props.stroke,
      props.strokeDash,
      props.fill,
      props.strokeWidth,
      props.strokeCap,
      props.strokeJoin);
}

} // namespace react
} // namespace facebook
