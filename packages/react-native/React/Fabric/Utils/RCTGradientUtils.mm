/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTGradientUtils.h"
#import <React/RCTAnimationUtils.h>
#import <React/RCTConversions.h>
#import <react/utils/FloatComparison.h>
#import <vector>

using namespace facebook::react;

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

@implementation RCTGradientUtils
// https://drafts.csswg.org/css-images-4/#color-stop-fixup
+ (std::vector<ProcessedColorStop>)getFixedColorStops:(const std::vector<ColorStop> &)colorStops
                                   gradientLineLength:(CGFloat)gradientLineLength
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
  return processColorTransitionHints(fixedColorStops);
}
@end
