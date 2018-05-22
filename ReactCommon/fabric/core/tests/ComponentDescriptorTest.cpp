/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include "TestComponent.h"

using namespace facebook::react;

TEST(ComponentDescriptorTest, createShadowNode) {
  SharedComponentDescriptor descriptor = std::make_shared<TestComponentDescriptor>(nullptr);

  ASSERT_EQ(descriptor->getComponentHandle(), typeid(TestShadowNode).hash_code());
  ASSERT_STREQ(descriptor->getComponentName().c_str(), "Test");

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedProps props = descriptor->cloneProps(nullptr, raw);
  SharedShadowNode node = descriptor->createShadowNode(9, 1, nullptr, props);

  ASSERT_EQ(node->getComponentHandle(), typeid(TestShadowNode).hash_code());
  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_STREQ(node->getProps()->nativeId.c_str(), "abc");
}

TEST(ComponentDescriptorTest, cloneShadowNode) {
  SharedComponentDescriptor descriptor = std::make_shared<TestComponentDescriptor>(nullptr);

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedProps props = descriptor->cloneProps(nullptr, raw);
  SharedShadowNode node = descriptor->createShadowNode(9, 1, nullptr, props);
  SharedShadowNode cloned = descriptor->cloneShadowNode(node);

  ASSERT_EQ(cloned->getComponentHandle(), typeid(TestShadowNode).hash_code());
  ASSERT_STREQ(cloned->getComponentName().c_str(), "Test");
  ASSERT_EQ(cloned->getTag(), 9);
  ASSERT_EQ(cloned->getRootTag(), 1);
  ASSERT_STREQ(cloned->getProps()->nativeId.c_str(), "abc");
}

TEST(ComponentDescriptorTest, appendChild) {
  SharedComponentDescriptor descriptor = std::make_shared<TestComponentDescriptor>(nullptr);

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedProps props = descriptor->cloneProps(nullptr, raw);
  SharedShadowNode node1 = descriptor->createShadowNode(1, 1, nullptr, props);
  SharedShadowNode node2 = descriptor->createShadowNode(2, 1, nullptr, props);
  SharedShadowNode node3 = descriptor->createShadowNode(3, 1, nullptr, props);

  descriptor->appendChild(node1, node2);
  descriptor->appendChild(node1, node3);

  SharedShadowNodeSharedList node1Children = node1->getChildren();
  ASSERT_EQ(node1Children->size(), 2);
  ASSERT_EQ(node1Children->at(0), node2);
  ASSERT_EQ(node1Children->at(1), node3);
}
