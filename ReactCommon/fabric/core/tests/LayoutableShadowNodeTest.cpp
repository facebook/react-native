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
    auto traits = TestShadowNode::BaseTraits();

    auto familyA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 9,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);

    nodeA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyA,
        traits);

    auto familyAA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 10,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);

    auto rootTraits = traits;
    rootTraits.set(ShadowNodeTraits::Trait::RootNodeKind);

    nodeAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAA,
        rootTraits);

    auto familyAAA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 11,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);

    nodeAAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAAA,
        traits);

    auto familyAAAA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 11,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);

    nodeAAAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAAAA,
        traits);

    nodeA_->appendChild(nodeAA_);
    nodeAA_->appendChild(nodeAAA_);
    nodeAAA_->appendChild(nodeAAAA_);
  }

  std::shared_ptr<EventDispatcher const> eventDispatcher_;
  std::shared_ptr<TestShadowNode> nodeA_;
  std::shared_ptr<TestShadowNode> nodeAA_;
  std::shared_ptr<TestShadowNode> nodeAAA_;
  std::shared_ptr<TestShadowNode> nodeAAAA_;
  TestComponentDescriptor componentDescriptor_;
};

TEST_F(LayoutableShadowNodeTest, relativeLayoutMetrics) {
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.origin = {10, 20};
  layoutMetrics.frame.size = {100, 200};
  nodeA_->setLayoutMetrics(layoutMetrics);
  nodeAA_->setLayoutMetrics(layoutMetrics);

  auto relativeLayoutMetrics = nodeAA_->getRelativeLayoutMetrics(*nodeA_, {});

  // A is a parent to B, A has origin {10, 10}, B has origin {10, 10}.
  // B's relative origin to A should be {10, 10}.
  // D19447900 has more about the issue.
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 10);
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 20);
}

TEST_F(LayoutableShadowNodeTest, relativeLayoutMetricsOnTransformedNode) {
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.size = {1000, 1000};
  nodeA_->setLayoutMetrics(layoutMetrics);

  layoutMetrics.frame.origin = {10, 20};
  layoutMetrics.frame.size = {100, 200};
  nodeAA_->_transform = Transform::Scale(0.5, 0.5, 1);
  nodeAA_->setLayoutMetrics(layoutMetrics);

  auto relativeLayoutMetrics = nodeAA_->getRelativeLayoutMetrics(*nodeA_, {});

  EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 35);
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 70);

  EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 50);
  EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 100);
}

TEST_F(LayoutableShadowNodeTest, relativeLayoutMetricsOnTransformedParent) {
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.size = {1000, 1000};
  nodeA_->setLayoutMetrics(layoutMetrics);
  nodeAA_->setLayoutMetrics(layoutMetrics);

  layoutMetrics.frame.origin = {10, 10};
  layoutMetrics.frame.size = {100, 100};
  nodeAAA_->_transform = Transform::Scale(0.5, 0.5, 1);
  nodeAAA_->setLayoutMetrics(layoutMetrics);

  layoutMetrics.frame.origin = {10, 10};
  layoutMetrics.frame.size = {50, 50};
  nodeAAAA_->setLayoutMetrics(layoutMetrics);

  auto relativeLayoutMetrics =
      nodeAAAA_->getRelativeLayoutMetrics(*nodeAA_, {});

  EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 45);
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 45);

  EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 25);
  EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 25);
}

TEST_F(LayoutableShadowNodeTest, relativeLayoutMetricsOnSameNode) {
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.origin = {10, 20};
  layoutMetrics.frame.size = {100, 200};
  nodeA_->setLayoutMetrics(layoutMetrics);

  auto relativeLayoutMetrics = nodeA_->getRelativeLayoutMetrics(*nodeA_, {});

  EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 0);
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 0);
  EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 100);
  EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 200);
}

TEST_F(LayoutableShadowNodeTest, relativeLayourMetricsOnClonedNode) {
  // B is cloned and mutated.
  auto nodeBRevision2 = std::static_pointer_cast<TestShadowNode>(
      componentDescriptor_.cloneShadowNode(*nodeAA_, ShadowNodeFragment{}));
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.size = {500, 600};
  nodeBRevision2->setLayoutMetrics(layoutMetrics);
  nodeA_->replaceChild(*nodeAA_, nodeBRevision2);

  // Even if we ask old ShadowNode for its relative layoutMetrics, it needs to
  // return correct, new layoutMetrics. D19433873 has more about the issue.
  auto newRelativeLayoutMetrics =
      nodeAA_->getRelativeLayoutMetrics(*nodeA_, {});
  EXPECT_EQ(newRelativeLayoutMetrics.frame.size.width, 500);
  EXPECT_EQ(newRelativeLayoutMetrics.frame.size.height, 600);
}

TEST_F(LayoutableShadowNodeTest, relativeLayoutMetricsOnSameNode2) {
  auto layoutMetrics = EmptyLayoutMetrics;
  nodeA_->setLayoutMetrics(layoutMetrics);
  layoutMetrics.frame.origin = {10, 10};
  nodeAA_->setLayoutMetrics(layoutMetrics);
  nodeAAA_->setLayoutMetrics(layoutMetrics);

  auto relativeLayoutMetrics = nodeAAA_->getRelativeLayoutMetrics(*nodeA_, {});

  EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 10);
  EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 10);
}
