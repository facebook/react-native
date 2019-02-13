/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/activityindicator/ActivityIndicatorViewShadowNode.h>
#include <react/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

using ActivityIndicatorViewComponentDescriptor =
    ConcreteComponentDescriptor<ActivityIndicatorViewShadowNode>;

} // namespace react
} // namespace facebook
