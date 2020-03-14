/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include "TestComponent.h"

using namespace facebook::react;

class FindNodeAtPointTest : public ::testing::Test {
 protected:
  FindNodeAtPointTest()
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

    nodeAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAA,
        traits);

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

    nodeA_->appendChild(nodeAA_);
    nodeAA_->appendChild(nodeAAA_);

    auto layoutMetrics = EmptyLayoutMetrics;

    layoutMetrics.frame = facebook::react::Rect{
        facebook::react::Point{0, 0}, facebook::react::Size{1000, 1000}};
    nodeA_->setLayoutMetrics(layoutMetrics);

    layoutMetrics.frame = facebook::react::Rect{
        facebook::react::Point{100, 100}, facebook::react::Size{100, 100}};
    nodeAA_->setLayoutMetrics(layoutMetrics);

    layoutMetrics.frame = facebook::react::Rect{facebook::react::Point{10, 10},
                                                facebook::react::Size{10, 10}};
    nodeAAA_->setLayoutMetrics(layoutMetrics);
  }

  std::shared_ptr<EventDispatcher const> eventDispatcher_;
  std::shared_ptr<TestShadowNode> nodeA_;
  std::shared_ptr<TestShadowNode> nodeAA_;
  std::shared_ptr<TestShadowNode> nodeAAA_;
  TestComponentDescriptor componentDescriptor_;
};

TEST_F(FindNodeAtPointTest, withoutTransform) {
  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(nodeA_, {115, 115}), nodeAAA_);
  EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {105, 105}), nodeAA_);
  EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {900, 900}), nodeA_);
  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(nodeA_, {1001, 1001}), nullptr);
}

TEST_F(FindNodeAtPointTest, viewIsTranslated) {
  nodeA_->_transform =
      Transform::Identity() * Transform::Translate(-100, -100, 0);

  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(nodeA_, {15, 15})->getTag(),
      nodeAAA_->getTag());
  EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {5, 5}), nodeAA_);
}

TEST_F(FindNodeAtPointTest, viewIsScaled) {
  nodeAAA_->_transform = Transform::Identity() * Transform::Scale(0.5, 0.5, 0);

  EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {119, 119}), nodeAA_);
}
