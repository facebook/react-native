// Copyright 2004-present Facebook. All Rights Reserved.

#include <hermes/inspector/chrome/RemoteObjectsTable.h>

#include <gtest/gtest.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

namespace {

struct TestContext {
  TestContext() {
    scope1 = table.addScope(std::make_pair(1, 1), BacktraceObjectGroup);
    scope2 = table.addScope(std::make_pair(2, 1), ConsoleObjectGroup);
    scope3 = table.addScope(std::make_pair(3, 1), "");
    value1 = table.addValue(jsi::Value(1.5), BacktraceObjectGroup);
    value2 = table.addValue(jsi::Value(2.5), BacktraceObjectGroup);
    value3 = table.addValue(jsi::Value(3.5), "");
  }

  RemoteObjectsTable table;
  std::string scope1;
  std::string scope2;
  std::string scope3;
  std::string value1;
  std::string value2;
  std::string value3;
};

} // namespace

TEST(RemoteObjectsTableTest, TestGetScope) {
  TestContext ctx;

  EXPECT_EQ(ctx.table.getScope(ctx.scope1)->first, 1);
  EXPECT_EQ(ctx.table.getScope(ctx.scope2)->first, 2);
  EXPECT_EQ(ctx.table.getScope(ctx.scope3)->first, 3);
  EXPECT_TRUE(ctx.table.getScope(ctx.value1) == nullptr);
  EXPECT_TRUE(ctx.table.getScope(ctx.value2) == nullptr);
  EXPECT_TRUE(ctx.table.getScope(ctx.value3) == nullptr);
}

TEST(RemoteObjectsTableTest, TestGetValue) {
  TestContext ctx;

  EXPECT_TRUE(ctx.table.getValue(ctx.scope1) == nullptr);
  EXPECT_TRUE(ctx.table.getValue(ctx.scope2) == nullptr);
  EXPECT_TRUE(ctx.table.getValue(ctx.scope3) == nullptr);
  EXPECT_EQ(ctx.table.getValue(ctx.value1)->asNumber(), 1.5);
  EXPECT_EQ(ctx.table.getValue(ctx.value2)->asNumber(), 2.5);
  EXPECT_EQ(ctx.table.getValue(ctx.value3)->asNumber(), 3.5);
}

TEST(RemoteObjectsTableTest, TestGetObjectGroup) {
  TestContext ctx;

  EXPECT_EQ(ctx.table.getObjectGroup(ctx.scope1), BacktraceObjectGroup);
  EXPECT_EQ(ctx.table.getObjectGroup(ctx.scope2), ConsoleObjectGroup);
  EXPECT_EQ(ctx.table.getObjectGroup(ctx.scope3), "");
  EXPECT_EQ(ctx.table.getObjectGroup(ctx.value1), BacktraceObjectGroup);
  EXPECT_EQ(ctx.table.getObjectGroup(ctx.value2), BacktraceObjectGroup);
  EXPECT_EQ(ctx.table.getObjectGroup(ctx.value3), "");
}

TEST(RemoteObjectsTableTest, TestReleaseObject) {
  TestContext ctx;

  ctx.table.releaseObject(ctx.scope1);
  ctx.table.releaseObject(ctx.value3);
  std::string scope4 = ctx.table.addScope(std::make_pair(4, 1), "");
  std::string value4 = ctx.table.addValue(jsi::Value(4.5), "");

  EXPECT_EQ(ctx.table.getScope(ctx.scope1), nullptr);
  EXPECT_EQ(ctx.table.getScope(ctx.scope2)->first, 2);
  EXPECT_EQ(ctx.table.getScope(ctx.scope3)->first, 3);
  EXPECT_EQ(ctx.table.getScope(scope4)->first, 4);
  EXPECT_EQ(ctx.table.getValue(ctx.value1)->asNumber(), 1.5);
  EXPECT_EQ(ctx.table.getValue(ctx.value2)->asNumber(), 2.5);
  EXPECT_EQ(ctx.table.getValue(ctx.value3), nullptr);
  EXPECT_EQ(ctx.table.getValue(value4)->asNumber(), 4.5);
}

TEST(RemoteObjectsTableTest, TestReleaseObjectGroup) {
  TestContext ctx;

  ctx.table.releaseObjectGroup(BacktraceObjectGroup);
  std::string scope4 = ctx.table.addScope(std::make_pair(4, 1), "");
  std::string value4 = ctx.table.addValue(jsi::Value(4.5), "");

  EXPECT_EQ(ctx.table.getScope(ctx.scope1), nullptr);
  EXPECT_EQ(ctx.table.getScope(ctx.scope2)->first, 2);
  EXPECT_EQ(ctx.table.getScope(ctx.scope3)->first, 3);
  EXPECT_EQ(ctx.table.getScope(scope4)->first, 4);
  EXPECT_EQ(ctx.table.getValue(ctx.value1), nullptr);
  EXPECT_EQ(ctx.table.getValue(ctx.value2), nullptr);
  EXPECT_EQ(ctx.table.getValue(ctx.value3)->asNumber(), 3.5);
  EXPECT_EQ(ctx.table.getValue(value4)->asNumber(), 4.5);
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
