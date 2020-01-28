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
  auto family = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{9, 1, descriptor->createEventEmitter(0, 9)},
      *descriptor);

  SharedShadowNode node = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family);

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
  auto family = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{9, 1, descriptor->createEventEmitter(0, 9)},
      *descriptor);
  SharedShadowNode node = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family);
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
  auto family1 = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{1, 1, descriptor->createEventEmitter(0, 9)},
      *descriptor);
  SharedShadowNode node1 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family1);
  auto family2 = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{2, 1, descriptor->createEventEmitter(0, 2)},
      *descriptor);
  SharedShadowNode node2 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family2);
  auto family3 = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{3, 1, descriptor->createEventEmitter(0, 3)},
      *descriptor);
  SharedShadowNode node3 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family3);

  descriptor->appendChild(node1, node2);
  descriptor->appendChild(node1, node3);

  auto node1Children = node1->getChildren();
  EXPECT_EQ(node1Children.size(), 2);
  EXPECT_EQ(node1Children.at(0), node2);
  EXPECT_EQ(node1Children.at(1), node3);
}
