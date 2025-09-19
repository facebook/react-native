/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSBackgroundImage.h>

namespace facebook::react {

class CSSBackgroundImageTest : public ::testing::Test {};

TEST_F(CSSBackgroundImageTest, linear_gradient_to_right) {
  const std::string input = "linear-gradient(to right, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));

  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 90.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[0]));
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  EXPECT_EQ(firstStop.color.a, 255);
  
  EXPECT_FALSE(firstStop.startPosition.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[1]));
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
  EXPECT_EQ(secondStop.color.a, 255);

  EXPECT_FALSE(secondStop.startPosition.has_value());
}

TEST_F(CSSBackgroundImageTest, linear_gradient_to_bottom_right) {
  const std::string input = "linear-gradient(to bottom right, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientDirectionKeyword>(direction.value));

  const auto& directionKeyword = std::get<CSSLinearGradientDirectionKeyword>(direction.value);
  EXPECT_EQ(directionKeyword, CSSLinearGradientDirectionKeyword::ToBottomRight);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[0]));
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  EXPECT_EQ(firstStop.color.a, 255);
  
  EXPECT_FALSE(firstStop.startPosition.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[1]));
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
  EXPECT_EQ(secondStop.color.a, 255);

  EXPECT_FALSE(secondStop.startPosition.has_value());
}

TEST_F(CSSBackgroundImageTest, empty_string_returns_empty_array) {
  const std::string input = "";

  const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSBackgroundImageTest, invalid_value_returns_empty_array) {
  const std::string input = "linear-";

  const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSBackgroundImageTest, linear_gradient_with_whitespaces_in_direction) {
  const std::string input = "linear-gradient(to   bottom   right, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientDirectionKeyword>(direction.value));

  const auto& directionKeyword = std::get<CSSLinearGradientDirectionKeyword>(direction.value);
  EXPECT_EQ(directionKeyword, CSSLinearGradientDirectionKeyword::ToBottomRight);
  
  ASSERT_EQ(gradient.items.size(), 2u);
}

TEST_F(CSSBackgroundImageTest, linear_gradient_with_random_whitespaces) {
  const std::string input = " linear-gradient(to   bottom   right,  red  30%,  blue  80%)  ";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientDirectionKeyword>(direction.value));

  const auto& directionKeyword = std::get<CSSLinearGradientDirectionKeyword>(direction.value);
  EXPECT_EQ(directionKeyword, CSSLinearGradientDirectionKeyword::ToBottomRight);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  ASSERT_TRUE(firstStop.startPosition.has_value());
  const auto& firstPos = std::get<CSSPercentage>(*firstStop.startPosition);
  EXPECT_FLOAT_EQ(firstPos.value, 30.0f);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.b, 255);
  ASSERT_TRUE(secondStop.startPosition.has_value());
  const auto& secondPos = std::get<CSSPercentage>(*secondStop.startPosition);
  EXPECT_FLOAT_EQ(secondPos.value, 80.0f);
}

TEST_F(CSSBackgroundImageTest, linear_gradient_with_angle) {
  const std::string input = "linear-gradient(45deg, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));

  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 45.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
}

TEST_F(CSSBackgroundImageTest, linear_gradient_case_insensitive) {
  const std::string input = "LiNeAr-GradieNt(To Bottom, Red, Blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));

  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 180.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
}

TEST_F(CSSBackgroundImageTest, multiple_linear_gradients_with_newlines) {
  const std::string input = "\n      linear-gradient(to top, red, blue),\n      linear-gradient(to bottom, green, yellow)";

  const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
  ASSERT_FALSE(std::holds_alternative<std::monostate>(result));

  const auto& gradientList = std::get<CSSBackgroundImageList>(result);
  ASSERT_EQ(gradientList.size(), 2u);

  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(gradientList[0]));
  const auto& firstGradient = std::get<CSSLinearGradientFunction>(gradientList[0]);
  ASSERT_TRUE(firstGradient.direction.has_value());
  const auto& firstDirection = std::get<CSSAngle>(firstGradient.direction.value().value);
  EXPECT_FLOAT_EQ(firstDirection.degrees, 0.0f);

  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(gradientList[1]));
  const auto& secondGradient = std::get<CSSLinearGradientFunction>(gradientList[1]);
  ASSERT_TRUE(secondGradient.direction.has_value());
  const auto& secondDirection = std::get<CSSAngle>(secondGradient.direction.value().value);
  EXPECT_FLOAT_EQ(secondDirection.degrees, 180.0f);
}

