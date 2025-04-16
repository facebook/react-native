/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ProfileTreeNode.h"

#include <gmock/gmock.h>
#include <gtest/gtest.h>

namespace facebook::react::jsinspector_modern::tracing {

TEST(ProfileTreeNodeTest, EqualityOperator) {
  auto callFrame = RuntimeSamplingProfile::SampleCallStackFrame{
      RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction, 0, "foo"};
  ProfileTreeNode* node1;
  ProfileTreeNode* node2;

  node1 = new ProfileTreeNode(
      1, ProfileTreeNode::CodeType::JavaScript, nullptr, callFrame);
  node2 = new ProfileTreeNode(
      2, ProfileTreeNode::CodeType::JavaScript, nullptr, callFrame);
  EXPECT_EQ(*node1 == node2, true);

  node1 = new ProfileTreeNode(
      3,
      ProfileTreeNode::CodeType::JavaScript,
      std::shared_ptr<ProfileTreeNode>(node1),
      callFrame);
  node2 = new ProfileTreeNode(
      4, ProfileTreeNode::CodeType::JavaScript, nullptr, callFrame);
  EXPECT_EQ(*node1 == node2, false);

  node1 = new ProfileTreeNode(
      5,
      ProfileTreeNode::CodeType::JavaScript,
      std::shared_ptr<ProfileTreeNode>(node2),
      callFrame);
  node2 = new ProfileTreeNode(
      6,
      ProfileTreeNode::CodeType::JavaScript,
      std::shared_ptr<ProfileTreeNode>(node2),
      callFrame);
  EXPECT_EQ(*node1 == node2, true);
}

TEST(ProfileTreeNodeTest, OnlyAddsUniqueChildren) {
  auto callFrame = RuntimeSamplingProfile::SampleCallStackFrame{
      RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction, 0, "foo"};
  auto parent = std::make_shared<ProfileTreeNode>(
      1, ProfileTreeNode::CodeType::JavaScript, nullptr, callFrame);
  auto existingChild = std::make_shared<ProfileTreeNode>(
      2, ProfileTreeNode::CodeType::JavaScript, parent, callFrame);

  auto maybeAlreadyExistingChild = parent->addChild(existingChild);
  EXPECT_EQ(maybeAlreadyExistingChild, nullptr);

  auto copyOfExistingChild = std::make_shared<ProfileTreeNode>(
      3, ProfileTreeNode::CodeType::JavaScript, parent, callFrame);

  maybeAlreadyExistingChild = parent->addChild(copyOfExistingChild);
  EXPECT_EQ(maybeAlreadyExistingChild, existingChild);
}

} // namespace facebook::react::jsinspector_modern::tracing
