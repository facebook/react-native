/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTTextShadowNode.h>
#include <react/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

using ARTTextComponentDescriptor =
    ConcreteComponentDescriptor<ARTTextShadowNode>;

} // namespace react
} // namespace facebook
