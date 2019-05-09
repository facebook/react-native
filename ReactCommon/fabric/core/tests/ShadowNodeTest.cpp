/**
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

TEST(ShadowNodeTest, handleProps) {
  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));

  auto props = std::make_shared<Props>(Props(), raw);

  // Props are not sealed after applying raw props.
  ASSERT_FALSE(props->getSealed());

  ASSERT_STREQ(props->nativeId.c_str(), "abc");
}

TEST(ShadowNodeTest, handleShadowNodeCreation) {
  auto componentDescriptor = TestComponentDescriptor(nullptr);
  auto node = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .props = */ std::make_shared<const TestProps>(),
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

  ASSERT_FALSE(node->getSealed());
  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getSurfaceId(), 1);
  ASSERT_EQ(node->getEventEmitter(), nullptr);
  ASSERT_EQ(node->getChildren().size(), 0);

  ASSERT_STREQ(node->getProps()->nativeId.c_str(), "testNativeID");

  node->sealRecursive();
  ASSERT_TRUE(node->getSealed());
  ASSERT_TRUE(node->getProps()->getSealed());
}

TEST(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto componentDescriptor = TestComponentDescriptor(nullptr);
  auto node = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .props = */ std::make_shared<const TestProps>(),
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);
  auto node2 = std::make_shared<TestShadowNode>(*node, ShadowNodeFragment{});

  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getSurfaceId(), 1);
  ASSERT_EQ(node->getEventEmitter(), nullptr);
}

TEST(ShadowNodeTest, handleShadowNodeMutation) {
  auto componentDescriptor = TestComponentDescriptor(nullptr);
  auto props = std::make_shared<const TestProps>();
  auto node1 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 1,
          /* .surfaceId = */ 1,
          /* .props = */ std::make_shared<const TestProps>(),
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);
  auto node2 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 2,
          /* .surfaceId = */ 1,
          /* .props = */ std::make_shared<const TestProps>(),
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);
  auto node3 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 3,
          /* .surfaceId = */ 1,
          /* .props = */ std::make_shared<const TestProps>(),
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

  node1->appendChild(node2);
  node1->appendChild(node3);
  auto node1Children = node1->getChildren();
  ASSERT_EQ(node1Children.size(), 2);
  ASSERT_EQ(node1Children.at(0), node2);
  ASSERT_EQ(node1Children.at(1), node3);

  auto node4 = std::make_shared<TestShadowNode>(*node2, ShadowNodeFragment{});
  node1->replaceChild(node2, node4);
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
  auto componentDescriptor = TestComponentDescriptor(nullptr);

  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .props = */ std::make_shared<const TestProps>(),
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

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
  auto componentDescriptor = TestComponentDescriptor(nullptr);
  auto localData42 = std::make_shared<TestLocalData>();
  localData42->setNumber(42);

  auto anotherLocalData42 = std::make_shared<TestLocalData>();
  anotherLocalData42->setNumber(42);

  auto localDataOver9000 = std::make_shared<TestLocalData>();
  localDataOver9000->setNumber(9001);
  auto props = std::make_shared<const TestProps>();
  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);
  auto secondNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);
  auto thirdNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

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

  auto componentDescriptor = TestComponentDescriptor(nullptr);
  auto props = std::make_shared<const TestProps>();

  auto nodeAA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

  auto nodeABA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);
  auto nodeABB = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);
  auto nodeABC = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

  auto nodeABChildren = std::make_shared<SharedShadowNodeList>(
      SharedShadowNodeList{nodeABA, nodeABB, nodeABC});
  auto nodeAB = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ nodeABChildren,
      },
      componentDescriptor);

  auto nodeAC = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

  auto nodeAChildren = std::make_shared<SharedShadowNodeList>(
      SharedShadowNodeList{nodeAA, nodeAB, nodeAC});
  auto nodeA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ nodeAChildren,
      },
      componentDescriptor);

  auto nodeZ = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */ props,
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      componentDescriptor);

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
