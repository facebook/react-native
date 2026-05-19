/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/Transform.h>

#include <gtest/gtest.h>
#include <cmath>

using namespace facebook::react;

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

TEST(TransformTest, fromTransformOperationPercentage) {
  auto point = facebook::react::Point{0, 0};
  facebook::react::Size size = {120, 200};

  auto operation = TransformOperation{
      TransformOperationType::Translate,
      ValueUnit{50.0f, UnitType::Percent},
      ValueUnit{20.0f, UnitType::Percent},
      {}};
  auto translatedPoint =
      point * Transform::FromTransformOperation(operation, size);
  EXPECT_EQ(translatedPoint.x, 60);
  EXPECT_EQ(translatedPoint.y, 40);

  operation = TransformOperation{
      TransformOperationType::Translate,
      ValueUnit{40.0f, UnitType::Percent},
      ValueUnit{20.0f, UnitType::Point},
      {}};
  translatedPoint = point * Transform::FromTransformOperation(operation, size);
  EXPECT_EQ(translatedPoint.x, 48);
  EXPECT_EQ(translatedPoint.y, 20);
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

TEST(TransformTest, rotate3dOverload) {
  auto point = facebook::react::Point{10, 10};
  auto size = facebook::react::Size{10, 10};
  auto rect = facebook::react::Rect{point, size};

  auto transform = Transform::Rotate(0, 0, M_PI_4);
  EXPECT_EQ(transform.operations.size(), 1);
  EXPECT_EQ(transform.operations[0].type, TransformOperationType::Rotate);
  EXPECT_EQ(transform.operations[0].x.resolve(0), 0);
  EXPECT_EQ(transform.operations[0].y.resolve(0), 0);
  ASSERT_NEAR(transform.operations[0].z.resolve(0), M_PI_4, 0.0001);

  auto transformedRect = rect * Transform::Rotate(0, 0, M_PI_4);

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
