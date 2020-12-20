/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/unimplementedview/UnimplementedViewProps.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char UnimplementedViewComponentName[];

using UnimplementedViewShadowNode = ConcreteViewShadowNode<
    UnimplementedViewComponentName,
    UnimplementedViewProps>;

} // namespace react
} // namespace facebook
