/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/text/RawTextShadowNode.h>
#include <react/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

using RawTextComponentDescriptor =
    ConcreteComponentDescriptor<RawTextShadowNode>;

} // namespace react
} // namespace facebook
