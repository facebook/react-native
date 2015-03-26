/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimationManager.h"

#import <UIKit/UIKit.h>

#import "RCTSparseArray.h"
#import "RCTUIManager.h"

#if CGFLOAT_IS_DOUBLE
  #define CG_APPEND(PREFIX, SUFFIX_F, SUFFIX_D) PREFIX##SUFFIX_D
#else
  #define CG_APPEND(PREFIX, SUFFIX_F, SUFFIX_D) PREFIX##SUFFIX_F
#endif

@implementation RCTAnimationManager
{
  RCTSparseArray *_animationRegistry; // Main thread only; animation tag -> view tag
}

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _animationRegistry = [[RCTSparseArray alloc] init];
  }

  return self;
}

- (id (^)(CGFloat))interpolateFrom:(CGFloat[])fromArray to:(CGFloat[])toArray count:(NSUInteger)count typeName:(const char *)typeName
{
  if (count == 1) {
    CGFloat from = *fromArray, to = *toArray, delta = to - from;
    return ^(CGFloat t) {
      return @(from + t * delta);
    };
  }

  CG_APPEND(vDSP_vsub,,D)(fromArray, 1, toArray, 1, toArray, 1, count);

  const size_t size = count * sizeof(CGFloat);
  NSData *deltaData = [NSData dataWithBytes:toArray length:size];
  NSData *fromData = [NSData dataWithBytes:fromArray length:size];

  return ^(CGFloat t) {
    const CGFloat *delta = deltaData.bytes;
    const CGFloat *_fromArray = fromData.bytes;

    CGFloat value[count];
    CG_APPEND(vDSP_vma,,D)(delta, 1, &t, 0, _fromArray, 1, value, 1, count);
    return [NSValue valueWithBytes:value objCType:typeName];
  };
}

- (void)startAnimationForTag:(NSNumber *)reactTag animationTag:(NSNumber *)animationTag duration:(double)duration delay:(double)delay easingSample:(NSArray *)easingSample properties:(NSDictionary *)properties
{
  RCT_EXPORT(startAnimation);

  __weak RCTAnimationManager *weakSelf = self;
  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTAnimationManager *strongSelf = weakSelf;

    UIView *view = viewRegistry[reactTag];
    if (!view) {
      RCTLogWarn(@"React tag %@ is not registered with the view registry", reactTag);
      return;
    }

    [properties enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
      NSValue *toValue = nil;
      if ([key isEqualToString:@"scaleXY"]) {
        key = @"transform.scale";
        toValue = obj[0];
      } else if ([obj respondsToSelector:@selector(count)]) {
        switch ([obj count]) {
          case 2:
            if (![obj respondsToSelector:@selector(objectForKeyedSubscript:)] || obj[@"x"]) {
              toValue = [NSValue valueWithCGPoint:[RCTConvert CGPoint:obj]];
            } else {
              toValue = [NSValue valueWithCGSize:[RCTConvert CGSize:obj]];
            }
            break;
          case 4:
            toValue = [NSValue valueWithCGRect:[RCTConvert CGRect:obj]];
            break;
          case 16:
            toValue = [NSValue valueWithCGAffineTransform:[RCTConvert CGAffineTransform:obj]];
            break;
        }
      }

      if (!toValue) toValue = obj;

      const char *typeName = toValue.objCType;

      size_t count;
      switch (typeName[0]) {
        case 'i':
        case 'I':
        case 's':
        case 'S':
        case 'l':
        case 'L':
        case 'q':
        case 'Q':
          count = 1;
          break;

        default: {
          NSUInteger size;
          NSGetSizeAndAlignment(typeName, &size, NULL);
          count = size / sizeof(CGFloat);
          break;
        }
      }

      CGFloat toFields[count];

      switch (typeName[0]) {
#define CASE(encoding, type) \
          case encoding: { \
            type value; \
            [toValue getValue:&value]; \
            toFields[0] = value; \
            break; \
          }

          CASE('i', int)
          CASE('I', unsigned int)
          CASE('s', short)
          CASE('S', unsigned short)
          CASE('l', long)
          CASE('L', unsigned long)
          CASE('q', long long)
          CASE('Q', unsigned long long)

#undef CASE

        default:
          [toValue getValue:toFields];
          break;
      }

      NSValue *fromValue = [view.layer.presentationLayer valueForKeyPath:key];
      CGFloat fromFields[count];
      [fromValue getValue:fromFields];

      id (^interpolationBlock)(CGFloat t) = [strongSelf interpolateFrom:fromFields to:toFields count:count typeName:typeName];

      NSMutableArray *sampledValues = [NSMutableArray arrayWithCapacity:easingSample.count];
      for (NSNumber *sample in easingSample) {
        CGFloat t = sample.CG_APPEND(, floatValue, doubleValue);
        [sampledValues addObject:interpolationBlock(t)];
      }

      CAKeyframeAnimation *animation = [CAKeyframeAnimation animationWithKeyPath:key];
      animation.beginTime = CACurrentMediaTime() + delay / 1000.0;
      animation.duration = duration / 1000.0;
      animation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
      animation.values = sampledValues;

      [view.layer setValue:toValue forKey:key];

      NSString *animationKey = [NSString stringWithFormat:@"RCT.%@.%@", animationTag, key];
      [view.layer addAnimation:animation forKey:animationKey];
    }];

    strongSelf->_animationRegistry[animationTag] = reactTag;
  }];
}

- (void)stopAnimation:(NSNumber *)animationTag
{
  RCT_EXPORT(stopAnimation);

  __weak RCTAnimationManager *weakSelf = self;
  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTAnimationManager *strongSelf = weakSelf;

    NSNumber *reactTag = strongSelf->_animationRegistry[animationTag];
    if (!reactTag) return;

    UIView *view = viewRegistry[reactTag];
    for (NSString *animationKey in view.layer.animationKeys) {
      if ([animationKey hasPrefix:@"RCT"]) {
        NSRange periodLocation = [animationKey rangeOfString:@"." options:0 range:(NSRange){3, animationKey.length - 3}];
        if (periodLocation.location != NSNotFound) {
          NSInteger integerTag = [[animationKey substringWithRange:(NSRange){3, periodLocation.location}] integerValue];
          if (animationTag.integerValue == integerTag) {
            [view.layer removeAnimationForKey:animationKey];
          }
        }
      }
    }

    strongSelf->_animationRegistry[animationTag] = nil;
  }];
}

@end
