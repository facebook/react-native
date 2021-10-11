/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include "AndroidProgressBarMeasurementsManager.h"
#include "AndroidProgressBarShadowNode.h"

namespace facebook {
namespace react {

/*
 * Descriptor for <AndroidProgressBar> component.
 */
class AndroidProgressBarComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidProgressBarShadowNode> {
 public:
  AndroidProgressBarComponentDescriptor(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(
            std::make_shared<AndroidProgressBarMeasurementsManager>(
                contextContainer_)) {}

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    react_native_assert(
        std::dynamic_pointer_cast<AndroidProgressBarShadowNode>(shadowNode));
    auto androidProgressBarShadowNode =
        std::static_pointer_cast<AndroidProgressBarShadowNode>(shadowNode);

    // `AndroidProgressBarShadowNode` uses
    // `AndroidProgressBarMeasurementsManager` to provide measurements to Yoga.
    androidProgressBarShadowNode->setAndroidProgressBarMeasurementsManager(
        measurementsManager_);

    // All `AndroidProgressBarShadowNode`s must have leaf Yoga nodes with
    // properly setup measure function.
    androidProgressBarShadowNode->enableMeasurement();
  }

 private:
  const std::shared_ptr<AndroidProgressBarMeasurementsManager>
      measurementsManager_;
};

} // namespace react
} // namespace facebook
