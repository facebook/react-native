/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLinearGradient.h"

#import <React/RCTConversions.h>

using namespace facebook::react;

@implementation RCTLinearGradient

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const LinearGradient &)gradient
{
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size];
  const auto &direction = gradient.direction;
  const auto &colorStops = gradient.colorStops;

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

@end
