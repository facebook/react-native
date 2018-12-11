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
  RawProps raw;
  raw["nativeID"] = "abc";

  auto props = std::make_shared<Props>(Props(), raw);

  // Props are not sealed after applying raw props.
  ASSERT_FALSE(props->getSealed());

  ASSERT_STREQ(props->nativeId.c_str(), "abc");
}

TEST(ShadowNodeTest, handleShadowNodeCreation) {
  auto node = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 9,
          .rootTag = 1,
          .props = std::make_shared<const TestProps>(),
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

  ASSERT_FALSE(node->getSealed());
  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_EQ(node->getEventEmitter(), nullptr);
  ASSERT_EQ(node->getChildren().size(), 0);

  ASSERT_STREQ(node->getProps()->nativeId.c_str(), "testNativeID");

  node->sealRecursive();
  ASSERT_TRUE(node->getSealed());
  ASSERT_TRUE(node->getProps()->getSealed());
}

TEST(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto node = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 9,
          .rootTag = 1,
          .props = std::make_shared<const TestProps>(),
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);
  auto node2 = std::make_shared<TestShadowNode>(*node, ShadowNodeFragment{});

  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_EQ(node->getEventEmitter(), nullptr);
}

TEST(ShadowNodeTest, handleShadowNodeMutation) {
  auto props = std::make_shared<const TestProps>();
  auto node1 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 1,
          .rootTag = 1,
          .props = std::make_shared<const TestProps>(),
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);
  auto node2 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 2,
          .rootTag = 1,
          .props = std::make_shared<const TestProps>(),
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);
  auto node3 = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 3,
          .rootTag = 1,
          .props = std::make_shared<const TestProps>(),
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

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
  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 9,
          .rootTag = 1,
          .props = std::make_shared<const TestProps>(),
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

  // The shadow node is not clonable if `cloneFunction` is not provided,
  ASSERT_DEATH_IF_SUPPORTED(firstNode->clone({}), "cloneFunction_");

  auto secondNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 9,
          .rootTag = 1,
          .props = std::make_shared<const TestProps>(),
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      [](const ShadowNode &shadowNode, const ShadowNodeFragment &fragment) {
        return std::make_shared<TestShadowNode>(shadowNode, fragment);
      });

  auto secondNodeClone = secondNode->clone({});

  // Those two nodes are *not* same.
  ASSERT_NE(secondNode, secondNodeClone);

  // `secondNodeClone` is an instance of `TestShadowNode`.
  ASSERT_NE(
      std::dynamic_pointer_cast<const TestShadowNode>(secondNodeClone),
      nullptr);

  // Both nodes have same content.
  ASSERT_EQ(secondNode->getTag(), secondNodeClone->getTag());
  ASSERT_EQ(secondNode->getRootTag(), secondNodeClone->getRootTag());
  ASSERT_EQ(secondNode->getProps(), secondNodeClone->getProps());
}

TEST(ShadowNodeTest, handleLocalData) {
  auto localData42 = std::make_shared<TestLocalData>();
  localData42->setNumber(42);

  auto anotherLocalData42 = std::make_shared<TestLocalData>();
  anotherLocalData42->setNumber(42);

  auto localDataOver9000 = std::make_shared<TestLocalData>();
  localDataOver9000->setNumber(9001);
  auto props = std::make_shared<const TestProps>();
  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 9,
          .rootTag = 1,
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);
  auto secondNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 9,
          .rootTag = 1,
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);
  auto thirdNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .tag = 9,
          .rootTag = 1,
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

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

  auto props = std::make_shared<const TestProps>();

  auto nodeAA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

  auto nodeABA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);
  auto nodeABB = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);
  auto nodeABC = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

  auto nodeABChildren = std::make_shared<std::vector<SharedShadowNode>>(
      std::vector<SharedShadowNode>{nodeABA, nodeABB, nodeABC});
  auto nodeAB = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{.props = props, .children = nodeABChildren}, nullptr);

  auto nodeAC = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

  auto nodeAChildren = std::make_shared<std::vector<SharedShadowNode>>(
      std::vector<SharedShadowNode>{nodeAA, nodeAB, nodeAC});
  auto nodeA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{.props = props, .children = nodeAChildren}, nullptr);

  auto nodeZ = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          .props = props,
          .children = ShadowNode::emptySharedShadowNodeSharedList()},
      nullptr);

  std::vector<std::reference_wrapper<const ShadowNode>> ancestors = {};

  // Negative case:
  auto success = nodeZ->constructAncestorPath(*nodeA, ancestors);
  ASSERT_FALSE(success);
  ASSERT_EQ(ancestors.size(), 0);

  // Positive case:
  success = nodeABC->constructAncestorPath(*nodeA, ancestors);
  ASSERT_TRUE(success);
  ASSERT_EQ(ancestors.size(), 2);
  ASSERT_EQ(&ancestors[0].get(), nodeAB.get());
  ASSERT_EQ(&ancestors[1].get(), nodeA.get());
}
