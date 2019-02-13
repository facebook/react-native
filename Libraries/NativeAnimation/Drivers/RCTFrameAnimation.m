/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFrameAnimation.h"

#import <UIKit/UIKit.h>

#import <React/RCTConvert.h>
#import <React/RCTDefines.h>

#import "RCTAnimationUtils.h"
#import "RCTValueAnimatedNode.h"

@interface RCTFrameAnimation ()

@property (nonatomic, strong) NSNumber *animationId;
@property (nonatomic, strong) RCTValueAnimatedNode *valueNode;
@property (nonatomic, assign) BOOL animationHasBegun;
@property (nonatomic, assign) BOOL animationHasFinished;

@end

@implementation RCTFrameAnimation
{
  NSArray<NSNumber *> *_frames;
  CGFloat _toValue;
  CGFloat _fromValue;
  CGFloat _lastPosition;
  NSTimeInterval _animationStartTime;
  NSTimeInterval _animationCurrentTime;
  RCTResponseSenderBlock _callback;
  NSInteger _iterations;
  NSInteger _currentLoop;
}

- (instancetype)initWithId:(NSNumber *)animationId
                    config:(NSDictionary *)config
                   forNode:(RCTValueAnimatedNode *)valueNode
                  callBack:(nullable RCTResponseSenderBlock)callback;
{
  if ((self = [super init])) {
    _animationId = animationId;
    _lastPosition = _fromValue = valueNode.value;
    _valueNode = valueNode;
    _callback = [callback copy];
    [self resetAnimationConfig:config];
  }
  return self;
}

- (void)resetAnimationConfig:(NSDictionary *)config
{
  NSNumber *toValue = [RCTConvert NSNumber:config[@"toValue"]] ?: @1;
  NSArray<NSNumber *> *frames = [RCTConvert NSNumberArray:config[@"frames"]];
  NSNumber *iterations = [RCTConvert NSNumber:config[@"iterations"]] ?: @1;

  _fromValue = _lastPosition;
  _toValue = toValue.floatValue;
  _frames = [frames copy];
  _animationStartTime = _animationCurrentTime = -1;
  _animationHasFinished = iterations.integerValue == 0;
  _iterations = iterations.integerValue;
  _currentLoop = 1;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)startAnimation
{
  _animationStartTime = _animationCurrentTime = -1;
  _animationHasBegun = YES;
}

- (void)stopAnimation
{
  _valueNode = nil;
  if (_callback) {
    _callback(@[@{
      @"finished": @(_animationHasFinished)
    }]);
  }
}

- (void)stepAnimationWithTime:(NSTimeInterval)currentTime
{
  if (!_animationHasBegun || _animationHasFinished || _frames.count == 0) {
    // Animation has not begun or animation has already finished.
    return;
  }

  if (_animationStartTime == -1) {
    _animationStartTime = _animationCurrentTime = currentTime;
  }

  _animationCurrentTime = currentTime;
  NSTimeInterval currentDuration = (_animationCurrentTime - _animationStartTime) / RCTAnimationDragCoefficient();

  // Determine how many frames have passed since last update.
  // Get index of frames that surround the current interval
  NSUInteger startIndex = floor(currentDuration / RCTSingleFrameInterval);
  NSUInteger nextIndex = startIndex + 1;

  if (nextIndex >= _frames.count) {
    if (_iterations == -1 || _currentLoop < _iterations) {
      // Looping, reset to the first frame value.
      _animationStartTime = currentTime;
      _currentLoop++;
      NSNumber *firstValue = _frames.firstObject;
      [self updateOutputWithFrameOutput:firstValue.doubleValue];
    } else {
      _animationHasFinished = YES;
      // We are at the end of the animation
      // Update value and flag animation has ended.
      NSNumber *finalValue = _frames.lastObject;
      [self updateOutputWithFrameOutput:finalValue.doubleValue];
    }
    return;
  }

  // Do a linear remap of the two frames to safeguard against variable framerates
  NSNumber *fromFrameValue = _frames[startIndex];
  NSNumber *toFrameValue = _frames[nextIndex];
  NSTimeInterval fromInterval = startIndex * RCTSingleFrameInterval;
  NSTimeInterval toInterval = nextIndex * RCTSingleFrameInterval;

  // Interpolate between the individual frames to ensure the animations are
  //smooth and of the proper duration regardless of the framerate.
  CGFloat frameOutput = RCTInterpolateValue(currentDuration,
                                            fromInterval,
                                            toInterval,
                                            fromFrameValue.doubleValue,
                                            toFrameValue.doubleValue,
                                            EXTRAPOLATE_TYPE_EXTEND,
                                            EXTRAPOLATE_TYPE_EXTEND);

  [self updateOutputWithFrameOutput:frameOutput];
}

- (void)updateOutputWithFrameOutput:(CGFloat)frameOutput
{
  CGFloat outputValue = RCTInterpolateValue(frameOutput,
                                            0,
                                            1,
                                            _fromValue,
                                            _toValue,
                                            EXTRAPOLATE_TYPE_EXTEND,
                                            EXTRAPOLATE_TYPE_EXTEND);

  _lastPosition = outputValue;
  _valueNode.value = outputValue;
  [_valueNode setNeedsUpdate];
}

@end