TEST_F(CSSBackgroundImageTest, linear_gradient_with_multiple_color_stops) {
  const std::string input = "linear-gradient(to bottom, red 0%, green 50%, blue 100%)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));
  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 180.0f);
  
  ASSERT_EQ(gradient.items.size(), 3u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  ASSERT_TRUE(firstStop.startPosition.has_value());
  const auto& firstPos = std::get<CSSPercentage>(*firstStop.startPosition);
  EXPECT_FLOAT_EQ(firstPos.value, 0.0f);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 128);
  EXPECT_EQ(secondStop.color.b, 0);
  ASSERT_TRUE(secondStop.startPosition.has_value());
  const auto& secondPos = std::get<CSSPercentage>(*secondStop.startPosition);
  EXPECT_FLOAT_EQ(secondPos.value, 50.0f);
  
  const auto& thirdStop = std::get<CSSColorStop>(gradient.items[2]);
  EXPECT_EQ(thirdStop.color.r, 0);
  EXPECT_EQ(thirdStop.color.g, 0);
  EXPECT_EQ(thirdStop.color.b, 255);
  ASSERT_TRUE(thirdStop.startPosition.has_value());
  const auto& thirdPos = std::get<CSSPercentage>(*thirdStop.startPosition);
  EXPECT_FLOAT_EQ(thirdPos.value, 100.0f);
}

TEST_F(CSSBackgroundImageTest, linear_gradient_mixed_positioned_stops) {
  const std::string input = "linear-gradient(to right, red, green, blue 60%, yellow, purple)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));
  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 90.0f);
  
  ASSERT_EQ(gradient.items.size(), 5u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_FALSE(firstStop.startPosition.has_value());
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.g, 128);
  EXPECT_FALSE(secondStop.startPosition.has_value());
  
  const auto& thirdStop = std::get<CSSColorStop>(gradient.items[2]);
  EXPECT_EQ(thirdStop.color.b, 255);
  ASSERT_TRUE(thirdStop.startPosition.has_value());
  const auto& thirdPos = std::get<CSSPercentage>(*thirdStop.startPosition);
  EXPECT_FLOAT_EQ(thirdPos.value, 60.0f);
  
  const auto& fourthStop = std::get<CSSColorStop>(gradient.items[3]);
  EXPECT_EQ(fourthStop.color.r, 255);
  EXPECT_EQ(fourthStop.color.g, 255);
  EXPECT_EQ(fourthStop.color.b, 0);
  EXPECT_FALSE(fourthStop.startPosition.has_value());
  
  const auto& fifthStop = std::get<CSSColorStop>(gradient.items[4]);
  EXPECT_EQ(fifthStop.color.r, 128);
  EXPECT_EQ(fifthStop.color.g, 0);
  EXPECT_EQ(fifthStop.color.b, 128);
  EXPECT_FALSE(fifthStop.startPosition.has_value());
}

TEST_F(CSSBackgroundImageTest, linear_gradient_with_hsl_colors) {
  const std::string input = "linear-gradient(hsl(330, 100%, 45.1%), hsl(0, 100%, 50%))";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));
  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 180.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 230);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 115);
  EXPECT_FALSE(firstStop.startPosition.has_value());
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 255);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 0);
  EXPECT_FALSE(secondStop.startPosition.has_value());
}

TEST_F(CSSBackgroundImageTest, linear_gradient_without_direction) {
  const std::string input = "linear-gradient(#e66465, #9198e5)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));
  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 180.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 230);
  EXPECT_EQ(firstStop.color.g, 100);
  EXPECT_EQ(firstStop.color.b, 101);
  EXPECT_FALSE(firstStop.startPosition.has_value());
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 145);
  EXPECT_EQ(secondStop.color.g, 152);
  EXPECT_EQ(secondStop.color.b, 229);
  EXPECT_FALSE(secondStop.startPosition.has_value());
}

TEST_F(CSSBackgroundImageTest, linear_gradient_invalid_cases) {
  const std::vector<std::string> invalidInputs = {
    "linear-gradient(45deg, rede, blue)",
    "linear-gradient(45 deg, red, blue)",
    "linear-gradient(to left2, red, blue)",
    "linear-gradient(to left, red 5, blue)"
  };

  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImage>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result)) << "Input should be invalid: " << input;
  }
}

