/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/ConcreteViewShadowNode.h>
#include "RCTARTSurfaceViewProps.h"

namespace facebook {
namespace react {

extern const char RCTARTSurfaceViewComponentName[];

/*
 * `ShadowNode` for <ARTSurfaceView> component.
 */
using RCTARTSurfaceShadowNode = ConcreteViewShadowNode<
    RCTARTSurfaceViewComponentName,
    RCTARTSurfaceViewProps,
    ViewEventEmitter>;

} // namespace react
} // namespace facebook
