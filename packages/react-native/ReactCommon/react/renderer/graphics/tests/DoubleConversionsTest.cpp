/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/DoubleConversions.h>

#include <gtest/gtest.h>
#include <cmath>
#include <limits>

using namespace facebook::react;

TEST(DoubleConversionsTest, zeroValue) {
  EXPECT_EQ(toString(0.0, '\0'), "0");
}

TEST(DoubleConversionsTest, negativeZero) {
  EXPECT_EQ(toString(-0.0, '\0'), "-0");
}

TEST(DoubleConversionsTest, positiveIntegers) {
  EXPECT_EQ(toString(1.0, '\0'), "1");
  EXPECT_EQ(toString(42.0, '\0'), "42");
  EXPECT_EQ(toString(1000.0, '\0'), "1000");
}

TEST(DoubleConversionsTest, negativeIntegers) {
  EXPECT_EQ(toString(-1.0, '\0'), "-1");
  EXPECT_EQ(toString(-42.0, '\0'), "-42");
}

TEST(DoubleConversionsTest, fractionalValues) {
  EXPECT_EQ(toString(3.14, '\0'), "3.14");
  EXPECT_EQ(toString(0.5, '\0'), "0.5");
  EXPECT_EQ(toString(-2.75, '\0'), "-2.75");
}

TEST(DoubleConversionsTest, verySmallValues) {
  EXPECT_EQ(toString(0.000001, '\0'), "0.000001");
}

TEST(DoubleConversionsTest, veryLargeValues) {
  EXPECT_EQ(toString(1e20, '\0'), "100000000000000000000");
}

TEST(DoubleConversionsTest, scientificNotation) {
  // Values below 1e-6 should use scientific notation
  auto result = toString(1e-7, '\0');
  EXPECT_NE(result.find('E'), std::string::npos);
}

TEST(DoubleConversionsTest, infinitySerializedAsZero) {
  EXPECT_EQ(toString(std::numeric_limits<double>::infinity(), '\0'), "0");
  EXPECT_EQ(toString(-std::numeric_limits<double>::infinity(), '\0'), "0");
}

TEST(DoubleConversionsTest, nanSerializedAsZero) {
  EXPECT_EQ(toString(std::numeric_limits<double>::quiet_NaN(), '\0'), "0");
}

TEST(DoubleConversionsTest, suffixAppended) {
  EXPECT_EQ(toString(3.14, '%'), "3.14%");
  EXPECT_EQ(toString(100.0, 'x'), "100x");
}

TEST(DoubleConversionsTest, nullSuffixNotAppended) {
  auto result = toString(42.0, '\0');
  EXPECT_EQ(result, "42");
  EXPECT_EQ(result.back(), '2');
}

TEST(DoubleConversionsTest, suffixWithSpecialValues) {
  EXPECT_EQ(toString(std::numeric_limits<double>::infinity(), '%'), "0%");
  EXPECT_EQ(toString(std::numeric_limits<double>::quiet_NaN(), 'x'), "0x");
}
