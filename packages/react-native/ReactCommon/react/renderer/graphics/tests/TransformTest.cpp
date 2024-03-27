/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/Transform.h>

#include <gtest/gtest.h>
#include <cmath>
#include <limits>

using namespace facebook::react;

static inline void checkMatrix(
    const Transform& m,
    const Transform& exp,
    float epsilon = std::numeric_limits<float>::min()) {
  for (int i = 0; i < 16; i++) {
    EXPECT_NEAR(m.matrix[i], exp.matrix[i], epsilon);
  }
}

TEST(TransformTest, transformingSize) {
  auto size = facebook::react::Size{100, 200};
  auto scaledSize = size * Transform::Scale(0.5, 0.5, 1);

  EXPECT_EQ(scaledSize.width, 50);
  EXPECT_EQ(scaledSize.height, 100);
}

TEST(TransformTest, transformingPoint) {
  auto point = facebook::react::Point{100, 200};
  auto translatedPoint = point * Transform::Translate(-50, -100, 0);

  EXPECT_EQ(translatedPoint.x, 50);
  EXPECT_EQ(translatedPoint.y, 100);
}

TEST(TransformTest, scalingRect) {
  auto point = facebook::react::Point{100, 200};
  auto size = facebook::react::Size{300, 400};
  auto rect = facebook::react::Rect{point, size};

  auto transformedRect = rect * Transform::Scale(0.5, 0.5, 1);

  EXPECT_EQ(transformedRect.origin.x, 175);
  EXPECT_EQ(transformedRect.origin.y, 300);
  EXPECT_EQ(transformedRect.size.width, 150);
  EXPECT_EQ(transformedRect.size.height, 200);
}

TEST(TransformTest, scalingRectWithDifferentCenter) {
  auto point = facebook::react::Point{100, 200};
  auto size = facebook::react::Size{300, 400};
  auto rect = facebook::react::Rect{point, size};

  auto center = facebook::react::Point{0, 0};

  auto transformedRect =
      Transform::Scale(0.5, 0.5, 1).applyWithCenter(rect, center);

  EXPECT_EQ(transformedRect.origin.x, 50);
  EXPECT_EQ(transformedRect.origin.y, 100);
  EXPECT_EQ(transformedRect.size.width, 150);
  EXPECT_EQ(transformedRect.size.height, 200);
}

TEST(TransformTest, invertingSize) {
  auto size = facebook::react::Size{300, 400};
  auto transformedSize = size * Transform::VerticalInversion();
  EXPECT_EQ(transformedSize.width, 300);
  EXPECT_EQ(transformedSize.height, 400);
}

TEST(TransformTest, rotatingRect) {
  auto point = facebook::react::Point{10, 10};
  auto size = facebook::react::Size{10, 10};
  auto rect = facebook::react::Rect{point, size};

  auto transformedRect = rect * Transform::RotateZ(M_PI_4);

  ASSERT_NEAR(transformedRect.origin.x, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.origin.y, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.size.width, 14.1421, 0.0001);
  ASSERT_NEAR(transformedRect.size.height, 14.1421, 0.0001);
}

TEST(TransformTest, scalingAndTranslatingRect) {
  auto point = facebook::react::Point{100, 200};
  auto size = facebook::react::Size{300, 400};
  auto rect = facebook::react::Rect{point, size};

  auto transformedRect =
      rect * Transform::Scale(0.5, 0.5, 1) * Transform::Translate(1, 1, 0);

  EXPECT_EQ(transformedRect.origin.x, 176);
  EXPECT_EQ(transformedRect.origin.y, 301);
  EXPECT_EQ(transformedRect.size.width, 150);
  EXPECT_EQ(transformedRect.size.height, 200);
}

// Inverse Transform Tests (adapted from WPT:
// css/geometry/DOMMatrix-invert-invertible)
TEST(TransformTest, inverseIdentity) {
  auto m = Transform::Identity();
  auto m1 = Transform::Inverse(m);
  checkMatrix(m, m1);
}

TEST(TransformTest, inverseTranslate) {
  auto m = Transform::Translate(10, -20.5, 0);
  auto m1 = Transform::Inverse(m);
  checkMatrix(m1, Transform::Translate(-10, 20.5, 0));
  checkMatrix(m * m1, Transform::Identity());
}

TEST(TransformTest, inverse3DTranslate) {
  auto m = Transform::Translate(10, -20.5, 30.5);
  auto m1 = Transform::Inverse(m);
  checkMatrix(m1, Transform::Translate(-10, 20.5, -30.5));
  checkMatrix(m * m1, Transform::Identity());
}

TEST(TransformTest, inverseScale) {
  auto m = Transform::Scale(4, -0.5, 1);
  auto m1 = Transform::Inverse(m);
  checkMatrix(m1, Transform::Scale(0.25, -2.0, 1));
  checkMatrix(m * m1, Transform::Identity());
}

TEST(TransformTest, inverse3DScale) {
  auto m = Transform::Scale(4, -0.5, 2);
  auto m1 = Transform::Inverse(m);
  checkMatrix(m1, Transform::Scale(0.25, -2.0, 0.5));
  checkMatrix(m * m1, Transform::Identity());
}

TEST(TransformTest, inverseComplex) {
  auto m = Transform::RotateX(20) * Transform::Translate(10, -20.5, 30.5) *
      Transform::RotateY(10) * Transform::Scale(10, -0.5, 2.5) *
      Transform::RotateZ(-30);
  auto expected = Transform::RotateZ(30) * Transform::Scale(0.1, -2.0, 0.4) *
      Transform::RotateY(-10) * Transform::Translate(-10, 20.5, -30.5) *
      Transform::RotateX(-20);
  auto m1 = Transform::Inverse(m);
  auto epsilon = 1e-6f;
  checkMatrix(m1, expected, epsilon);
}
