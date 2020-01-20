/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include "TestComponent.h"

using namespace facebook::react;

class LayoutableShadowNodeTest : public ::testing::Test {
 protected:
  LayoutableShadowNodeTest()
      : eventDispatcher_(std::shared_ptr<EventDispatcher const>()),
        componentDescriptor_(TestComponentDescriptor({eventDispatcher_})) {
    auto familyA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 9,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);

    nodeA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyA,
        ShadowNodeTraits{});

    auto familyB = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 10,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);

    nodeB_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyB,
        ShadowNodeTraits{});

    nodeA_->appendChild(nodeB_);
  }

  std::shared_ptr<EventDispatcher const> eventDispatcher_;
  std::shared_ptr<TestShadowNode> nodeA_;
  std::shared_ptr<TestShadowNode> nodeB_;
  TestComponentDescriptor componentDescriptor_;
};

TEST_F(LayoutableShadowNodeTest, relativeLayourMetrics) {
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.origin = {10, 20};
  layoutMetrics.frame.size = {100, 200};
  nodeA_->setLayoutMetrics(layoutMetrics);
  nodeB_->setLayoutMetrics(layoutMetrics);

  auto relativeLayoutMetrics = nodeB_->getRelativeLayoutMetrics(*nodeA_, {});

  // A is a parent to B, A has origin {10, 10}, B has origin {10, 10}.
  // B's relative origin to A should be {10, 10}.
  // D19447900 has more about the issue.
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 10);
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 20);
}

TEST_F(LayoutableShadowNodeTest, relativeLayourMetricsOnClonedNode) {
  // B is cloned and mutated.
  auto nodeBRevision2 = std::static_pointer_cast<TestShadowNode>(
      componentDescriptor_.cloneShadowNode(*nodeB_, ShadowNodeFragment{}));
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.size = {500, 600};
  nodeBRevision2->setLayoutMetrics(layoutMetrics);
  nodeA_->replaceChild(*nodeB_, nodeBRevision2);

  // Even if we ask old ShadowNode for its relative layoutMetrics, it needs to
  // return correct, new layoutMetrics. D19433873 has more about the issue.
  auto newRelativeLayoutMetrics = nodeB_->getRelativeLayoutMetrics(*nodeA_, {});
  EXPECT_EQ(newRelativeLayoutMetrics.frame.size.width, 500);
  EXPECT_EQ(newRelativeLayoutMetrics.frame.size.height, 600);
}
