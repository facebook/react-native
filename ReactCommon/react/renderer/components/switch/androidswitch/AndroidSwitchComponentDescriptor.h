/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidSwitchMeasurementsManager.h"
#include "AndroidSwitchShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <AndroidSwitch> component.
 */
class AndroidSwitchComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidSwitchShadowNode> {
 public:
  AndroidSwitchComponentDescriptor(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(std::make_shared<AndroidSwitchMeasurementsManager>(
            contextContainer_)) {}

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<AndroidSwitchShadowNode>(shadowNode));
    auto androidSwitchShadowNode =
        std::static_pointer_cast<AndroidSwitchShadowNode>(shadowNode);

    // `AndroidSwitchShadowNode` uses `AndroidSwitchMeasurementsManager` to
    // provide measurements to Yoga.
    androidSwitchShadowNode->setAndroidSwitchMeasurementsManager(
        measurementsManager_);

    // All `AndroidSwitchShadowNode`s must have leaf Yoga nodes with properly
    // setup measure function.
    androidSwitchShadowNode->enableMeasurement();
  }

 private:
  const std::shared_ptr<AndroidSwitchMeasurementsManager> measurementsManager_;
};

} // namespace react
} // namespace facebook
