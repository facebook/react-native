
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/rncore/EventEmitters.h>
#include <react/components/rncore/Props.h>
#include <react/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char ActivityIndicatorViewComponentName[];

/*
 * `ShadowNode` for <ActivityIndicatorView> component.
 */
using ActivityIndicatorViewShadowNode = ConcreteViewShadowNode<
    ActivityIndicatorViewComponentName,
    ActivityIndicatorViewProps>;

extern const char SwitchComponentName[];

/*
 * `ShadowNode` for <Switch> component.
 */
using SwitchShadowNode = ConcreteViewShadowNode<
    SwitchComponentName,
    SwitchProps,
SwitchEventEmitter>;

} // namespace react
} // namespace facebook
