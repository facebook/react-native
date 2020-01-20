/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/core/ConcreteShadowNode.h>
#include <react/core/ShadowNode.h>

#include "TestComponent.h"

using namespace facebook::react;

class ShadowNodeTest : public ::testing::Test {
 protected:
  ShadowNodeTest()
      : eventDispatcher_(std::shared_ptr<EventDispatcher const>()),
        componentDescriptor_(TestComponentDescriptor({eventDispatcher_})) {
    /*
     * The structure:
     * <A>
     *  <AA/>
     *  <AB>
     *    <ABA/>
     *    <ABB/>
     *  </AB>
     *  <AC/>
     * </A>
     * </Z>
     */

    auto props = std::make_shared<const TestProps>();

    auto familyAA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 11,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);
    nodeAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAA,
        ShadowNodeTraits{});

    auto familyABA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 12,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);
    nodeABA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyABA,
        ShadowNodeTraits{});

    auto familyABB = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 13,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);
    nodeABB_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyABB,
        ShadowNodeTraits{});

    auto nodeABChildren = std::make_shared<SharedShadowNodeList>(
        SharedShadowNodeList{nodeABA_, nodeABB_});

    auto familyAB = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 15,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);
    nodeAB_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ nodeABChildren,
        },
        familyAB,
        ShadowNodeTraits{});

    auto familyAC = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 16,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);
    nodeAC_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAC,
        ShadowNodeTraits{});

    auto nodeAChildren = std::make_shared<SharedShadowNodeList>(
        SharedShadowNodeList{nodeAA_, nodeAB_, nodeAC_});

    auto familyA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 17,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);
    nodeA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ nodeAChildren,
        },
        familyA,
        ShadowNodeTraits{});

    auto familyZ = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 18,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        componentDescriptor_);
    nodeZ_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyZ,
        ShadowNodeTraits{});
  }

  std::shared_ptr<EventDispatcher const> eventDispatcher_;
  std::shared_ptr<TestShadowNode> nodeA_;
  std::shared_ptr<TestShadowNode> nodeAA_;
  std::shared_ptr<TestShadowNode> nodeABA_;
  std::shared_ptr<TestShadowNode> nodeABB_;
  std::shared_ptr<TestShadowNode> nodeAB_;
  std::shared_ptr<TestShadowNode> nodeAC_;
  std::shared_ptr<TestShadowNode> nodeZ_;
  TestComponentDescriptor componentDescriptor_;

  SurfaceId surfaceId_ = 1;
};

TEST_F(ShadowNodeTest, handleShadowNodeCreation) {
  EXPECT_FALSE(nodeZ_->getSealed());
  EXPECT_STREQ(nodeZ_->getComponentName(), "Test");
  EXPECT_EQ(nodeZ_->getTag(), 18);
  EXPECT_EQ(nodeZ_->getSurfaceId(), surfaceId_);
  EXPECT_EQ(nodeZ_->getEventEmitter(), nullptr);
  EXPECT_EQ(nodeZ_->getChildren().size(), 0);
}

TEST_F(ShadowNodeTest, handleSealRecusive) {
  nodeZ_->sealRecursive();
  EXPECT_TRUE(nodeZ_->getSealed());
  EXPECT_TRUE(nodeZ_->getProps()->getSealed());
}

TEST_F(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto nodeARevision2 =
      std::make_shared<TestShadowNode>(*nodeA_, ShadowNodeFragment{});

  EXPECT_STREQ(nodeA_->getComponentName(), nodeARevision2->getComponentName());
  EXPECT_EQ(nodeA_->getTag(), nodeARevision2->getTag());
  EXPECT_EQ(nodeA_->getSurfaceId(), nodeARevision2->getSurfaceId());
  EXPECT_EQ(nodeA_->getEventEmitter(), nodeARevision2->getEventEmitter());
}

