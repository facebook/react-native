/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/components/scrollview/ScrollEvent.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>

namespace facebook::react {

class EventAnimationDriverTests : public AnimationTestsBase {};

TEST_F(EventAnimationDriverTests, subscribeToViewEvent) {
  initNodesManager();

  auto tag = getNextRootViewTag();

  auto viewTag = ++tag;
  const auto animatedValueTag = ++tag;
  const auto animatedValueTag2 = ++tag;

  const auto eventName = "scroll";

  const folly::dynamic valueNodeConfig =
      folly::dynamic::object("type", "value")("value", 0)("offset", 0);

  // Call onRender once to initialize thread local
  nodesManager_->onRender();

  {
    nodesManager_->createAnimatedNode(animatedValueTag, valueNodeConfig);

    folly::dynamic eventMapping =
        folly::dynamic::object("animatedValueTag", animatedValueTag)(
            "nativeEventPath", folly::dynamic::array("contentOffset", "y"));
    nodesManager_->addAnimatedEventToView(viewTag, eventName, eventMapping);
  }

  {
    nodesManager_->createAnimatedNode(animatedValueTag2, valueNodeConfig);

    folly::dynamic eventMapping =
        folly::dynamic::object("animatedValueTag", animatedValueTag2)(
            "nativeEventPath", folly::dynamic::array("zoomScale"));
    nodesManager_->addAnimatedEventToView(viewTag, eventName, eventMapping);
  }

  EXPECT_EQ(nodesManager_->getValue(animatedValueTag), 0);
  EXPECT_EQ(nodesManager_->getValue(animatedValueTag2), 0);

  auto scrollEvent = std::make_shared<ScrollEvent>();
  scrollEvent->contentSize = {.width = 1, .height = 2};
  scrollEvent->contentOffset = {.x = 3, .y = 4};
  scrollEvent->contentInset = {.left = 5, .top = 6, .right = 7, .bottom = 8};
  scrollEvent->containerSize = {.width = 9, .height = 10};
  scrollEvent->zoomScale = 11.0f;

  const std::string eventType{eventName};
  const SharedEventPayload payload = scrollEvent;
  (*nodesManager_->getEventEmitterListener())(viewTag, eventName, *scrollEvent);

  EXPECT_EQ(nodesManager_->getValue(animatedValueTag), 4);
  EXPECT_EQ(nodesManager_->getValue(animatedValueTag2), 11);
}

} // namespace facebook::react
