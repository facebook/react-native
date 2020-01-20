/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include "TestComponent.h"

using namespace facebook::react;

TEST(ComponentDescriptorTest, createShadowNode) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  EXPECT_EQ(descriptor->getComponentHandle(), TestShadowNode::Handle());
  EXPECT_STREQ(descriptor->getComponentName(), TestShadowNode::Name());
  EXPECT_STREQ(descriptor->getComponentName(), "Test");

  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  SharedProps props = descriptor->cloneProps(nullptr, raw);

  SharedShadowNode node = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      ShadowNodeFamilyFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ descriptor->createEventEmitter(0, 9),
      });

  EXPECT_EQ(node->getComponentHandle(), TestShadowNode::Handle());
  EXPECT_STREQ(node->getComponentName(), TestShadowNode::Name());
  EXPECT_STREQ(node->getComponentName(), "Test");
  EXPECT_EQ(node->getTag(), 9);
  EXPECT_EQ(node->getSurfaceId(), 1);
  EXPECT_STREQ(node->getProps()->nativeId.c_str(), "abc");
}

TEST(ComponentDescriptorTest, cloneShadowNode) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  SharedProps props = descriptor->cloneProps(nullptr, raw);
  SharedShadowNode node = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      ShadowNodeFamilyFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ descriptor->createEventEmitter(0, 9),
      });
  SharedShadowNode cloned = descriptor->cloneShadowNode(*node, {});

  EXPECT_STREQ(cloned->getComponentName(), "Test");
  EXPECT_EQ(cloned->getTag(), 9);
  EXPECT_EQ(cloned->getSurfaceId(), 1);
  EXPECT_STREQ(cloned->getProps()->nativeId.c_str(), "abc");
}

TEST(ComponentDescriptorTest, appendChild) {
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  SharedProps props = descriptor->cloneProps(nullptr, raw);

  SharedShadowNode node1 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      ShadowNodeFamilyFragment{
          /* .tag = */ 1,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ descriptor->createEventEmitter(0, 9),
      });
  SharedShadowNode node2 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      ShadowNodeFamilyFragment{
          /* .tag = */ 2,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ descriptor->createEventEmitter(0, 9),
      });
  SharedShadowNode node3 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      ShadowNodeFamilyFragment{
          /* .tag = */ 3,
          /* .surfaceId = */ 1,
          /* .eventEmitter = */ descriptor->createEventEmitter(0, 9),
      });

  descriptor->appendChild(node1, node2);
  descriptor->appendChild(node1, node3);

  auto node1Children = node1->getChildren();
  EXPECT_EQ(node1Children.size(), 2);
  EXPECT_EQ(node1Children.at(0), node2);
  EXPECT_EQ(node1Children.at(1), node3);
}