TEST_F(CSSBackgroundImageTest, linear_gradient_with_multiple_transition_hints) {
  const std::string input = "linear-gradient(red, 20%, blue, 60%, green, 80%, yellow)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_TRUE(gradient.direction.has_value());

  const auto& direction = gradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));
  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 180.0f);
  
  ASSERT_EQ(gradient.items.size(), 7u);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[0]));
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_FALSE(firstStop.startPosition.has_value());
  
  ASSERT_TRUE(std::holds_alternative<CSSColorHint>(gradient.items[1]));
  const auto& firstHint = std::get<CSSColorHint>(gradient.items[1]);
  const auto& firstHintPos = std::get<CSSPercentage>(firstHint.position);
  EXPECT_FLOAT_EQ(firstHintPos.value, 20.0f);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[2]));
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[2]);
  EXPECT_EQ(secondStop.color.b, 255);
  EXPECT_FALSE(secondStop.startPosition.has_value());
  
  ASSERT_TRUE(std::holds_alternative<CSSColorHint>(gradient.items[3]));
  const auto& secondHint = std::get<CSSColorHint>(gradient.items[3]);
  const auto& secondHintPos = std::get<CSSPercentage>(secondHint.position);
  EXPECT_FLOAT_EQ(secondHintPos.value, 60.0f);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[4]));
  const auto& thirdStop = std::get<CSSColorStop>(gradient.items[4]);
  EXPECT_EQ(thirdStop.color.g, 128);
  EXPECT_FALSE(thirdStop.startPosition.has_value());
  
  ASSERT_TRUE(std::holds_alternative<CSSColorHint>(gradient.items[5]));
  const auto& thirdHint = std::get<CSSColorHint>(gradient.items[5]);
  const auto& thirdHintPos = std::get<CSSPercentage>(thirdHint.position);
  EXPECT_FLOAT_EQ(thirdHintPos.value, 80.0f);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[6]));
  const auto& fourthStop = std::get<CSSColorStop>(gradient.items[6]);
  EXPECT_EQ(fourthStop.color.r, 255);
  EXPECT_EQ(fourthStop.color.g, 255);
  EXPECT_EQ(fourthStop.color.b, 0);
  EXPECT_FALSE(fourthStop.startPosition.has_value());
}

TEST_F(CSSBackgroundImageTest, linear_gradient_invalid_transition_hints) {
  const std::vector<std::string> invalidInputs = {
    // color hints must be between two color stops
    "linear-gradient(red, 30%, blue, 60%, green, 80%)",
    "linear-gradient(red, 30%, 60%, green)",
    "linear-gradient(20%, red, green)"
  };

  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result)) << "Input should be invalid: " << input;
  }
}

TEST_F(CSSBackgroundImageTest, linear_gradient_with_mixed_units) {
  const std::string input = "linear-gradient(red 10%, 20px, blue 30%, purple 40px)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(result));

  const auto& gradient = std::get<CSSLinearGradientFunction>(result);
  ASSERT_EQ(gradient.items.size(), 4u);

  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  ASSERT_TRUE(firstStop.startPosition.has_value());
  const auto& firstPos = std::get<CSSPercentage>(*firstStop.startPosition);
  EXPECT_FLOAT_EQ(firstPos.value, 10.0f);

  const auto& firstHint = std::get<CSSColorHint>(gradient.items[1]);
  const auto& firstHintPos = std::get<CSSLength>(firstHint.position);
  EXPECT_FLOAT_EQ(firstHintPos.value, 20.0f);
  EXPECT_EQ(firstHintPos.unit, CSSLengthUnit::Px);

  const auto& secondStop = std::get<CSSColorStop>(gradient.items[2]);
  EXPECT_EQ(secondStop.color.b, 255);
  ASSERT_TRUE(secondStop.startPosition.has_value());
  const auto& secondPos = std::get<CSSPercentage>(*secondStop.startPosition);
  EXPECT_FLOAT_EQ(secondPos.value, 30.0f);

  const auto& thirdStop = std::get<CSSColorStop>(gradient.items[3]);
  EXPECT_EQ(thirdStop.color.r, 128);
  EXPECT_EQ(thirdStop.color.b, 128);
  ASSERT_TRUE(thirdStop.startPosition.has_value());
  const auto& thirdPos = std::get<CSSLength>(*thirdStop.startPosition);
  EXPECT_FLOAT_EQ(thirdPos.value, 40.0f);
  EXPECT_EQ(thirdPos.unit, CSSLengthUnit::Px);
}

