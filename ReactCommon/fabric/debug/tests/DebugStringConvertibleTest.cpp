/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/debug/DebugStringConvertibleItem.h>

using namespace facebook::react;

TEST(DebugStringConvertibleTest, handleSimpleNode) {
  SharedDebugStringConvertibleList empty;
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", empty, empty);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(item->getDebugDescription().c_str(), "<View=hello/>\n");
}

TEST(DebugStringConvertibleTest, handleSimpleNodeWithProps) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList props = {
      std::make_shared<DebugStringConvertibleItem>("x", "1", empty, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", props, empty);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(item->getDebugDescription().c_str(), "<View=hello x=1/>\n");
}

TEST(DebugStringConvertibleTest, handleSimpleNodeWithChildren) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList children = {
      std::make_shared<DebugStringConvertibleItem>("Child", "a", empty, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", empty, children);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(
      item->getDebugDescription().c_str(),
      "<View=hello>\n  <Child=a/>\n</View>\n");
}

TEST(DebugStringConvertibleTest, handleNestedNode) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList props = {
      std::make_shared<DebugStringConvertibleItem>("x", "1", empty, empty)};
  SharedDebugStringConvertibleList children = {
      std::make_shared<DebugStringConvertibleItem>("Child", "a", props, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", props, children);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(
      item->getDebugDescription().c_str(),
      "<View=hello x=1>\n  <Child=a x=1/>\n</View>\n");
}

TEST(DebugStringConvertibleTest, handleNodeWithComplexProps) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList subProps = {
      std::make_shared<DebugStringConvertibleItem>(
          "height", "100", empty, empty),
      std::make_shared<DebugStringConvertibleItem>(
          "width", "200", empty, empty)};
  SharedDebugStringConvertibleList props = {
      std::make_shared<DebugStringConvertibleItem>("x", "1", subProps, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", props, empty);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(
      item->getDebugDescription().c_str(),
      "<View=hello x=1(height=100 width=200)/>\n");
}
