/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimationExperimentalManager.h"

#import <UIKit/UIKit.h>

#import "RCTSparseArray.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"

#if CGFLOAT_IS_DOUBLE
  #define CG_APPEND(PREFIX, SUFFIX_F, SUFFIX_D) PREFIX##SUFFIX_D
#else
  #define CG_APPEND(PREFIX, SUFFIX_F, SUFFIX_D) PREFIX##SUFFIX_F
#endif

@implementation RCTAnimationExperimentalManager
{
  RCTSparseArray *_animationRegistry; // Main thread only; animation tag -> view tag
  RCTSparseArray *_callbackRegistry; // Main thread only; animation tag -> callback
  NSDictionary *_keypathMapping;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _animationRegistry = [[RCTSparseArray alloc] init];
    _callbackRegistry = [[RCTSparseArray alloc] init];
    _keypathMapping = @{
      @"opacity": @{
        @"keypath": @"opacity",
        @"type": @"NSNumber",
      },
      @"position": @{
        @"keypath": @"position",
        @"type": @"CGPoint",
      },
      @"positionX": @{
        @"keypath": @"position.x",
        @"type": @"NSNumber",
      },
      @"positionY": @{
        @"keypath": @"position.y",
        @"type": @"NSNumber",
      },
      @"rotation": @{
        @"keypath": @"transform.rotation.z",
        @"type": @"NSNumber",
      },
      @"scaleXY": @{
        @"keypath": @"transform.scale",
        @"type": @"CGPoint",
      },
    };
  }

  return self;
}

- (dispatch_queue_t)methodQueue
{
  return _bridge.uiManager.methodQueue;
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

static void RCTInvalidAnimationProp(RCTSparseArray *callbacks, NSNumber *tag, NSString *key, id value)
{
  RCTResponseSenderBlock callback = callbacks[tag];
  RCTLogError(@"Invalid animation property `%@ = %@`", key, value);
  if (callback) {
    callback(@[@NO]);
    callbacks[tag] = nil;
  }
  [CATransaction commit];
  return;
}

RCT_EXPORT_METHOD(startAnimation:(NSNumber *)reactTag
                  animationTag:(NSNumber *)animationTag
                  duration:(NSTimeInterval)duration
                  delay:(NSTimeInterval)delay
                  easingSample:(NSNumberArray *)easingSample
                  properties:(NSDictionary *)properties
                  callback:(RCTResponseSenderBlock)callback)
{
  __weak RCTAnimationExperimentalManager *weakSelf = self;
  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTAnimationExperimentalManager *strongSelf = weakSelf;

    UIView *view = viewRegistry[reactTag];
    if (!view) {
      RCTLogWarn(@"React tag #%@ is not registered with the view registry", reactTag);
      return;
    }
    __block BOOL completionBlockSet = NO;
    [CATransaction begin];
    for (NSString *prop in properties) {
      NSString *keypath = _keypathMapping[prop][@"keypath"];
      id obj = properties[prop][@"to"];
      if (!keypath) {
        return RCTInvalidAnimationProp(strongSelf->_callbackRegistry, animationTag, keypath, obj);
      }
      NSValue *toValue = nil;
      if ([keypath isEqualToString:@"transform.scale"]) {
        CGPoint point = [RCTConvert CGPoint:obj];
        if (point.x != point.y) {
          return RCTInvalidAnimationProp(strongSelf->_callbackRegistry, animationTag, keypath, obj);
        }
        toValue = @(point.x);
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
          default:
            return RCTInvalidAnimationProp(strongSelf->_callbackRegistry, animationTag, keypath, obj);
        }
      } else if (![obj respondsToSelector:@selector(objCType)]) {
        return RCTInvalidAnimationProp(strongSelf->_callbackRegistry, animationTag, keypath, obj);
      }
      if (!toValue) {
        toValue = obj;
      }
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

      NSValue *fromValue = [view.layer.presentationLayer valueForKeyPath:keypath];
#if !CGFLOAT_IS_DOUBLE
      if ([fromValue isKindOfClass:[NSNumber class]]) {
        fromValue = [NSNumber numberWithFloat:[(NSNumber *)fromValue doubleValue]];
      }
#endif
      CGFloat fromFields[count];
      [fromValue getValue:fromFields];

      id (^interpolationBlock)(CGFloat t) = [strongSelf interpolateFrom:fromFields to:toFields count:count typeName:typeName];

      NSMutableArray *sampledValues = [NSMutableArray arrayWithCapacity:easingSample.count];
      for (NSNumber *sample in easingSample) {
        CGFloat t = sample.CG_APPEND(, floatValue, doubleValue);
        [sampledValues addObject:interpolationBlock(t)];
      }
      CAKeyframeAnimation *animation = [CAKeyframeAnimation animationWithKeyPath:keypath];
      animation.beginTime = CACurrentMediaTime() + delay;
      animation.duration = duration;
      animation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
      animation.values = sampledValues;
      @try {
        [view.layer setValue:toValue forKey:keypath];
        NSString *animationKey = [@"RCT" stringByAppendingString:RCTJSONStringify(@{@"tag": animationTag, @"key": keypath}, nil)];
        if (!completionBlockSet) {
          strongSelf->_callbackRegistry[animationTag] = callback;
          [CATransaction setCompletionBlock:^{
            RCTResponseSenderBlock cb = strongSelf->_callbackRegistry[animationTag];
            if (cb) {
              cb(@[@YES]);
              strongSelf->_callbackRegistry[animationTag] = nil;
            }
          }];
          completionBlockSet = YES;
        }
        [view.layer addAnimation:animation forKey:animationKey];
      }
      @catch (NSException *exception) {
        return RCTInvalidAnimationProp(strongSelf->_callbackRegistry, animationTag, keypath, toValue);
      }
    }
    [CATransaction commit];
    strongSelf->_animationRegistry[animationTag] = reactTag;
  }];
}

RCT_EXPORT_METHOD(stopAnimation:(NSNumber *)animationTag)
{
  __weak RCTAnimationExperimentalManager *weakSelf = self;
  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTAnimationExperimentalManager *strongSelf = weakSelf;

    NSNumber *reactTag = strongSelf->_animationRegistry[animationTag];
    if (!reactTag) {
      return;
    }

    UIView *view = viewRegistry[reactTag];
    for (NSString *animationKey in view.layer.animationKeys) {
      if ([animationKey hasPrefix:@"RCT{"]) {
        NSDictionary *data = RCTJSONParse([animationKey substringFromIndex:3], nil);
        if (animationTag.integerValue == [data[@"tag"] integerValue]) {
          [view.layer removeAnimationForKey:animationKey];
        }
      }
    }
    RCTResponseSenderBlock cb = strongSelf->_callbackRegistry[animationTag];
    if (cb) {
      cb(@[@NO]);
      strongSelf->_callbackRegistry[animationTag] = nil;
    }
    strongSelf->_animationRegistry[animationTag] = nil;
  }];
}

- (NSDictionary *)constantsToExport
{
  return @{@"Properties": [_keypathMapping allKeys] };
}

@end
