/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTGroupProps.h>
#include <react/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char ARTGroupComponentName[];

/*
 * `ShadowNode` for <ARTGroup> component.
 */
using ARTGroupShadowNode =
    ConcreteShadowNode<ARTGroupComponentName, ShadowNode, ARTGroupProps>;

extern const char ARTShapeComponentName[];

} // namespace react
} // namespace facebook
