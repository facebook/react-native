/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <gtest/gtest.h>

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
  auto node = std::make_shared<TestShadowNode>(9, 1, std::make_shared<const TestProps>(), nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);

  ASSERT_FALSE(node->getSealed());
  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_EQ(node->getEventHandlers(), nullptr);
  TestShadowNode *nodePtr = node.get();
  ASSERT_EQ(node->getComponentHandle(), typeid(*nodePtr).hash_code());
  ASSERT_EQ(node->getSourceNode(), nullptr);
  ASSERT_EQ(node->getChildren()->size(), 0);

  ASSERT_STREQ(node->getProps()->nativeId.c_str(), "testNativeID");

  node->sealRecursive();
  ASSERT_TRUE(node->getSealed());
  ASSERT_TRUE(node->getProps()->getSealed());
}

TEST(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto node = std::make_shared<TestShadowNode>(9, 1, std::make_shared<const TestProps>(), nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);
  auto node2 = std::make_shared<TestShadowNode>(node, nullptr, nullptr, nullptr);

  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_EQ(node->getEventHandlers(), nullptr);
  ASSERT_EQ(node2->getSourceNode(), node);
}

TEST(ShadowNodeTest, handleShadowNodeMutation) {
  auto props = std::make_shared<const TestProps>();
  auto node1 = std::make_shared<TestShadowNode>(1, 1, props, nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);
  auto node2 = std::make_shared<TestShadowNode>(2, 1, props, nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);
  auto node3 = std::make_shared<TestShadowNode>(3, 1, props, nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);

  node1->appendChild(node2);
  node1->appendChild(node3);
  SharedShadowNodeSharedList node1Children = node1->getChildren();
  ASSERT_EQ(node1Children->size(), 2);
  ASSERT_EQ(node1Children->at(0), node2);
  ASSERT_EQ(node1Children->at(1), node3);

  auto node4 = std::make_shared<TestShadowNode>(node2, nullptr, nullptr, nullptr);
  node1->replaceChild(node2, node4);
  node1Children = node1->getChildren();
  ASSERT_EQ(node1Children->size(), 2);
  ASSERT_EQ(node1Children->at(0), node4);
  ASSERT_EQ(node1Children->at(1), node3);

  // Seal the entire tree.
  node1->sealRecursive();
  ASSERT_TRUE(node1->getSealed());
  ASSERT_TRUE(node3->getSealed());
  ASSERT_TRUE(node4->getSealed());

  // No more mutation after sealing.
  EXPECT_THROW(node4->clearSourceNode(), std::runtime_error);

  auto node5 = std::make_shared<TestShadowNode>(node4, nullptr, nullptr, nullptr);
  node5->clearSourceNode();
  ASSERT_EQ(node5->getSourceNode(), nullptr);
}

TEST(ShadowNodeTest, handleSourceNode) {
  auto nodeFirstGeneration = std::make_shared<TestShadowNode>(9, 1, std::make_shared<const TestProps>(), nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);
  auto nodeSecondGeneration = std::make_shared<TestShadowNode>(nodeFirstGeneration, nullptr, nullptr, nullptr);
  auto nodeThirdGeneration = std::make_shared<TestShadowNode>(nodeSecondGeneration, nullptr, nullptr, nullptr);
  auto nodeForthGeneration = std::make_shared<TestShadowNode>(nodeThirdGeneration, nullptr, nullptr, nullptr);

  // Ensure established shource nodes structure.
  ASSERT_EQ(nodeForthGeneration->getSourceNode(), nodeThirdGeneration);
  ASSERT_EQ(nodeThirdGeneration->getSourceNode(), nodeSecondGeneration);
  ASSERT_EQ(nodeSecondGeneration->getSourceNode(), nodeFirstGeneration);

  // Shallow source node for the forth generation node.
  nodeForthGeneration->shallowSourceNode();
  ASSERT_EQ(nodeForthGeneration->getSourceNode(), nodeSecondGeneration);

  // Shallow it one more time.
  nodeForthGeneration->shallowSourceNode();
  ASSERT_EQ(nodeForthGeneration->getSourceNode(), nodeFirstGeneration);

  // Ensure that 3th and 2nd were not affected.
  ASSERT_EQ(nodeThirdGeneration->getSourceNode(), nodeSecondGeneration);
  ASSERT_EQ(nodeSecondGeneration->getSourceNode(), nodeFirstGeneration);
}

TEST(ShadowNodeTest, handleCloneFunction) {
  auto firstNode = std::make_shared<TestShadowNode>(9, 1, std::make_shared<const TestProps>(), nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);

  // The shadow node is not clonable if `cloneFunction` is not provided,
  ASSERT_DEATH_IF_SUPPORTED(firstNode->clone(), "cloneFunction_");

  auto secondNode = std::make_shared<TestShadowNode>(
    9,
    1,
    std::make_shared<const TestProps>(),
    nullptr,
    ShadowNode::emptySharedShadowNodeSharedList(),
    [](const SharedShadowNode &shadowNode, const SharedProps &props, const SharedEventHandlers &eventHandlers, const SharedShadowNodeSharedList &children) {
      return std::make_shared<const TestShadowNode>(
        std::static_pointer_cast<const TestShadowNode>(shadowNode),
        props,
        nullptr,
        children
      );
    }
  );

  auto secondNodeClone = secondNode->clone();

  // Those two nodes are *not* same.
  ASSERT_NE(secondNode, secondNodeClone);

  // `secondNodeClone` is an instance of `TestShadowNode`.
  ASSERT_NE(std::dynamic_pointer_cast<const TestShadowNode>(secondNodeClone), nullptr);

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
  auto firstNode = std::make_shared<TestShadowNode>(9, 1, props, nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);
  auto secondNode = std::make_shared<TestShadowNode>(9, 1, props, nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);
  auto thirdNode = std::make_shared<TestShadowNode>(9, 1, props, nullptr, ShadowNode::emptySharedShadowNodeSharedList(), nullptr);

  firstNode->setLocalData(localData42);
  secondNode->setLocalData(localData42);
  thirdNode->setLocalData(localDataOver9000);

  // LocalData object are compared by pointer, not by value.
  ASSERT_EQ(*firstNode, *secondNode);
  ASSERT_NE(*firstNode, *thirdNode);
  secondNode->setLocalData(anotherLocalData42);
  ASSERT_NE(*firstNode, *secondNode);

  // LocalData cannot be changed for sealed shadow node.
  secondNode->sealRecursive();
  ASSERT_ANY_THROW(secondNode->setLocalData(localDataOver9000));
}