TEST_F(CSSBackgroundImageTest, radial_gradient_basic) {
  const std::string input = "radial-gradient(red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Ellipse);
  
  ASSERT_TRUE(gradient.size.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientSizeKeyword>(gradient.size.value()));
  EXPECT_EQ(std::get<CSSRadialGradientSizeKeyword>(gradient.size.value()), CSSRadialGradientSizeKeyword::FarthestCorner);
  
  ASSERT_TRUE(gradient.position.has_value());
  const auto& position = gradient.position.value();
  ASSERT_TRUE(position.top.has_value());
  ASSERT_TRUE(position.left.has_value());
  const auto& topPos = std::get<CSSPercentage>(*position.top);
  const auto& leftPos = std::get<CSSPercentage>(*position.left);
  EXPECT_FLOAT_EQ(topPos.value, 50.0f);
  EXPECT_FLOAT_EQ(leftPos.value, 50.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  EXPECT_FALSE(firstStop.startPosition.has_value());
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
  EXPECT_FALSE(secondStop.startPosition.has_value());
}

TEST_F(CSSBackgroundImageTest, radial_gradient_infer_circle_from_single_length) {
  const std::string input = "radial-gradient(100px, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Circle);
  
  ASSERT_TRUE(gradient.size.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientExplicitSize>(gradient.size.value()));
  
  const auto& explicitSize = std::get<CSSRadialGradientExplicitSize>(gradient.size.value());
  ASSERT_TRUE(std::holds_alternative<CSSLength>(explicitSize.sizeX));
  ASSERT_TRUE(std::holds_alternative<CSSLength>(explicitSize.sizeY));
  
  const auto& lengthX = std::get<CSSLength>(explicitSize.sizeX);
  const auto& lengthY = std::get<CSSLength>(explicitSize.sizeY);
  
  EXPECT_FLOAT_EQ(lengthX.value, 100.0f);
  EXPECT_FLOAT_EQ(lengthY.value, 100.0f);
  EXPECT_EQ(lengthX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(lengthY.unit, CSSLengthUnit::Px);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
}

TEST_F(CSSBackgroundImageTest, radial_gradient_infer_ellipse_from_double_length) {
  const std::string input = "radial-gradient(100px 50px, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Ellipse);
  
  ASSERT_TRUE(gradient.size.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientExplicitSize>(gradient.size.value()));
  
  const auto& explicitSize = std::get<CSSRadialGradientExplicitSize>(gradient.size.value());
  ASSERT_TRUE(std::holds_alternative<CSSLength>(explicitSize.sizeX));
  ASSERT_TRUE(std::holds_alternative<CSSLength>(explicitSize.sizeY));
  
  const auto& lengthX = std::get<CSSLength>(explicitSize.sizeX);
  const auto& lengthY = std::get<CSSLength>(explicitSize.sizeY);
  
  EXPECT_FLOAT_EQ(lengthX.value, 100.0f);
  EXPECT_FLOAT_EQ(lengthY.value, 50.0f);
  EXPECT_EQ(lengthX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(lengthY.unit, CSSLengthUnit::Px);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
}

TEST_F(CSSBackgroundImageTest, radial_gradient_explicit_shape_with_size) {
  const std::string input = "radial-gradient(circle 100px at center, red, blue 80%)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Circle);
  
  ASSERT_TRUE(gradient.size.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientExplicitSize>(gradient.size.value()));
  
  const auto& explicitSize = std::get<CSSRadialGradientExplicitSize>(gradient.size.value());
  ASSERT_TRUE(std::holds_alternative<CSSLength>(explicitSize.sizeX));
  ASSERT_TRUE(std::holds_alternative<CSSLength>(explicitSize.sizeY));
  
  const auto& lengthX = std::get<CSSLength>(explicitSize.sizeX);
  const auto& lengthY = std::get<CSSLength>(explicitSize.sizeY);
  
  EXPECT_FLOAT_EQ(lengthX.value, 100.0f);
  EXPECT_FLOAT_EQ(lengthY.value, 100.0f);
  EXPECT_EQ(lengthX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(lengthY.unit, CSSLengthUnit::Px);
  
  ASSERT_TRUE(gradient.position.has_value());
  const auto& position = gradient.position.value();
  ASSERT_TRUE(position.top.has_value());
  ASSERT_TRUE(position.left.has_value());
  const auto& topPos = std::get<CSSPercentage>(*position.top);
  const auto& leftPos = std::get<CSSPercentage>(*position.left);
  EXPECT_FLOAT_EQ(topPos.value, 50.0f);
  EXPECT_FLOAT_EQ(leftPos.value, 50.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  EXPECT_FALSE(firstStop.startPosition.has_value());
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
  ASSERT_TRUE(secondStop.startPosition.has_value());
  const auto& secondPos = std::get<CSSPercentage>(*secondStop.startPosition);
  EXPECT_FLOAT_EQ(secondPos.value, 80.0f);
}

// 1. position syntax: [ left | center | right | top | bottom | <length-percentage> ]
TEST_F(CSSBackgroundImageTest, radial_gradient_position_length_syntax) {
  const std::string input = "radial-gradient(circle at 20px, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Circle);
  
  ASSERT_TRUE(gradient.position.has_value());
  const auto& position = gradient.position.value();
  ASSERT_TRUE(position.left.has_value());
  const auto& leftPos = std::get<CSSLength>(*position.left);
  EXPECT_FLOAT_EQ(leftPos.value, 20.0f);
  EXPECT_EQ(leftPos.unit, CSSLengthUnit::Px);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
}

// 2. position syntax: [ left | center | right ] && [ top | center | bottom ]
TEST_F(CSSBackgroundImageTest, radial_gradient_position_keyword_combinations) {
  const std::vector<std::string> inputs = {
    "radial-gradient(circle at left top, red, blue)",
    "radial-gradient(circle at top left, red, blue)"
  };

  for (const auto& input : inputs) {
    const auto result = parseCSSProperty<CSSBackgroundImage>(input);
    ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result)) << "Failed to parse: " << input;

    const auto& gradient = std::get<CSSRadialGradientFunction>(result);
    
    ASSERT_TRUE(gradient.shape.has_value());
    EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Circle);
    
    ASSERT_TRUE(gradient.position.has_value());
    const auto& position = gradient.position.value();
    ASSERT_TRUE(position.left.has_value());
    ASSERT_TRUE(position.top.has_value());
    
    const auto& leftPos = std::get<CSSPercentage>(*position.left);
    const auto& topPos = std::get<CSSPercentage>(*position.top);
    EXPECT_FLOAT_EQ(leftPos.value, 0.0f) << "Input: " << input;
    EXPECT_FLOAT_EQ(topPos.value, 0.0f) << "Input: " << input;
    
    ASSERT_EQ(gradient.items.size(), 2u);
    
    const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
    EXPECT_EQ(firstStop.color.r, 255);
    EXPECT_EQ(firstStop.color.g, 0);
    EXPECT_EQ(firstStop.color.b, 0);
    
    const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
    EXPECT_EQ(secondStop.color.r, 0);
    EXPECT_EQ(secondStop.color.g, 0);
    EXPECT_EQ(secondStop.color.b, 255);
  }
}

// 3. position syntax: [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]
TEST_F(CSSBackgroundImageTest, radial_gradient_complex_position_syntax) {
  const std::vector<std::pair<std::string, std::pair<float, float>>> testCases = {
    {"radial-gradient(circle at left 20px, red, blue)", {0.0f, 20.0f}},  // left=0%, top=20px
    {"radial-gradient(circle at 20px 20px, red, blue)", {20.0f, 20.0f}}, // left=20px, top=20px
    {"radial-gradient(circle at right 50px, red, blue)", {0.0f, 50.0f}} // right=0%, top=50px
  };

  for (const auto& [input, expected] : testCases) {
    const auto result = parseCSSProperty<CSSBackgroundImage>(input);
    ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result)) << "Failed to parse: " << input;

    const auto& gradient = std::get<CSSRadialGradientFunction>(result);
    
    ASSERT_TRUE(gradient.position.has_value());
    const auto& position = gradient.position.value();
    
    if (input.find("left") != std::string::npos) {
      ASSERT_TRUE(position.left.has_value());
      const auto& leftPos = std::get<CSSPercentage>(*position.left);
      EXPECT_FLOAT_EQ(leftPos.value, expected.first) << "Input: " << input;
    } else if (input.find("right") != std::string::npos) {
      ASSERT_TRUE(position.right.has_value());
      const auto& rightPos = std::get<CSSPercentage>(*position.right);
      EXPECT_FLOAT_EQ(rightPos.value, expected.first) << "Input: " << input;
    } else {
      ASSERT_TRUE(position.left.has_value());
      const auto& leftPos = std::get<CSSLength>(*position.left);
      EXPECT_FLOAT_EQ(leftPos.value, expected.first) << "Input: " << input;
      EXPECT_EQ(leftPos.unit, CSSLengthUnit::Px) << "Input: " << input;
    }
    
    ASSERT_TRUE(position.top.has_value());
    const auto& topPos = std::get<CSSLength>(*position.top);
    EXPECT_FLOAT_EQ(topPos.value, expected.second) << "Input: " << input;
    EXPECT_EQ(topPos.unit, CSSLengthUnit::Px) << "Input: " << input;
    
    ASSERT_EQ(gradient.items.size(), 2u);
  }
}

