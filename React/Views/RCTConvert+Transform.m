/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTConvert+Transform.h"

static const NSUInteger kMatrixArrayLength = 4 * 4;

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
  CATransform3D transform = CATransform3DIdentity;
  if (!json) {
    return transform;
  }
  if (![json isKindOfClass:[NSArray class]]) {
    RCTLogConvertError(json, @"a CATransform3D. Did you pass something other than an array?");
    return transform;
  }
  // legacy matrix support
  if ([(NSArray *)json count] == kMatrixArrayLength && [json[0] isKindOfClass:[NSNumber class]]) {
    RCTLogWarn(@"[RCTConvert CATransform3D:] has deprecated a matrix as input. Pass an array of configs (which can contain a matrix key) instead.");
    return [self CATransform3DFromMatrix:json];
  }

  CGFloat zeroScaleThreshold = FLT_EPSILON;

  for (NSDictionary *transformConfig in (NSArray<NSDictionary *> *)json) {
    if (transformConfig.count != 1) {
      RCTLogConvertError(json, @"a CATransform3D. You must specify exactly one property per transform object.");
      return transform;
    }
    NSString *property = transformConfig.allKeys[0];
    id value = transformConfig[property];

    if ([property isEqualToString:@"matrix"]) {
      transform = [self CATransform3DFromMatrix:value];

    } else if ([property isEqualToString:@"perspective"]) {
      transform.m34 = -1 / [value floatValue];

    } else if ([property isEqualToString:@"rotateX"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 1, 0, 0);

    } else if ([property isEqualToString:@"rotateY"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 0, 1, 0);

    } else if ([property isEqualToString:@"rotate"] || [property isEqualToString:@"rotateZ"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 0, 0, 1);

    } else if ([property isEqualToString:@"scale"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, scale, scale, 1);

    } else if ([property isEqualToString:@"scaleX"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, scale, 1, 1);

    } else if ([property isEqualToString:@"scaleY"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, 1, scale, 1);

    } else if ([property isEqualToString:@"translate"]) {
      NSArray *array = (NSArray<NSNumber *> *)value;
      CGFloat translateX = [array[0] floatValue];
      CGFloat translateY = [array[1] floatValue];
      CGFloat translateZ = array.count > 2 ? [array[2] floatValue] : 0;
      transform = CATransform3DTranslate(transform, translateX, translateY, translateZ);

    } else if ([property isEqualToString:@"translateX"]) {
      CGFloat translate = [value floatValue];
      transform = CATransform3DTranslate(transform, translate, 0, 0);

    } else if ([property isEqualToString:@"translateY"]) {
      CGFloat translate = [value floatValue];
      transform = CATransform3DTranslate(transform, 0, translate, 0);

    } else if ([property isEqualToString:@"skewX"]) {
      CGFloat skew = [self convertToRadians:value];
      transform.m21 = tanf(skew);

    } else if ([property isEqualToString:@"skewY"]) {
      CGFloat skew = [self convertToRadians:value];
      transform.m12 = tanf(skew);

    } else {
      RCTLogError(@"Unsupported transform type for a CATransform3D: %@.", property);
    }
  }
  return transform;
}

@end
