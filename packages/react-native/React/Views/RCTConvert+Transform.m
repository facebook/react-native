/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert+Transform.h"

static const NSUInteger kMatrixArrayLength = 4 * 4;

static NSArray* getTranslateForTransformOrigin(CGFloat viewWidth, CGFloat viewHeight, NSString *transformOrigin) {
  if (transformOrigin.length == 0 || (viewWidth == 0 && viewHeight == 0)) {
    return nil;
  }
  
  CGFloat viewCenterX = viewWidth / 2;
  CGFloat viewCenterY = viewHeight / 2;
  
  CGFloat origin[3] = {viewCenterX, viewCenterY, 0.0};

  NSArray *parts = [transformOrigin componentsSeparatedByString:@" "];
  for (NSInteger i = 0; i < parts.count && i < 3; i++) {
    NSString *part = parts[i];
    NSRange percentRange = [part rangeOfString:@"%"];
    BOOL isPercent = percentRange.location != NSNotFound;
    if (isPercent) {
      CGFloat val = [[part substringToIndex:percentRange.location] floatValue];
      origin[i] = (i == 0 ? viewWidth : viewHeight) * val / 100.0;
    } else if ([part isEqualToString:@"top"]) {
      origin[1] = 0.0;
    } else if ([part isEqualToString:@"bottom"]) {
      origin[1] = viewHeight;
    } else if ([part isEqualToString:@"left"]) {
      origin[0] = 0.0;
    } else if ([part isEqualToString:@"right"]) {
      origin[0] = viewWidth;
    } else if ([part isEqualToString:@"center"]) {
      continue;
    } else {
      origin[i] = [part floatValue];
    }
  }
  
  CGFloat newTranslateX = -viewCenterX + origin[0];
  CGFloat newTranslateY = -viewCenterY + origin[1];
  CGFloat newTranslateZ = origin[2];
     
  return @[@(newTranslateX), @(newTranslateY), @(newTranslateZ)];
}

@implementation RCTConvert (Transform)

+ (CGFloat)convertToRadians:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    if ([stringValue hasSuffix:@"deg"]) {
      CGFloat degrees = [[stringValue substringToIndex:stringValue.length - 3] floatValue];
      return degrees * M_PI / 180;
    }
    if ([stringValue hasSuffix:@"rad"]) {
      return [[stringValue substringToIndex:stringValue.length - 3] floatValue];
    }
  }
  return [json floatValue];
}

+ (CATransform3D)CATransform3DFromMatrix:(id)json
{
  CATransform3D transform = CATransform3DIdentity;
  if (!json) {
    return transform;
  }
  if (![json isKindOfClass:[NSArray class]]) {
    RCTLogConvertError(json, @"a CATransform3D. Expected array for transform matrix.");
    return transform;
  }
  if ([json count] != kMatrixArrayLength) {
    RCTLogConvertError(json, @"a CATransform3D. Expected 4x4 matrix array.");
    return transform;
  }
  for (NSUInteger i = 0; i < kMatrixArrayLength; i++) {
    ((CGFloat *)&transform)[i] = [RCTConvert CGFloat:json[i]];
  }
  return transform;
}

+ (CATransform3D)CATransform3D:(id)json
{
  CATransform3D transform = [self CATransform3D:json viewWidth:0 viewHeight:0 transformOrigin:nil];
  return transform;
}

@end
