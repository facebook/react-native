/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLinearGradient.h"

#import <React/RCTAnimationUtils.h>
#import <React/RCTConversions.h>
#include <react/renderer/graphics/ValueUnit.h>
#import <react/utils/FloatComparison.h>

using namespace facebook::react;

@implementation RCTLinearGradient

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const LinearGradient &)gradient
{
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size];
  const auto &direction = gradient.direction;
  UIImage *gradientImage = [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull rendererContext) {
    CGPoint startPoint;
    CGPoint endPoint;

    if (direction.type == GradientDirectionType::Angle) {
      CGFloat angle = std::get<Float>(direction.value);
      std::tie(startPoint, endPoint) = getPointsFromAngle(angle, size);
    } else if (direction.type == GradientDirectionType::Keyword) {
      auto keyword = std::get<GradientKeyword>(direction.value);
      CGFloat angle = getAngleForKeyword(keyword, size);
      std::tie(startPoint, endPoint) = getPointsFromAngle(angle, size);
    } else {
      // Default to top-to-bottom gradient
      startPoint = CGPointMake(0.0, 0.0);
      endPoint = CGPointMake(0.0, size.height);
    }

    CGFloat dx = endPoint.x - startPoint.x;
    CGFloat dy = endPoint.y - startPoint.y;
    CGFloat gradientLineLength = sqrt(dx * dx + dy * dy);
    const auto processedStops = getFixedColorStops(gradient.colorStops, gradientLineLength);
    const auto colorStops = processColorTransitionHints(processedStops);

    CGContextRef context = rendererContext.CGContext;
    NSMutableArray *colors = [NSMutableArray array];
    CGFloat locations[colorStops.size()];

    for (size_t i = 0; i < colorStops.size(); ++i) {
      const auto &colorStop = colorStops[i];
      CGColorRef cgColor = RCTCreateCGColorRefFromSharedColor(colorStop.color);
      [colors addObject:(__bridge id)cgColor];
      locations[i] = std::max(std::min(colorStop.position.value(), 1.0), 0.0);
    }

    CGGradientRef cgGradient = CGGradientCreateWithColors(NULL, (__bridge CFArrayRef)colors, locations);

    CGContextDrawLinearGradient(context, cgGradient, startPoint, endPoint, 0);

    for (id color in colors) {
      CGColorRelease((__bridge CGColorRef)color);
    }
    CGGradientRelease(cgGradient);
  }];

  CALayer *gradientLayer = [CALayer layer];
  gradientLayer.contents = (__bridge id)gradientImage.CGImage;

  return gradientLayer;
}

// Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
// Reference:
// https://github.com/chromium/chromium/blob/d32abbe13f5d52be7127fe25d5b778498165fab8/third_party/blink/renderer/core/css/css_gradient_value.cc#L1057
static std::pair<CGPoint, CGPoint> getPointsFromAngle(CGFloat angle, CGSize size)
{
  angle = fmod(angle, 360.0);
  if (angle < 0) {
    angle += 360.0;
  }

  if (angle == 0.0) {
    return {CGPointMake(0, size.height), CGPointMake(0, 0)};
  }
  if (angle == 90.0) {
    return {CGPointMake(0, 0), CGPointMake(size.width, 0)};
  }
  if (angle == 180.0) {
    return {CGPointMake(0, 0), CGPointMake(0, size.height)};
  }
  if (angle == 270.0) {
    return {CGPointMake(size.width, 0), CGPointMake(0, 0)};
  }

  CGFloat radians = (90 - angle) * M_PI / 180.0;
  CGFloat slope = tan(radians);
  CGFloat perpendicularSlope = -1 / slope;

  CGFloat halfHeight = size.height / 2;
  CGFloat halfWidth = size.width / 2;

  CGPoint endCorner;
  if (angle < 90) {
    endCorner = CGPointMake(halfWidth, halfHeight);
  } else if (angle < 180) {
    endCorner = CGPointMake(halfWidth, -halfHeight);
  } else if (angle < 270) {
    endCorner = CGPointMake(-halfWidth, -halfHeight);
  } else {
    endCorner = CGPointMake(-halfWidth, halfHeight);
  }

  CGFloat c = endCorner.y - perpendicularSlope * endCorner.x;
  CGFloat endX = c / (slope - perpendicularSlope);
  CGFloat endY = perpendicularSlope * endX + c;

  return {CGPointMake(halfWidth - endX, halfHeight + endY), CGPointMake(halfWidth + endX, halfHeight - endY)};
}

// Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
// Refer `using keywords` section
static CGFloat getAngleForKeyword(GradientKeyword keyword, CGSize size)
{
  switch (keyword) {
    case GradientKeyword::ToTopRight: {
      CGFloat angleDeg = atan(size.width / size.height) * 180.0 / M_PI;
      return 90.0 - angleDeg;
    }
    case GradientKeyword::ToBottomRight:
      return atan(size.width / size.height) * 180.0 / M_PI + 90.0;
    case GradientKeyword::ToTopLeft:
      return atan(size.width / size.height) * 180.0 / M_PI + 270.0;
    case GradientKeyword::ToBottomLeft:
      return atan(size.height / size.width) * 180.0 / M_PI + 180.0;
    default:
      return 180.0;
  }
}

// Spec: https://drafts.csswg.org/css-images-4/#coloring-gradient-line (Refer transition hint section)
// Browsers add 9 intermediate color stops when a transition hint is present
// Algorithm is referred from Blink engine
// [source](https://github.com/chromium/chromium/blob/a296b1bad6dc1ed9d751b7528f7ca2134227b828/third_party/blink/renderer/core/css/css_gradient_value.cc#L240).
static std::vector<ProcessedColorStop> processColorTransitionHints(const std::vector<ProcessedColorStop> &originalStops)
{
  auto colorStops = std::vector<ProcessedColorStop>(originalStops);
  int indexOffset = 0;

  for (size_t i = 1; i < originalStops.size() - 1; ++i) {
    // Skip if not a color hint
    if (originalStops[i].color) {
      continue;
    }

    size_t x = i + indexOffset;
    if (x < 1) {
      continue;
    }

    auto offsetLeft = colorStops[x - 1].position.value();
    auto offsetRight = colorStops[x + 1].position.value();
    auto offset = colorStops[x].position.value();
    auto leftDist = offset - offsetLeft;
    auto rightDist = offsetRight - offset;
    auto totalDist = offsetRight - offsetLeft;
    SharedColor leftSharedColor = colorStops[x - 1].color;
    SharedColor rightSharedColor = colorStops[x + 1].color;

    if (facebook::react::floatEquality(leftDist, rightDist)) {
      colorStops.erase(colorStops.begin() + x);
      --indexOffset;
      continue;
    }

    if (facebook::react::floatEquality(leftDist, .0f)) {
      colorStops[x].color = rightSharedColor;
      continue;
    }

    if (facebook::react::floatEquality(rightDist, .0f)) {
      colorStops[x].color = leftSharedColor;
      continue;
    }

    std::vector<ProcessedColorStop> newStops;
    newStops.reserve(9);

    // Position the new color stops
    if (leftDist > rightDist) {
      for (int y = 0; y < 7; ++y) {
        ProcessedColorStop newStop{SharedColor(), offsetLeft + leftDist * ((7.0f + y) / 13.0f)};
        newStops.push_back(newStop);
      }
      ProcessedColorStop stop1{SharedColor(), offset + rightDist * (1.0f / 3.0f)};
      ProcessedColorStop stop2{SharedColor(), offset + rightDist * (2.0f / 3.0f)};
      newStops.push_back(stop1);
      newStops.push_back(stop2);
    } else {
      ProcessedColorStop stop1{SharedColor(), offsetLeft + leftDist * (1.0f / 3.0f)};
      ProcessedColorStop stop2{SharedColor(), offsetLeft + leftDist * (2.0f / 3.0f)};
      newStops.push_back(stop1);
      newStops.push_back(stop2);
      for (int y = 0; y < 7; ++y) {
        ProcessedColorStop newStop{SharedColor(), offset + rightDist * (y / 13.0f)};
        newStops.push_back(newStop);
      }
    }

    // calculate colors for the new color hints.
    // The color weighting for the new color stops will be
    // pointRelativeOffset^(ln(0.5)/ln(hintRelativeOffset)).
    auto hintRelativeOffset = leftDist / totalDist;
    const auto logRatio = log(0.5) / log(hintRelativeOffset);
    auto leftColor = RCTUIColorFromSharedColor(leftSharedColor);
    auto rightColor = RCTUIColorFromSharedColor(rightSharedColor);
    NSArray<NSNumber *> *inputRange = @[ @0.0, @1.0 ];
    NSArray<UIColor *> *outputRange = @[ leftColor, rightColor ];

    for (auto &newStop : newStops) {
      auto pointRelativeOffset = (newStop.position.value() - offsetLeft) / totalDist;
      auto weighting = pow(pointRelativeOffset, logRatio);

      if (!std::isfinite(weighting) || std::isnan(weighting)) {
        continue;
      }

      auto interpolatedColor = RCTInterpolateColorInRange(weighting, inputRange, outputRange);

      auto alpha = (interpolatedColor >> 24) & 0xFF;
      auto red = (interpolatedColor >> 16) & 0xFF;
      auto green = (interpolatedColor >> 8) & 0xFF;
      auto blue = interpolatedColor & 0xFF;

      newStop.color = facebook::react::colorFromRGBA(red, green, blue, alpha);
    }

    // Replace the color hint with new color stops
    colorStops.erase(colorStops.begin() + x);
    colorStops.insert(colorStops.begin() + x, newStops.begin(), newStops.end());
    indexOffset += 8;
  }

  return colorStops;
}