TEST_F(ShadowNodeTest, handleShadowNodeMutation) {
  auto nodeABChildren = nodeAB_->getChildren();
  EXPECT_EQ(nodeABChildren.size(), 2);
  EXPECT_EQ(nodeABChildren.at(0), nodeABA_);
  EXPECT_EQ(nodeABChildren.at(1), nodeABB_);

  auto nodeABArevision2 =
      std::make_shared<TestShadowNode>(*nodeABA_, ShadowNodeFragment{});
  nodeAB_->replaceChild(*nodeABA_, nodeABArevision2);
  nodeABChildren = nodeAB_->getChildren();
  EXPECT_EQ(nodeABChildren.size(), 2);
  EXPECT_EQ(nodeABChildren.at(0), nodeABArevision2);
  EXPECT_EQ(nodeABChildren.at(1), nodeABB_);

  // Seal the entire tree.
  nodeAB_->sealRecursive();
  EXPECT_TRUE(nodeAB_->getSealed());
  EXPECT_TRUE(nodeABArevision2->getSealed());
  EXPECT_TRUE(nodeABB_->getSealed());

  // No more mutation after sealing.
  EXPECT_THROW(nodeABArevision2->setLocalData(nullptr), std::runtime_error);

  auto nodeABArevision3 =
      std::make_shared<TestShadowNode>(*nodeABArevision2, ShadowNodeFragment{});
  nodeABArevision3->setLocalData(nullptr);
  EXPECT_EQ(nodeABArevision3->getLocalData(), nullptr);
}

TEST_F(ShadowNodeTest, handleCloneFunction) {
  auto nodeABClone = nodeAB_->clone({});

  // Those two nodes are *not* same.
  EXPECT_NE(nodeAB_, nodeABClone);

  // `secondNodeClone` is an instance of `TestShadowNode`.
  EXPECT_NE(
      std::dynamic_pointer_cast<const TestShadowNode>(nodeABClone), nullptr);

  // Both nodes have same content.
  EXPECT_EQ(nodeAB_->getTag(), nodeABClone->getTag());
  EXPECT_EQ(nodeAB_->getSurfaceId(), nodeABClone->getSurfaceId());
  EXPECT_EQ(nodeAB_->getProps(), nodeABClone->getProps());
}

TEST_F(ShadowNodeTest, handleLocalData) {
  auto localData42 = std::make_shared<TestLocalData>();
  localData42->setNumber(42);

  auto anotherLocalData42 = std::make_shared<TestLocalData>();
  anotherLocalData42->setNumber(42);

  auto localDataOver9000 = std::make_shared<TestLocalData>();
  localDataOver9000->setNumber(9001);
  auto props = std::make_shared<const TestProps>();

  nodeAA_->setLocalData(localData42);
  nodeAB_->setLocalData(localData42);
  nodeAC_->setLocalData(localDataOver9000);

  // LocalData object are compared by pointer, not by value.
  EXPECT_EQ(nodeAA_->getLocalData(), nodeAB_->getLocalData());
  EXPECT_NE(nodeAA_->getLocalData(), nodeAC_->getLocalData());
  nodeAB_->setLocalData(anotherLocalData42);
  EXPECT_NE(nodeAA_->getLocalData(), nodeAB_->getLocalData());

  // LocalData cannot be changed for sealed shadow node.
  nodeAB_->sealRecursive();
  EXPECT_ANY_THROW(nodeAB_->setLocalData(localDataOver9000));
}

TEST_F(ShadowNodeTest, handleBacktracking) {
  // Negative case:
  auto ancestors1 = nodeZ_->getAncestors(*nodeA_);
  EXPECT_EQ(ancestors1.size(), 0);

  // Positive case:
  auto ancestors2 = nodeABB_->getAncestors(*nodeA_);
  EXPECT_EQ(ancestors2.size(), 2);
  EXPECT_EQ(&ancestors2[0].first.get(), nodeA_.get());
  EXPECT_EQ(&ancestors2[1].first.get(), nodeAB_.get());
}
