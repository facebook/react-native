// Copyright 2004-present Facebook. All Rights Reserved.

#include <gtest/gtest.h>
#include <folly/json.h>
#include <react/Value.h>

using namespace facebook;
using namespace facebook::react;

TEST(Value, Undefined) {
  JSContextRef ctx = JSGlobalContextCreateInGroup(nullptr, nullptr);
  Value v(ctx, JSValueMakeUndefined(ctx));
  auto s = String::adopt(JSValueToStringCopy(ctx, v, nullptr));
  EXPECT_EQ("undefined", s.str());
}

TEST(Value, FromJSON) {
  JSContextRef ctx = JSGlobalContextCreateInGroup(nullptr, nullptr);
  String s("{\"a\": 4}");
  Value v(Value::fromJSON(ctx, s));
  EXPECT_TRUE(JSValueIsObject(ctx, v));
}

TEST(Value, ToJSONString) {
  JSContextRef ctx = JSGlobalContextCreateInGroup(nullptr, nullptr);
  String s("{\"a\": 4}");
  Value v(Value::fromJSON(ctx, s));
  folly::dynamic dyn = folly::parseJson(v.toJSONString());
  ASSERT_NE(nullptr, json);
  EXPECT_TRUE(json.isObject());
  auto val = json.at("a");
  ASSERT_NE(nullptr, val);
  ASSERT_TRUE(val.isInt());
  EXPECT_EQ(4, val->getInt());
  EXPECT_EQ(4.0f, val->asDouble());

}

