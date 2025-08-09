/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "IOSSwitchShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <Switch> component.
 */
class SwitchComponentDescriptor final
    : public ConcreteComponentDescriptor<SwitchShadowNode> {
 public:
  SwitchComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor(parameters) {}

  void adopt(ShadowNode& shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto& switchShadowNode =
        static_cast<SwitchShadowNode&>(shadowNode);
  }
};

} // namespace facebook::react
