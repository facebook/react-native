/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <folly/dynamic.h>
#include <glog/logging.h>
#include <gtest/gtest.h>

using namespace folly;

/*
  Tests that verify expected behaviour from `folly::dynamic::merge_patch`.
  `merge_patch` is used for props forwarding on Android to enable Background
  Executor and will be removed once JNI layer is reimplmeneted.
 */
TEST(FollyDynamicMergePatchTest, handleNestedObjects) {
  dynamic map1 = dynamic::object;
  map1["style"] = dynamic::object("backgroundColor", "red");

  dynamic map2 = dynamic::object;
  map2["style"] = dynamic::object("backgroundColor", "blue")("color", "black");
  map2["height"] = 100;

  map2.merge_patch(map1);

  EXPECT_TRUE(map2["style"].isObject());
  EXPECT_TRUE(map2["style"]["backgroundColor"].isString());
  EXPECT_TRUE(map2["style"]["color"].isString());
  EXPECT_TRUE(map2["height"].isInt());

  EXPECT_EQ(map2["style"]["backgroundColor"], "red");
  EXPECT_EQ(map2["style"]["color"], "black");
  EXPECT_EQ(map2["height"], 100);
}

TEST(FollyDynamicMergePatchTest, handleEmptyObject) {
  dynamic map1 = dynamic::object;

  dynamic map2 = dynamic::object;
  map2["height"] = 100;

  map2.merge_patch(map1);

  EXPECT_TRUE(map2["height"].isInt());
  EXPECT_EQ(map2["height"], 100);

  map1.merge_patch(map2);

  EXPECT_TRUE(map1["height"].isInt());
  EXPECT_EQ(map1["height"], 100);
}