// 4. position syntax: [ [ left | right ] <length-percentage> ] && [ [ top | bottom ] <length-percentage> ]
TEST_F(CSSBackgroundImageTest, radial_gradient_separate_position_percentages) {
  const std::string input = "radial-gradient(at top 0% right 10%, red, blue)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.position.has_value());
  const auto& position = gradient.position.value();
  
  ASSERT_TRUE(position.right.has_value());
  const auto& rightPos = std::get<CSSPercentage>(*position.right);
  EXPECT_FLOAT_EQ(rightPos.value, 10.0f);
  
  ASSERT_TRUE(position.top.has_value());
  const auto& topPos = std::get<CSSPercentage>(*position.top);
  EXPECT_FLOAT_EQ(topPos.value, 0.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
}

TEST_F(CSSBackgroundImageTest, radial_gradient_with_transition_hints) {
  const std::string input = "radial-gradient(circle, red 0%, 25%, blue 50%, 75%, green 100%)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Circle);
  
  ASSERT_EQ(gradient.items.size(), 5u);

  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[0]));
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  ASSERT_TRUE(firstStop.startPosition.has_value());
  const auto& firstPos = std::get<CSSPercentage>(*firstStop.startPosition);
  EXPECT_FLOAT_EQ(firstPos.value, 0.0f);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorHint>(gradient.items[1]));
  const auto& firstHint = std::get<CSSColorHint>(gradient.items[1]);
  const auto& firstHintPos = std::get<CSSPercentage>(firstHint.position);
  EXPECT_FLOAT_EQ(firstHintPos.value, 25.0f);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[2]));
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[2]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
  ASSERT_TRUE(secondStop.startPosition.has_value());
  const auto& secondPos = std::get<CSSPercentage>(*secondStop.startPosition);
  EXPECT_FLOAT_EQ(secondPos.value, 50.0f);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorHint>(gradient.items[3]));
  const auto& secondHint = std::get<CSSColorHint>(gradient.items[3]);
  const auto& secondHintPos = std::get<CSSPercentage>(secondHint.position);
  EXPECT_FLOAT_EQ(secondHintPos.value, 75.0f);
  
  ASSERT_TRUE(std::holds_alternative<CSSColorStop>(gradient.items[4]));
  const auto& thirdStop = std::get<CSSColorStop>(gradient.items[4]);
  EXPECT_EQ(thirdStop.color.r, 0);
  EXPECT_EQ(thirdStop.color.g, 128);
  EXPECT_EQ(thirdStop.color.b, 0);
  ASSERT_TRUE(thirdStop.startPosition.has_value());
  const auto& thirdPos = std::get<CSSPercentage>(*thirdStop.startPosition);
  EXPECT_FLOAT_EQ(thirdPos.value, 100.0f);
}

