/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <react/renderer/mapbuffer/MapBuffer.h>

using namespace facebook::react;

TEST(MapBufferTest, testMapGrowth) {
  auto buffer = MapBuffer();

  buffer.putInt(0, 1234);
  buffer.putInt(1, 4321);

  buffer.finish();

  EXPECT_EQ(buffer.getSize(), 2);
  EXPECT_EQ(buffer.getInt(0), 1234);
  EXPECT_EQ(buffer.getInt(1), 4321);
}

TEST(MapBufferTest, testMapBufferExtension) {
  // 26 = 2 buckets: 2*10 + 6 sizeof(header)
  int initialSize = 26;
  auto buffer = MapBuffer(initialSize);

  buffer.putInt(0, 1234);
  buffer.putInt(1, 4321);
  buffer.putInt(2, 2121);
  buffer.putInt(3, 1212);

  buffer.finish();

  EXPECT_EQ(buffer.getSize(), 4);

  EXPECT_EQ(buffer.getInt(0), 1234);
  EXPECT_EQ(buffer.getInt(1), 4321);
  EXPECT_EQ(buffer.getInt(2), 2121);
  EXPECT_EQ(buffer.getInt(3), 1212);
}

TEST(MapBufferTest, testBoolEntries) {
  auto buffer = MapBuffer();

  buffer.putBool(0, true);
  buffer.putBool(1, false);

  buffer.finish();

  EXPECT_EQ(buffer.getSize(), 2);
  EXPECT_EQ(buffer.getBool(0), true);
  EXPECT_EQ(buffer.getBool(1), false);
}

TEST(MapBufferTest, testNullEntries) {
  auto buffer = MapBuffer();

  buffer.putNull(0);
  buffer.putInt(1, 1234);

  buffer.finish();

  EXPECT_EQ(buffer.getSize(), 2);
  EXPECT_EQ(buffer.isNull(0), true);
  EXPECT_EQ(buffer.isNull(1), false);
  // TODO: serialize null values to be distinguishable from '0' values
  // EXPECT_EQ(buffer.isNull(1),  false);
  // EXPECT_EQ(buffer.getBool(1),  false);
}

TEST(MapBufferTest, testDoubleEntries) {
  auto buffer = MapBuffer();

  buffer.putDouble(0, 123.4);
  buffer.putDouble(1, 432.1);

  buffer.finish();

  EXPECT_EQ(buffer.getSize(), 2);

  EXPECT_EQ(buffer.getDouble(0), 123.4);
  EXPECT_EQ(buffer.getDouble(1), 432.1);
}
