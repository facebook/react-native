/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/progressbar/AndroidProgressBarMeasurementsManager.h>
#include <react/renderer/components/rncore/EventEmitters.h>
#include <react/renderer/components/rncore/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char AndroidProgressBarComponentName[];

/*
 * `ShadowNode` for <AndroidProgressBar> component.
 */
class AndroidProgressBarShadowNode final : public ConcreteViewShadowNode<
                                               AndroidProgressBarComponentName,
                                               AndroidProgressBarProps,
                                               AndroidProgressBarEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Associates a shared `AndroidProgressBarMeasurementsManager` with the node.
  void setAndroidProgressBarMeasurementsManager(
      const std::shared_ptr<AndroidProgressBarMeasurementsManager>
          &measurementsManager);

#pragma mark - LayoutableShadowNode

  Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const override;

 private:
  std::shared_ptr<AndroidProgressBarMeasurementsManager> measurementsManager_;
};

} // namespace react
} // namespace facebook