// https://drafts.csswg.org/css-images-4/#color-stop-fixup
static std::vector<ProcessedColorStop> getFixedColorStops(
    const std::vector<ColorStop> &colorStops,
    CGFloat gradientLineLength)
{
  std::vector<ProcessedColorStop> fixedColorStops(colorStops.size());
  bool hasNullPositions = false;
  auto maxPositionSoFar = resolveColorStopPosition(colorStops[0].position, gradientLineLength);
  if (!maxPositionSoFar.has_value()) {
    maxPositionSoFar = 0.0f;
  }

  for (size_t i = 0; i < colorStops.size(); i++) {
    const auto &colorStop = colorStops[i];
    auto newPosition = resolveColorStopPosition(colorStop.position, gradientLineLength);

    if (!newPosition.has_value()) {
      // Step 1:
      // If the first color stop does not have a position,
      // set its position to 0%. If the last color stop does not have a position,
      // set its position to 100%.
      if (i == 0) {
        newPosition = 0.0f;
      } else if (i == colorStops.size() - 1) {
        newPosition = 1.0f;
      }
    }

    // Step 2:
    // If a color stop or transition hint has a position
    // that is less than the specified position of any color stop or transition hint
    // before it in the list, set its position to be equal to the
    // largest specified position of any color stop or transition hint before it.
    if (newPosition.has_value()) {
      newPosition = std::max(newPosition.value(), maxPositionSoFar.value());
      fixedColorStops[i] = ProcessedColorStop{colorStop.color, newPosition};
      maxPositionSoFar = newPosition;
    } else {
      hasNullPositions = true;
    }
  }

  // Step 3:
  // If any color stop still does not have a position,
  // then, for each run of adjacent color stops without positions,
  // set their positions so that they are evenly spaced between the preceding and
  // following color stops with positions.
  if (hasNullPositions) {
    size_t lastDefinedIndex = 0;
    for (size_t i = 1; i < fixedColorStops.size(); i++) {
      auto endPosition = fixedColorStops[i].position;
      if (endPosition.has_value()) {
        size_t unpositionedStops = i - lastDefinedIndex - 1;
        if (unpositionedStops > 0) {
          auto startPosition = fixedColorStops[lastDefinedIndex].position;
          if (startPosition.has_value()) {
            auto increment = (endPosition.value() - startPosition.value()) / (unpositionedStops + 1);
            for (size_t j = 1; j <= unpositionedStops; j++) {
              fixedColorStops[lastDefinedIndex + j] =
                  ProcessedColorStop{colorStops[lastDefinedIndex + j].color, startPosition.value() + increment * j};
            }
          }
        }
        lastDefinedIndex = i;
      }
    }
  }

  return fixedColorStops;
}

static std::optional<Float> resolveColorStopPosition(ValueUnit position, CGFloat gradientLineLength)
{
  if (position.unit == UnitType::Point) {
    return position.resolve(0.0f) / gradientLineLength;
  }

  if (position.unit == UnitType::Percent) {
    return position.resolve(1.0f);
  }

  return std::nullopt;
}

@end