TEST_F(CSSBackgroundImageTest, multiple_gradients_radial_and_linear) {
  const std::string input = "radial-gradient(circle at top left, red, blue), linear-gradient(to bottom, green, yellow)";

  const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
  ASSERT_FALSE(std::holds_alternative<std::monostate>(result));

  const auto& gradientList = std::get<CSSBackgroundImageList>(result);
  ASSERT_EQ(gradientList.size(), 2u);

  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(gradientList[0]));
  const auto& radialGradient = std::get<CSSRadialGradientFunction>(gradientList[0]);
  
  ASSERT_TRUE(radialGradient.shape.has_value());
  EXPECT_EQ(radialGradient.shape.value(), CSSRadialGradientShape::Circle);
  
  ASSERT_TRUE(radialGradient.position.has_value());
  const auto& radialPosition = radialGradient.position.value();
  ASSERT_TRUE(radialPosition.left.has_value());
  ASSERT_TRUE(radialPosition.top.has_value());
  const auto& leftPos = std::get<CSSPercentage>(*radialPosition.left);
  const auto& topPos = std::get<CSSPercentage>(*radialPosition.top);
  EXPECT_FLOAT_EQ(leftPos.value, 0.0f);
  EXPECT_FLOAT_EQ(topPos.value, 0.0f);
  
  ASSERT_EQ(radialGradient.items.size(), 2u);
  const auto& radialFirstStop = std::get<CSSColorStop>(radialGradient.items[0]);
  EXPECT_EQ(radialFirstStop.color.r, 255);
  const auto& radialSecondStop = std::get<CSSColorStop>(radialGradient.items[1]);
  EXPECT_EQ(radialSecondStop.color.b, 255);

  ASSERT_TRUE(std::holds_alternative<CSSLinearGradientFunction>(gradientList[1]));
  const auto& linearGradient = std::get<CSSLinearGradientFunction>(gradientList[1]);
  
  ASSERT_TRUE(linearGradient.direction.has_value());
  const auto& direction = linearGradient.direction.value();
  ASSERT_TRUE(std::holds_alternative<CSSAngle>(direction.value));
  const auto& directionAngle = std::get<CSSAngle>(direction.value);
  EXPECT_FLOAT_EQ(directionAngle.degrees, 180.0f);
  
  ASSERT_EQ(linearGradient.items.size(), 2u);
  const auto& linearFirstStop = std::get<CSSColorStop>(linearGradient.items[0]);
  EXPECT_EQ(linearFirstStop.color.g, 128);
  const auto& linearSecondStop = std::get<CSSColorStop>(linearGradient.items[1]);
  EXPECT_EQ(linearSecondStop.color.r, 255);
  EXPECT_EQ(linearSecondStop.color.g, 255);
}

