/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/core/DynamicPropsUtilities.h>

using namespace folly;
using namespace facebook::react;

/*
  Tests that verify expected behaviour from `folly::dynamic::merge_patch`.
  `merge_patch` is used for props forwarding on Android to enable Background
  Executor and will be removed once JNI layer is reimplmeneted.
 */
TEST(DynamicPropsUtilitiesTest, mergeDynamicPropsHandlesNestedObjects) {
  dynamic map1 = dynamic::object;
  map1["style"] = dynamic::object("backgroundColor", "red");

  dynamic map2 = dynamic::object;
  map2["style"] = dynamic::object("backgroundColor", "blue")("color", "black");
  map2["height"] = 100;

  auto result = mergeDynamicProps(map1, map2, NullValueStrategy::Override);

  EXPECT_TRUE(result["style"].isObject());
  EXPECT_TRUE(result["style"]["backgroundColor"].isString());
  EXPECT_TRUE(result["style"]["color"].isString());
  EXPECT_TRUE(result["height"].isInt());

  EXPECT_EQ(result["style"]["backgroundColor"].asString(), "blue");
  EXPECT_EQ(result["style"]["color"], "black");
  EXPECT_EQ(result["height"], 100);
}

TEST(DynamicPropsUtilitiesTest, mergeDynamicPropsHandlesEmptyObject) {
  dynamic map1 = dynamic::object;

  dynamic map2 = dynamic::object;
  map2["height"] = 100;

  auto result = mergeDynamicProps(map1, map2, NullValueStrategy::Override);

  EXPECT_TRUE(result["height"].isInt());
  EXPECT_EQ(result["height"], 100);

  result = mergeDynamicProps(map1, map2, NullValueStrategy::Override);

  EXPECT_TRUE(result["height"].isInt());
  EXPECT_EQ(result["height"], 100);
}

TEST(DynamicPropsUtilitiesTest, mergeDynamicPropsHandleNullValue) {
  dynamic map1 = dynamic::object;
  map1["height"] = 100;

  dynamic map2 = dynamic::object;
  map2["height"] = nullptr;

  auto result = mergeDynamicProps(map1, map2, NullValueStrategy::Override);

  EXPECT_TRUE(result["height"].isNull());
}

TEST(
    DynamicPropsUtilitiesTest,
    mergeDynamicPropsFollowsNullValueStrategyIgnore) {
  dynamic map1 = dynamic::object;
  map1["height"] = 100;

  dynamic map2 = dynamic::object;
  map2["width"] = 200;
  map2["height"] = 101;

  auto result = mergeDynamicProps(map1, map2, NullValueStrategy::Ignore);

  EXPECT_EQ(result["height"], 101);
  EXPECT_TRUE(result["width"].isNull());
}

TEST(DynamicPropsUtilitiesTest, diffDynamicPropsReturnsCorrectDiff) {
  dynamic lhs = dynamic::object;
  lhs["a"] = 1;
  lhs["b"] = "2";

  dynamic rhs = dynamic::object;
  rhs["a"] = 3;
  rhs["c"] = true;

  auto result = diffDynamicProps(lhs, rhs);

  EXPECT_TRUE(result.isObject());
  EXPECT_EQ(result.size(), 3);
  EXPECT_EQ(result["a"], 3);
  EXPECT_EQ(result["b"], nullptr);
  EXPECT_EQ(result["c"], true);
}

TEST(DynamicPropsUtilitiesTest, diffDynamicPropsHandlesInsertions) {
  dynamic lhs = dynamic::object;
  lhs["a"] = 1;

  dynamic rhs = dynamic::object;
  rhs["a"] = 1;
  rhs["b"] = 2;

  auto result = diffDynamicProps(lhs, rhs);

  EXPECT_TRUE(result.isObject());
  EXPECT_EQ(result.size(), 1);
  EXPECT_EQ(result["b"], 2);
}

TEST(DynamicPropsUtilitiesTest, diffDynamicPropsHandlesUpdates) {
  dynamic lhs = dynamic::object;
  lhs["a"] = 1;
  lhs["b"] = 2;

  dynamic rhs = dynamic::object;
  rhs["a"] = 3;
  rhs["b"] = 4;

  auto result = diffDynamicProps(lhs, rhs);

  EXPECT_TRUE(result.isObject());
  EXPECT_EQ(result.size(), 2);
  EXPECT_EQ(result["a"], 3);
  EXPECT_EQ(result["b"], 4);
}

TEST(DynamicPropsUtilitiesTest, diffDynamicPropsHandlesDeletions) {
  dynamic lhs = dynamic::object;
  lhs["a"] = 1;
  lhs["b"] = 2;

  dynamic rhs = dynamic::object;
  rhs["a"] = 1;

  auto result = diffDynamicProps(lhs, rhs);

  EXPECT_TRUE(result.isObject());
  EXPECT_EQ(result.size(), 1);
  EXPECT_EQ(result["b"], nullptr);
}

TEST(
    DynamicPropsUtilitiesTest,
    diffDynamicPropsReturnsEmptyObjectForNonObjectLHS) {
  dynamic lhs = dynamic::array;
  dynamic rhs = dynamic::object;

  auto result = diffDynamicProps(lhs, rhs);

  EXPECT_TRUE(result.isObject());
  EXPECT_EQ(result.size(), 0);
}

TEST(
    DynamicPropsUtilitiesTest,
    diffDynamicPropsReturnsEmptyObjectForNonObjectRHS) {
  dynamic lhs = dynamic::object;
  dynamic rhs = dynamic::array;

  auto result = diffDynamicProps(lhs, rhs);

  EXPECT_TRUE(result.isObject());
  EXPECT_EQ(result.size(), 0);
}
