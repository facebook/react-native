/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/drawerlayout/AndroidDrawerLayoutShadowNode.h>
#include "AndroidDrawerLayoutShadowNode.h"

namespace facebook::react {

/*
 * Descriptor for <AndroidDrawerLayout> component.
 */
class AndroidDrawerLayoutComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidDrawerLayoutShadowNode> {
 public:
  AndroidDrawerLayoutComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor(parameters) {}
};

} // namespace facebook::react
