/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTTextProps.h>
#include <react/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char ARTTextComponentName[];

/*
 * `ShadowNode` for <ARTText> component.
 */
using ARTTextShadowNode =
    ConcreteShadowNode<ARTTextComponentName, ShadowNode, ARTTextProps>;

} // namespace react
} // namespace facebook