TEST_F(CSSBackgroundImageTest, radial_gradient_mixed_case) {
  const std::string input = "RaDiAl-GrAdIeNt(CiRcLe ClOsEsT-sIdE aT cEnTeR, rEd, bLuE)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Circle);
  
  ASSERT_TRUE(gradient.size.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientSizeKeyword>(gradient.size.value()));
  EXPECT_EQ(std::get<CSSRadialGradientSizeKeyword>(gradient.size.value()), CSSRadialGradientSizeKeyword::ClosestSide);
  
  ASSERT_TRUE(gradient.position.has_value());
  const auto& position = gradient.position.value();
  ASSERT_TRUE(position.left.has_value());
  ASSERT_TRUE(position.top.has_value());
  const auto& leftPos = std::get<CSSPercentage>(*position.left);
  const auto& topPos = std::get<CSSPercentage>(*position.top);
  EXPECT_FLOAT_EQ(leftPos.value, 50.0f);
  EXPECT_FLOAT_EQ(topPos.value, 50.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  EXPECT_EQ(firstStop.color.g, 0);
  EXPECT_EQ(firstStop.color.b, 0);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 0);
  EXPECT_EQ(secondStop.color.g, 0);
  EXPECT_EQ(secondStop.color.b, 255);
}

TEST_F(CSSBackgroundImageTest, radial_gradient_whitespace_variations) {
  const std::string input = "radial-gradient(   circle    farthest-corner    at    25%    75%   ,   red   0%   ,   blue    100%   )";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_TRUE(gradient.shape.has_value());
  EXPECT_EQ(gradient.shape.value(), CSSRadialGradientShape::Circle);
  
  ASSERT_TRUE(gradient.size.has_value());
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientSizeKeyword>(gradient.size.value()));
  EXPECT_EQ(std::get<CSSRadialGradientSizeKeyword>(gradient.size.value()), CSSRadialGradientSizeKeyword::FarthestCorner);
  
  ASSERT_TRUE(gradient.position.has_value());
  const auto& position = gradient.position.value();
  ASSERT_TRUE(position.left.has_value());
  ASSERT_TRUE(position.top.has_value());
  const auto& leftPos = std::get<CSSPercentage>(*position.left);
  const auto& topPos = std::get<CSSPercentage>(*position.top);
  EXPECT_FLOAT_EQ(leftPos.value, 25.0f);
  EXPECT_FLOAT_EQ(topPos.value, 75.0f);
  
  ASSERT_EQ(gradient.items.size(), 2u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  ASSERT_TRUE(firstStop.startPosition.has_value());
  const auto& firstPos = std::get<CSSPercentage>(*firstStop.startPosition);
  EXPECT_FLOAT_EQ(firstPos.value, 0.0f);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.b, 255);
  ASSERT_TRUE(secondStop.startPosition.has_value());
  const auto& secondPos = std::get<CSSPercentage>(*secondStop.startPosition);
  EXPECT_FLOAT_EQ(secondPos.value, 100.0f);
}

