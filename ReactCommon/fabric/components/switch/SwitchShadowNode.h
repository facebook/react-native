/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/switch/SwitchEventEmitter.h>
#include <fabric/components/switch/SwitchProps.h>
#include <fabric/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char SwitchComponentName[];

/*
 * `ShadowNode` for <Switch> component.
 */
using SwitchShadowNode =
  ConcreteViewShadowNode<
    SwitchComponentName,
    SwitchProps,
    SwitchEventEmitter
  >;

} // namespace react
} // namespace facebook
