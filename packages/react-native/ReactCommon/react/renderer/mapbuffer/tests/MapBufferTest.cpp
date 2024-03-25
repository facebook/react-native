/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <limits>
#include <memory>
#include <vector>

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

TEST(MapBufferTest, testSimpleLongMap) {
  auto builder = MapBufferBuilder();

  int64_t minInt64 = std::numeric_limits<int64_t>::min();
  int64_t maxInt64 = std::numeric_limits<int64_t>::max();

  builder.putLong(0, minInt64);
  builder.putLong(1, maxInt64);
  builder.putLong(2, 1125899906842623LL);
  builder.putLong(3, -1125899906842623LL);

  auto map = builder.build();

  EXPECT_EQ(map.count(), 4);
  EXPECT_EQ(map.getLong(0), minInt64);
  EXPECT_EQ(map.getLong(1), maxInt64);
  EXPECT_EQ(map.getLong(2), 1125899906842623LL);
  EXPECT_EQ(map.getLong(3), -1125899906842623LL);
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

TEST(MapBufferTest, testMapListEntries) {
  std::vector<MapBuffer> mapBufferList;
  auto builder = MapBufferBuilder();
  builder.putString(0, "This is a test");
  builder.putInt(1, 1234);
  mapBufferList.push_back(builder.build());

  auto builder2 = MapBufferBuilder();
  builder2.putInt(2, 4321);
  builder2.putDouble(3, 908.1);
  mapBufferList.push_back(builder2.build());

  auto builder3 = MapBufferBuilder();
  builder3.putMapBufferList(5, mapBufferList);
  auto map = builder3.build();

  std::vector<MapBuffer> mapBufferList2 = map.getMapBufferList(5);

  EXPECT_EQ(mapBufferList2.size(), 2);
  EXPECT_EQ(mapBufferList2[0].getString(0), "This is a test");
  EXPECT_EQ(mapBufferList2[0].getInt(1), 1234);
  EXPECT_EQ(mapBufferList2[1].getDouble(3), 908.1);
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
