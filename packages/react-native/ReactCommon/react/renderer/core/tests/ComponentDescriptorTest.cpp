/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/core/PropsParserContext.h>

#include "TestComponent.h"

using namespace facebook::react;

TEST(ComponentDescriptorTest, createShadowNode) {
  auto eventDispatcher = std::shared_ptr<const EventDispatcher>();
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  EXPECT_EQ(descriptor->getComponentHandle(), TestShadowNode::Handle());
  EXPECT_STREQ(descriptor->getComponentName(), TestShadowNode::Name());
  EXPECT_STREQ(descriptor->getComponentName(), "Test");

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto rawProps = RawProps(folly::dynamic::object("nativeID", "abc"));
  Props::Shared props =
      descriptor->cloneProps(parserContext, nullptr, std::move(rawProps));

  auto family = descriptor->createFamily(ShadowNodeFamilyFragment{
      /* .tag = */ 9,
      /* .surfaceId = */ 1,
      /* .instanceHandle = */ nullptr,
  });

  std::shared_ptr<const ShadowNode> node = descriptor->createShadowNode(
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
  auto eventDispatcher = std::shared_ptr<const EventDispatcher>();
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto rawProps = RawProps(folly::dynamic::object("nativeID", "abc"));
  Props::Shared props =
      descriptor->cloneProps(parserContext, nullptr, std::move(rawProps));
  auto family = descriptor->createFamily(ShadowNodeFamilyFragment{
      /* .tag = */ 9,
      /* .surfaceId = */ 1,
      /* .instanceHandle = */ nullptr,
  });
  std::shared_ptr<const ShadowNode> node = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family);
  std::shared_ptr<const ShadowNode> cloned =
      descriptor->cloneShadowNode(*node, {});

  EXPECT_STREQ(cloned->getComponentName(), "Test");
  EXPECT_EQ(cloned->getTag(), 9);
  EXPECT_EQ(cloned->getSurfaceId(), 1);
  EXPECT_STREQ(cloned->getProps()->nativeId.c_str(), "abc");

  auto clonedButSameProps =
      descriptor->cloneProps(parserContext, props, RawProps());
  EXPECT_NE(clonedButSameProps, props);
}

TEST(ComponentDescriptorTest, appendChild) {
  auto eventDispatcher = std::shared_ptr<const EventDispatcher>();
  SharedComponentDescriptor descriptor =
      std::make_shared<TestComponentDescriptor>(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto rawProps = RawProps(folly::dynamic::object("nativeID", "abc"));
  Props::Shared props =
      descriptor->cloneProps(parserContext, nullptr, std::move(rawProps));
  auto family1 = descriptor->createFamily(ShadowNodeFamilyFragment{
      /* .tag = */ 1,
      /* .surfaceId = */ 1,
      /* .instanceHandle = */ nullptr,
  });
  std::shared_ptr<const ShadowNode> node1 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family1);
  auto family2 = descriptor->createFamily(ShadowNodeFamilyFragment{
      /* .tag = */ 2,
      /* .surfaceId = */ 1,
      /* .instanceHandle = */ nullptr,
  });
  std::shared_ptr<const ShadowNode> node2 = descriptor->createShadowNode(
      ShadowNodeFragment{
          /* .props = */ props,
      },
      family2);
  auto family3 = descriptor->createFamily(ShadowNodeFamilyFragment{
      /* .tag = */ 3,
      /* .surfaceId = */ 1,
      /* .instanceHandle = */ nullptr,
  });
  std::shared_ptr<const ShadowNode> node3 = descriptor->createShadowNode(
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
