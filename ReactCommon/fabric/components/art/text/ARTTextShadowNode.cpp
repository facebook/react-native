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
  // TODO add support for Text
  return std::make_shared<Shape>();
}

} // namespace react
} // namespace facebook
