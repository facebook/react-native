/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/Point.h>

#include <gtest/gtest.h>

using namespace facebook::react;

TEST(PointTest, testConstructor) {
  auto point = facebook::react::Point{1, 2};

  EXPECT_EQ(point.x, 1);
  EXPECT_EQ(point.y, 2);
}

TEST(PointTest, testPlusEqualOperator) {
  auto point = facebook::react::Point{1, 2};
  point += facebook::react::Point{3, 4};

  EXPECT_EQ(point.x, 4);
  EXPECT_EQ(point.y, 6);
}

TEST(PointTest, testMinusEqualOperator) {
  auto point = facebook::react::Point{1, 2};
  point -= facebook::react::Point{3, 4};

  EXPECT_EQ(point.x, -2);
  EXPECT_EQ(point.y, -2);
}

TEST(PointTest, testMultiplyEqualOperator) {
  auto point = facebook::react::Point{1, 2};
  point *= facebook::react::Point{3, 4};

  EXPECT_EQ(point.x, 3);
  EXPECT_EQ(point.y, 8);
}

TEST(PointTest, testPlusOperator) {
  auto newPoint = facebook::react::Point{1, 2} + facebook::react::Point{3, 4};

  EXPECT_EQ(newPoint.x, 4);
  EXPECT_EQ(newPoint.y, 6);
}

TEST(PointTest, testMinusOperator) {
  auto newPoint = facebook::react::Point{1, 2} - facebook::react::Point{3, 4};

  EXPECT_EQ(newPoint.x, -2);
  EXPECT_EQ(newPoint.y, -2);
}

TEST(PointTest, testEqualOperator) {
  auto pointA = facebook::react::Point{1, 2};
  auto pointB = facebook::react::Point{1, 2};
  auto pointC = facebook::react::Point{1, 3};
  auto pointD = facebook::react::Point{2, 2};

  EXPECT_TRUE(pointA == pointB);
  EXPECT_FALSE(pointA == pointC);
  EXPECT_FALSE(pointA == pointD);
}

TEST(PointTest, testUnequalOperator) {
  auto pointA = facebook::react::Point{1, 2};
  auto pointB = facebook::react::Point{1, 2};
  auto pointC = facebook::react::Point{1, 3};
  auto pointD = facebook::react::Point{2, 2};

  EXPECT_FALSE(pointA != pointB);
  EXPECT_TRUE(pointA != pointC);
  EXPECT_TRUE(pointA != pointD);
}

TEST(PointTest, testMinusUnaryOperator) {
  auto point = facebook::react::Point{1, 2};
  auto negativePoint = -point;

  EXPECT_EQ(negativePoint.x, -1);
  EXPECT_EQ(negativePoint.y, -2);
}
