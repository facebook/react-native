/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>

namespace facebook::react {

class AnimationDriverTests : public AnimationTestsBase {
 protected:
  double round(double value) noexcept {
    // Round to 2 decimal places
    return std::ceil(value * 100) / 100;
  }
};

TEST_F(AnimationDriverTests, framesAnimation) {
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      valueNodeTag,
      folly::dynamic::object("type", "value")("value", 0)("offset", 0));

  const auto animationId = 1;
  const auto frames = folly::dynamic::array(0.0f, 0.1f, 0.4f, 0.9f, 1.0f);
  const auto toValue = 100;
  nodesManager_->startAnimatingNode(
      animationId,
      valueNodeTag,
      folly::dynamic::object("type", "frames")("frames", frames)(
          "toValue", toValue),
      std::nullopt);

  const double startTimeInTick = 12345;

  runAnimationFrame(startTimeInTick);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 0);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 2.5);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 65);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 3);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 90);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 4);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), toValue);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 10);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), toValue);
}

} // namespace facebook::react
