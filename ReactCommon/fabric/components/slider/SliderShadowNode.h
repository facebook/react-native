/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/slider/SliderEventEmitter.h>
#include <react/components/slider/SliderProps.h>
#include <react/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char SliderComponentName[];

/*
 * `ShadowNode` for <Slider> component.
 */
using SliderShadowNode = ConcreteViewShadowNode<
    SliderComponentName,
    SliderProps,
    SliderEventEmitter>;

} // namespace react
} // namespace facebook
