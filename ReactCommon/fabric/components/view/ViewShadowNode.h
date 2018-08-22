/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/view/ViewProps.h>
#include <fabric/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char ViewComponentName[];

using ViewShadowNode =
  ConcreteViewShadowNode<
    ViewComponentName,
    ViewProps,
    ViewEventEmitter
  >;

} // namespace react
} // namespace facebook
