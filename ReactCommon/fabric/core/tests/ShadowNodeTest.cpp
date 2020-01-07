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

TEST(ShadowNodeTest, handleShadowNodeCreation) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptor = TestComponentDescriptor(
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});
  auto family = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto node = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ std::make_shared<const TestProps>(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family,
      ShadowNodeTraits{});

  ASSERT_FALSE(node->getSealed());
  ASSERT_STREQ(node->getComponentName(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getSurfaceId(), 1);
  ASSERT_EQ(node->getEventEmitter(), nullptr);
  ASSERT_EQ(node->getChildren().size(), 0);

  node->sealRecursive();
  ASSERT_TRUE(node->getSealed());
  ASSERT_TRUE(node->getProps()->getSealed());
}

TEST(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptor = TestComponentDescriptor(
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});
  auto family = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto node = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ std::make_shared<const TestProps>(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family,
      ShadowNodeTraits{});
  auto node2 = std::make_shared<TestShadowNode>(*node, ShadowNodeFragment{});

  ASSERT_STREQ(node->getComponentName(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getSurfaceId(), 1);
  ASSERT_EQ(node->getEventEmitter(), nullptr);
}

TEST(ShadowNodeTest, handleShadowNodeMutation) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptor = TestComponentDescriptor(
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});
  auto family1 = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 1,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto props = std::make_shared<const TestProps>();
  auto node1 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ std::make_shared<const TestProps>(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family1,
      ShadowNodeTraits{});
  auto family2 = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 2,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto node2 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ std::make_shared<const TestProps>(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family2,
      ShadowNodeTraits{});
  auto family3 = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 2,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto node3 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ std::make_shared<const TestProps>(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family3,
      ShadowNodeTraits{});

  node1->appendChild(node2);
  node1->appendChild(node3);
  auto node1Children = node1->getChildren();
  ASSERT_EQ(node1Children.size(), 2);
  ASSERT_EQ(node1Children.at(0), node2);
  ASSERT_EQ(node1Children.at(1), node3);

  auto node4 = std::make_shared<TestShadowNode>(*node2, ShadowNodeFragment{});
  node1->replaceChild(*node2, node4);
  node1Children = node1->getChildren();
  ASSERT_EQ(node1Children.size(), 2);
  ASSERT_EQ(node1Children.at(0), node4);
  ASSERT_EQ(node1Children.at(1), node3);

  // Seal the entire tree.
  node1->sealRecursive();
  ASSERT_TRUE(node1->getSealed());
  ASSERT_TRUE(node3->getSealed());
  ASSERT_TRUE(node4->getSealed());

  // No more mutation after sealing.
  EXPECT_THROW(node4->setLocalData(nullptr), std::runtime_error);

  auto node5 = std::make_shared<TestShadowNode>(*node4, ShadowNodeFragment{});
  node5->setLocalData(nullptr);
  ASSERT_EQ(node5->getLocalData(), nullptr);
}

TEST(ShadowNodeTest, handleCloneFunction) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptor = TestComponentDescriptor(
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});
  auto family = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);

  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ std::make_shared<const TestProps>(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family,
      ShadowNodeTraits{});

  auto firstNodeClone = firstNode->clone({});

  // Those two nodes are *not* same.
  ASSERT_NE(firstNode, firstNodeClone);

  // `secondNodeClone` is an instance of `TestShadowNode`.
  ASSERT_NE(
      std::dynamic_pointer_cast<const TestShadowNode>(firstNodeClone), nullptr);

  // Both nodes have same content.
  ASSERT_EQ(firstNode->getTag(), firstNodeClone->getTag());
  ASSERT_EQ(firstNode->getSurfaceId(), firstNodeClone->getSurfaceId());
  ASSERT_EQ(firstNode->getProps(), firstNodeClone->getProps());
}

TEST(ShadowNodeTest, handleLocalData) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptor = TestComponentDescriptor(
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});
  auto family = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto localData42 = std::make_shared<TestLocalData>();
  localData42->setNumber(42);

  auto anotherLocalData42 = std::make_shared<TestLocalData>();
  anotherLocalData42->setNumber(42);

  auto localDataOver9000 = std::make_shared<TestLocalData>();
  localDataOver9000->setNumber(9001);
  auto props = std::make_shared<const TestProps>();
  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family,
      ShadowNodeTraits{});
  auto secondNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family,
      ShadowNodeTraits{});
  auto thirdNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      family,
      ShadowNodeTraits{});

  firstNode->setLocalData(localData42);
  secondNode->setLocalData(localData42);
  thirdNode->setLocalData(localDataOver9000);

  // LocalData object are compared by pointer, not by value.
  ASSERT_EQ(firstNode->getLocalData(), secondNode->getLocalData());
  ASSERT_NE(firstNode->getLocalData(), thirdNode->getLocalData());
  secondNode->setLocalData(anotherLocalData42);
  ASSERT_NE(firstNode->getLocalData(), secondNode->getLocalData());

  // LocalData cannot be changed for sealed shadow node.
  secondNode->sealRecursive();
  ASSERT_ANY_THROW(secondNode->setLocalData(localDataOver9000));
}

TEST(ShadowNodeTest, handleBacktracking) {
  /*
   * The structure:
   * <A>
   *  <AA/>
   *  <AB>
   *    <ABA/>
   *    <ABB/>
   *    <ABC/>
   *  </AB>
   *  <AC/>
   * </A>
   */

  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptor = TestComponentDescriptor(
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});
  auto props = std::make_shared<const TestProps>();

  auto familyAA = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeAA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyAA,
      ShadowNodeTraits{});

  auto familyABA = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeABA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyABA,
      ShadowNodeTraits{});

  auto familyABB = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeABB = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyABB,
      ShadowNodeTraits{});

  auto familyABC = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeABC = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyABC,
      ShadowNodeTraits{});

  auto nodeABChildren = std::make_shared<SharedShadowNodeList>(
      SharedShadowNodeList{nodeABA, nodeABB, nodeABC});

  auto familyAB = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeAB = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ nodeABChildren,
      },
      familyAB,
      ShadowNodeTraits{});

  auto familyAC = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeAC = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyAC,
      ShadowNodeTraits{});

  auto nodeAChildren = std::make_shared<SharedShadowNodeList>(
      SharedShadowNodeList{nodeAA, nodeAB, nodeAC});

  auto familyA = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ nodeAChildren,
      },
      familyA,
      ShadowNodeTraits{});

  auto familyZ = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 0,
          /* .surfaceId = */ 0,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeZ = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyZ,
      ShadowNodeTraits{});

  std::vector<std::reference_wrapper<const ShadowNode>> ancestors = {};

  // Negative case:
  auto ancestors1 = nodeZ->getAncestors(*nodeA);
  ASSERT_EQ(ancestors1.size(), 0);

  // Positive case:
  auto ancestors2 = nodeABC->getAncestors(*nodeA);
  ASSERT_EQ(ancestors2.size(), 2);
  ASSERT_EQ(&ancestors2[0].first.get(), nodeA.get());
  ASSERT_EQ(&ancestors2[1].first.get(), nodeAB.get());
}
