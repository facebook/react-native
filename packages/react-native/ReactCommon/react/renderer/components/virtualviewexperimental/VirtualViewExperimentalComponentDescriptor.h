/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/virtualviewexperimental/VirtualViewExperimentalShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <VirtualView2> component.
 */
using VirtualViewExperimentalComponentDescriptor =
    ConcreteComponentDescriptor<VirtualViewExperimentalShadowNode>;
} // namespace facebook::react
