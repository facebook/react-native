/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/scrollview/ScrollViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

using ScrollViewComponentDescriptor =
    ConcreteComponentDescriptor<ScrollViewShadowNode>;

} // namespace react
} // namespace facebook
