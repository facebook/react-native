/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/renderer/core/ConcreteShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

#include "TestComponent.h"

using namespace facebook::react;

TEST(ConcreteShadowNodeTest, testSetStateData) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};

  auto element = Element<ScrollViewShadowNode>();

  auto shadowNode = builder.build(element);

  shadowNode->setStateData({{10, 11}, {{21, 22}, {301, 302}}, 0});

  EXPECT_NE(
      shadowNode->getState(), shadowNode->getFamily().getMostRecentState());

  shadowNode->setMounted(true);

  EXPECT_EQ(
      shadowNode->getState(), shadowNode->getFamily().getMostRecentState());

  auto stateData = shadowNode->getStateData();

  EXPECT_EQ(stateData.contentOffset.x, 10);
  EXPECT_EQ(stateData.contentOffset.y, 11);

  EXPECT_EQ(stateData.contentBoundingRect.origin.x, 21);
  EXPECT_EQ(stateData.contentBoundingRect.origin.y, 22);

  EXPECT_EQ(stateData.contentBoundingRect.size.width, 301);
  EXPECT_EQ(stateData.contentBoundingRect.size.height, 302);
}
