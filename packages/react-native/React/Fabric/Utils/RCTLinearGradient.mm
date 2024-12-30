/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLinearGradient.h"

#import <React/RCTConversions.h>
#import <React/RCTAnimationUtils.h>
#import <react/utils/FloatComparison.h>

using namespace facebook::react;

@implementation RCTLinearGradient

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const LinearGradient &)gradient
{
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size];
  const auto &direction = gradient.direction;
  const auto colorStops = processColorTransitionHints(gradient.colorStops);

  UIImage *gradientImage = [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull rendererContext) {
    CGContextRef context = rendererContext.CGContext;
    NSMutableArray *colors = [NSMutableArray array];
    CGFloat locations[colorStops.size()];

    for (size_t i = 0; i < colorStops.size(); ++i) {
      const auto &colorStop = colorStops[i];
      CGColorRef cgColor = RCTCreateCGColorRefFromSharedColor(colorStop.color);
      [colors addObject:(__bridge id)cgColor];
      locations[i] = colorStop.position;
    }

    CGGradientRef cgGradient = CGGradientCreateWithColors(NULL, (__bridge CFArrayRef)colors, locations);

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
// Algorithm is referred from Blink engine [source](https://github.com/chromium/chromium/blob/a296b1bad6dc1ed9d751b7528f7ca2134227b828/third_party/blink/renderer/core/css/css_gradient_value.cc#L240). 
static std::vector<ColorStop> processColorTransitionHints(const std::vector<ColorStop>& originalStops)
{
  std::vector<ColorStop> colorStops = originalStops;
  int indexOffset = 0;
  
  for (size_t i = 1; i < colorStops.size() - 1; i++) {
    auto &colorStop = colorStops[i];
    // Skip if not a color hint
    if (colorStop.color) {
      continue;
    }
    
    size_t x = i + indexOffset;
    if (x < 1) {
      continue;
    }
    
    Float offsetLeft = colorStops[x - 1].position;
    Float offsetRight = colorStops[x + 1].position;
    Float offset = colorStop.position;
    Float leftDist = offset - offsetLeft;
    Float rightDist = offsetRight - offset;
    Float totalDist = offsetRight - offsetLeft;
    SharedColor leftSharedColor = colorStops[x - 1].color;
    SharedColor rightSharedColor = colorStops[x + 1].color;

    if (facebook::react::floatEquality(leftDist, rightDist)) {
      colorStops.erase(colorStops.begin() + x);
      --indexOffset;
      continue;
    }
    
    if (facebook::react::floatEquality(leftDist, .0f)) {
      colorStop.color = rightSharedColor;
      continue;
    }
    
    if (facebook::react::floatEquality(rightDist, .0f)) {
      colorStop.color = leftSharedColor;
      continue;
    }
    
    std::vector<ColorStop> newStops;
    newStops.reserve(9);
    
    // Position the new color stops
    if (leftDist > rightDist) {
      for (int y = 0; y < 7; ++y) {
        ColorStop newStop{
          SharedColor(),
          offsetLeft + leftDist * ((7.0f + y) / 13.0f)
        };
        newStops.push_back(newStop);
      }
      ColorStop stop1{
        SharedColor(),
        offset + rightDist * (1.0f / 3.0f)
      };
      ColorStop stop2 {
        SharedColor(),
        offset + rightDist * (2.0f / 3.0f)
      };
      newStops.push_back(stop1);
      newStops.push_back(stop2);
    } else {
      ColorStop stop1 {
        SharedColor(),
        offsetLeft + leftDist * (1.0f / 3.0f)
      };
      ColorStop stop2 {
        SharedColor(),
        offsetLeft + leftDist * (2.0f / 3.0f)
      };
      newStops.push_back(stop1);
      newStops.push_back(stop2);
      for (int y = 0; y < 7; ++y) {
        ColorStop newStop {
          SharedColor(),
          offset + rightDist * (y / 13.0f)
        };
        newStops.push_back(newStop);
      }
    }
    
    // calculate colors for the new color hints.
    // The color weighting for the new color stops will be
    // pointRelativeOffset^(ln(0.5)/ln(hintRelativeOffset)).
    Float hintRelativeOffset = leftDist / totalDist;
    for (auto &newStop : newStops) {
      Float pointRelativeOffset = (newStop.position - offsetLeft) / totalDist;
      Float weighting = pow(
        pointRelativeOffset,
        log(0.5) / log(hintRelativeOffset)
      );
      
      if (!std::isfinite(weighting) || std::isnan(weighting)) {
        continue;
      }
      
      NSArray<NSNumber *> *inputRange = @[@0.0, @1.0];
      auto leftColor = RCTUIColorFromSharedColor(leftSharedColor);
      auto rightColor = RCTUIColorFromSharedColor(rightSharedColor);
      NSArray<UIColor *> *outputRange = @[leftColor, rightColor];
      
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

@end