TEST_F(CSSBackgroundImageTest, radial_gradient_invalid_cases) {
  const std::vector<std::string> invalidInputs = {
    "radial-gradient(circle at top leftt, red, blue)",
    "radial-gradient(circle at, red, blue)",
    "radial-gradient(ellipse 100px, red, blue)",
    "radial-gradient(ellipse at top 20% top 50%, red, blue)"
  };

  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result)) << "Input should be invalid: " << input;
  }
}

TEST_F(CSSBackgroundImageTest, radial_gradient_multiple_color_stops) {
  const std::string input = "radial-gradient(red 0%, yellow 30%, green 60%, blue 100%)";

  const auto result = parseCSSProperty<CSSBackgroundImage>(input);
  ASSERT_TRUE(std::holds_alternative<CSSRadialGradientFunction>(result));

  const auto& gradient = std::get<CSSRadialGradientFunction>(result);
  
  ASSERT_EQ(gradient.items.size(), 4u);
  
  const auto& firstStop = std::get<CSSColorStop>(gradient.items[0]);
  EXPECT_EQ(firstStop.color.r, 255);
  ASSERT_TRUE(firstStop.startPosition.has_value());
  const auto& firstPos = std::get<CSSPercentage>(*firstStop.startPosition);
  EXPECT_FLOAT_EQ(firstPos.value, 0.0f);
  
  const auto& secondStop = std::get<CSSColorStop>(gradient.items[1]);
  EXPECT_EQ(secondStop.color.r, 255);
  EXPECT_EQ(secondStop.color.g, 255);
  ASSERT_TRUE(secondStop.startPosition.has_value());
  const auto& secondPos = std::get<CSSPercentage>(*secondStop.startPosition);
  EXPECT_FLOAT_EQ(secondPos.value, 30.0f);
  
  const auto& thirdStop = std::get<CSSColorStop>(gradient.items[2]);
  EXPECT_EQ(thirdStop.color.g, 128);
  ASSERT_TRUE(thirdStop.startPosition.has_value());
  const auto& thirdPos = std::get<CSSPercentage>(*thirdStop.startPosition);
  EXPECT_FLOAT_EQ(thirdPos.value, 60.0f);
  
  const auto& fourthStop = std::get<CSSColorStop>(gradient.items[3]);
  EXPECT_EQ(fourthStop.color.b, 255);
  ASSERT_TRUE(fourthStop.startPosition.has_value());
  const auto& fourthPos = std::get<CSSPercentage>(*fourthStop.startPosition);
  EXPECT_FLOAT_EQ(fourthPos.value, 100.0f);
}

TEST_F(CSSBackgroundImageTest, invalid_gradient_function_name) {
  const std::string input = "aoeusntial-gradient(red 0%, yellow 30%, green 60%, blue 100%)";

  const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSBackgroundImageTest, radial_gradient_negative_radius) {
  const std::vector<std::string> invalidInputs = {
    "radial-gradient(circle -100px, red, blue)",
    "radial-gradient(ellipse 100px -40px, red, blue)"
  };

  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result)) << "Input should be invalid: " << input;
  }
}

} // namespace facebook::react
