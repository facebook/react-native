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

TEST(ProfileTreeNodeTest, OnlyAddsUniqueChildren) {
  auto fooCallFrame = RuntimeSamplingProfile::SampleCallStackFrame{
      .kind = RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
      .scriptId = 0,
      .functionName = "foo"};
  auto barCallFrame = RuntimeSamplingProfile::SampleCallStackFrame{
      .kind = RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
      .scriptId = 0,
      .functionName = "bar"};

  ProfileTreeNode parent(
      1, ProfileTreeNode::CodeType::JavaScript, fooCallFrame);
  ProfileTreeNode* child =
      parent.addChild(2, ProfileTreeNode::CodeType::JavaScript, barCallFrame);

  auto maybeAlreadyExistingChild = parent.getIfAlreadyExists(
      ProfileTreeNode::CodeType::JavaScript, barCallFrame);
  EXPECT_NE(maybeAlreadyExistingChild, nullptr);

  auto maybeExistingChildOfChild = child->getIfAlreadyExists(
      ProfileTreeNode::CodeType::JavaScript, barCallFrame);
  EXPECT_EQ(maybeExistingChildOfChild, nullptr);
}

TEST(ProfileTreeNodeTest, ConsidersCodeTypeOfChild) {
  auto parentCallFrame = RuntimeSamplingProfile::SampleCallStackFrame{
      .kind = RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
      .scriptId = 0,
      .functionName = "foo"};
  auto childCallFrame = RuntimeSamplingProfile::SampleCallStackFrame{
      .kind = RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
      .scriptId = 0,
      .functionName = "bar"};

  ProfileTreeNode parent(
      1, ProfileTreeNode::CodeType::JavaScript, parentCallFrame);
  parent.addChild(2, ProfileTreeNode::CodeType::JavaScript, childCallFrame);

  auto maybeExistingChild = parent.getIfAlreadyExists(
      ProfileTreeNode::CodeType::Other, childCallFrame);
  EXPECT_EQ(maybeExistingChild, nullptr);
}

} // namespace facebook::react::jsinspector_modern::tracing
