/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowTreeRevision.h"

namespace facebook {
namespace react {

using Number = ShadowTreeRevision::Number;

ShadowTreeRevision::ShadowTreeRevision(
    ShadowNode::Shared const &rootShadowNode,
    Number number,
    MountingTelemetry telemetry)
    : rootShadowNode_(rootShadowNode), number_(number), telemetry_(telemetry) {}

MountingTelemetry const &ShadowTreeRevision::getTelemetry() const {
  return telemetry_;
}

ShadowNode const &ShadowTreeRevision::getRootShadowNode() {
  return *rootShadowNode_;
}

Number ShadowTreeRevision::getNumber() const {
  return number_;
}

} // namespace react
} // namespace facebook
