/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include "TestComponent.h"

using namespace facebook::react;

TEST(ComponentDescriptorTest, createShadowNode) {
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(nullptr);

  ASSERT_EQ(descriptor->getComponentHandle(), TestShadowNode::Handle());
  ASSERT_STREQ(
      descriptor->getComponentName().c_str(), TestShadowNode::Name().c_str());
  ASSERT_STREQ(descriptor->getComponentName().c_str(), "Test");

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedProps props = descriptor->cloneProps(nullptr, raw);
  SharedShadowNode node = descriptor->createShadowNode(
      ShadowNodeFragment{.tag = 9,
                         .rootTag = 1,
                         .props = props,
                         .eventEmitter = descriptor->createEventEmitter(0, 9)});

  ASSERT_EQ(node->getComponentHandle(), TestShadowNode::Handle());
  ASSERT_STREQ(
      node->getComponentName().c_str(), TestShadowNode::Name().c_str());
  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_STREQ(node->getProps()->nativeId.c_str(), "abc");
}

TEST(ComponentDescriptorTest, cloneShadowNode) {
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(nullptr);

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedProps props = descriptor->cloneProps(nullptr, raw);
  SharedShadowNode node = descriptor->createShadowNode(
      ShadowNodeFragment{.tag = 9,
                         .rootTag = 1,
                         .props = props,
                         .eventEmitter = descriptor->createEventEmitter(0, 9)});
  SharedShadowNode cloned = descriptor->cloneShadowNode(*node, {});

  ASSERT_STREQ(cloned->getComponentName().c_str(), "Test");
  ASSERT_EQ(cloned->getTag(), 9);
  ASSERT_EQ(cloned->getRootTag(), 1);
  ASSERT_STREQ(cloned->getProps()->nativeId.c_str(), "abc");
}

TEST(ComponentDescriptorTest, appendChild) {
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(nullptr);

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedProps props = descriptor->cloneProps(nullptr, raw);
  SharedShadowNode node1 = descriptor->createShadowNode(
      ShadowNodeFragment{.tag = 1,
                         .rootTag = 1,
                         .props = props,
                         .eventEmitter = descriptor->createEventEmitter(0, 1)});
  SharedShadowNode node2 = descriptor->createShadowNode(
      ShadowNodeFragment{.tag = 2,
                         .rootTag = 1,
                         .props = props,
                         .eventEmitter = descriptor->createEventEmitter(0, 2)});
  SharedShadowNode node3 = descriptor->createShadowNode(
      ShadowNodeFragment{.tag = 3,
                         .rootTag = 1,
                         .props = props,
                         .eventEmitter = descriptor->createEventEmitter(0, 3)});

  descriptor->appendChild(node1, node2);
  descriptor->appendChild(node1, node3);

  auto node1Children = node1->getChildren();
  ASSERT_EQ(node1Children.size(), 2);
  ASSERT_EQ(node1Children.at(0), node2);
  ASSERT_EQ(node1Children.at(1), node3);
}
