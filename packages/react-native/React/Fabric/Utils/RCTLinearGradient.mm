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

+ (CALayer *)gradientLayerWithSize:(CGSize)size
                          gradient:(const LinearGradient&) gradient {
  
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size];
  auto direction = gradient.direction;
  auto colorStops = gradient.colorStops;
  
  UIImage *gradientImage = [renderer imageWithActions:^(UIGraphicsImageRendererContext * _Nonnull rendererContext) {
    CGContextRef context = rendererContext.CGContext;
    NSMutableArray *colors = [NSMutableArray array];
    CGFloat locations[colorStops.size()];
    
    for (size_t i = 0; i < colorStops.size(); ++i) {
      const auto &colorStop = colorStops[i];
      UIColor *color = RCTUIColorFromSharedColor(colorStop.color);
      [colors addObject:(id)color.CGColor];
      locations[i] = colorStop.position;
    }
    
    auto colorSpace = getDefaultColorSpace() == ColorSpace::sRGB ? CGColorSpaceCreateDeviceRGB() : CGColorSpaceCreateWithName(kCGColorSpaceDisplayP3);
    
    CGGradientRef cgGradient = CGGradientCreateWithColors(colorSpace, (__bridge CFArrayRef)colors, locations);
    
    CGPoint startPoint;
    CGPoint endPoint;
    
    if (direction.type == GradientDirectionType::Angle) {
      CGFloat angle = std::get<Float>(direction.value);
      setPointsFromAngle(angle, size, &startPoint, &endPoint);
    } else if (direction.type == GradientDirectionType::Keyword) {
      NSString *keyword = [NSString stringWithUTF8String:std::get<std::string>(direction.value).c_str()];
      CGFloat angle = getAngleForKeyword(keyword, size);
      setPointsFromAngle(angle, size, &startPoint, &endPoint);
    } else {
      // Default to top-to-bottom gradient
      startPoint = CGPointMake(0.0, 0.0);
      endPoint = CGPointMake(0.0, size.height);
    }
    
    CGContextDrawLinearGradient(context, cgGradient, startPoint, endPoint, 0);
    
    CGColorSpaceRelease(colorSpace);
    CGGradientRelease(cgGradient);
  }];
  
  CALayer *gradientLayer = [CALayer layer];
  gradientLayer.contents = (__bridge id)gradientImage.CGImage;
  
  return gradientLayer;
}


// Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
// Reference: https://github.com/chromium/chromium/blob/d32abbe13f5d52be7127fe25d5b778498165fab8/third_party/blink/renderer/core/css/css_gradient_value.cc#L1057
static void setPointsFromAngle(CGFloat angle, CGSize size, CGPoint *startPoint, CGPoint *endPoint) {
  angle = fmod(angle, 360.0);
  if (angle < 0) {
    angle += 360.0;
  }
  
  if (angle == 0.0) {
    *startPoint = CGPointMake(0, size.height);
    *endPoint = CGPointMake(0, 0);
    return;
  }
  if (angle == 90.0) {
    *startPoint = CGPointMake(0, 0);
    *endPoint = CGPointMake(size.width, 0);
    return;
  }
  if (angle == 180.0) {
    *startPoint = CGPointMake(0, 0);
    *endPoint = CGPointMake(0, size.height);
    return;
  }
  if (angle == 270.0) {
    *startPoint = CGPointMake(size.width, 0);
    *endPoint = CGPointMake(0, 0);
    return;
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
  
  *endPoint = CGPointMake(halfWidth + endX, halfHeight - endY);
  *startPoint = CGPointMake(halfWidth - endX, halfHeight + endY);
}

// Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
// Refer `using keywords` section
static CGFloat getAngleForKeyword(NSString *keyword, CGSize size) {
  if ([keyword isEqualToString:@"to top right"]) {
    CGFloat angleDeg = atan(size.width / size.height) * 180.0 / M_PI;
    return 90.0 - angleDeg;
  }
  if ([keyword isEqualToString:@"to bottom right"]) {
    return atan(size.width / size.height) * 180.0 / M_PI + 90.0;
  }
  if ([keyword isEqualToString:@"to top left"]) {
    return atan(size.width / size.height) * 180.0 / M_PI + 270.0;
  }
  if ([keyword isEqualToString:@"to bottom left"]) {
    return atan(size.height / size.width) * 180.0 / M_PI + 180.0;
  }
  
  return 180.0;
}


@end
