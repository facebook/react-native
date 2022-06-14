/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

using namespace facebook::react;

TEST(MapBufferTest, testSimpleIntMap) {
  auto builder = MapBufferBuilder();

  builder.putInt(0, 1234);
  builder.putInt(1, 4321);

  auto map = builder.build();

  EXPECT_EQ(map.count(), 2);
  EXPECT_EQ(map.getInt(0), 1234);
  EXPECT_EQ(map.getInt(1), 4321);
}

TEST(MapBufferTest, testMapBufferExtension) {
  // 26 = 2 buckets: 2*10 + 6 sizeof(header)
  int initialSize = 26;
  auto buffer = MapBufferBuilder(initialSize);

  buffer.putInt(0, 1234);
  buffer.putInt(1, 4321);
  buffer.putInt(2, 2121);
  buffer.putInt(3, 1212);

  auto map = buffer.build();

  EXPECT_EQ(map.count(), 4);

  EXPECT_EQ(map.getInt(0), 1234);
  EXPECT_EQ(map.getInt(1), 4321);
  EXPECT_EQ(map.getInt(2), 2121);
  EXPECT_EQ(map.getInt(3), 1212);
}

TEST(MapBufferTest, testBoolEntries) {
  auto buffer = MapBufferBuilder();

  buffer.putBool(0, true);
  buffer.putBool(1, false);

  auto map = buffer.build();

  EXPECT_EQ(map.count(), 2);
  EXPECT_EQ(map.getBool(0), true);
  EXPECT_EQ(map.getBool(1), false);
}

TEST(MapBufferTest, testDoubleEntries) {
  auto buffer = MapBufferBuilder();

  buffer.putDouble(0, 123.4);
  buffer.putDouble(1, 432.1);

  auto map = buffer.build();

  EXPECT_EQ(map.count(), 2);

  EXPECT_EQ(map.getDouble(0), 123.4);
  EXPECT_EQ(map.getDouble(1), 432.1);
}

TEST(MapBufferTest, testStringEntries) {
  auto builder = MapBufferBuilder();

  builder.putString(0, "This is a test");
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "This is a test");
}

TEST(MapBufferTest, testUTFStringEntry) {
  auto builder = MapBufferBuilder();

  builder.putString(0, "Let's count: 的, 一, 是");
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "Let's count: 的, 一, 是");
}

TEST(MapBufferTest, testEmojiStringEntry) {
  auto builder = MapBufferBuilder();

  builder.putString(
      0, "Let's count: 1️⃣, 2️⃣, 3️⃣, 🤦🏿‍♀️");
  auto map = builder.build();

  EXPECT_EQ(
      map.getString(0),
      "Let's count: 1️⃣, 2️⃣, 3️⃣, 🤦🏿‍♀️");
}

TEST(MapBufferTest, testUTFStringEntries) {
  auto builder = MapBufferBuilder();

  builder.putString(0, "Let's count: 的, 一, 是");
  builder.putString(1, "This is a test");
  auto map = builder.build();

  EXPECT_EQ(map.getString(0), "Let's count: 的, 一, 是");
  EXPECT_EQ(map.getString(1), "This is a test");
}

TEST(MapBufferTest, testEmptyMap) {
  auto builder = MapBufferBuilder();
  auto map = builder.build();
  EXPECT_EQ(map.count(), 0);
}

TEST(MapBufferTest, testEmptyMapConstant) {
  auto map = MapBufferBuilder::EMPTY();
  EXPECT_EQ(map.count(), 0);
}

TEST(MapBufferTest, testMapEntries) {
  auto builder = MapBufferBuilder();
  builder.putString(0, "This is a test");
  builder.putInt(1, 1234);
  auto map = builder.build();

  EXPECT_EQ(map.count(), 2);
  EXPECT_EQ(map.getString(0), "This is a test");
  EXPECT_EQ(map.getInt(1), 1234);

  auto builder2 = MapBufferBuilder();
  builder2.putInt(0, 4321);
  builder2.putMapBuffer(1, map);
  auto map2 = builder2.build();

  EXPECT_EQ(map2.count(), 2);
  EXPECT_EQ(map2.getInt(0), 4321);

  MapBuffer readMap2 = map2.getMapBuffer(1);

  EXPECT_EQ(readMap2.count(), 2);
  EXPECT_EQ(readMap2.getString(0), "This is a test");
  EXPECT_EQ(readMap2.getInt(1), 1234);
}

TEST(MapBufferTest, testMapRandomAccess) {
  auto builder = MapBufferBuilder();
  builder.putInt(1234, 4321);
  builder.putString(0, "This is a test");
  builder.putDouble(8, 908.1);
  builder.putString(65535, "Let's count: 的, 一, 是");
  auto map = builder.build();

  EXPECT_EQ(map.count(), 4);
  EXPECT_EQ(map.getString(0), "This is a test");
  EXPECT_EQ(map.getDouble(8), 908.1);
  EXPECT_EQ(map.getInt(1234), 4321);
  EXPECT_EQ(map.getString(65535), "Let's count: 的, 一, 是");
}
