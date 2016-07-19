/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimationDriverNode.h"

#import <UIKit/UIKit.h>

#import "RCTAnimationUtils.h"
#import "RCTDefines.h"
#import "RCTValueAnimatedNode.h"

const double SINGLE_FRAME_INTERVAL = 1.0 / 60.0;

@implementation RCTAnimationDriverNode
{
  NSArray<NSNumber *> *_frames;
  CGFloat _toValue;
  CGFloat _fromValue;
  NSTimeInterval _delay;
  NSTimeInterval _animationStartTime;
  NSTimeInterval _animationCurrentTime;
  RCTValueAnimatedNode *_valueNode;
  RCTResponseSenderBlock _callback;
}

- (instancetype)initWithId:(nonnull NSNumber *)animationId
                     delay:(NSTimeInterval)delay
                   toValue:(CGFloat)toValue
                    frames:(nonnull NSArray<NSNumber *> *)frames
                   forNode:(nonnull RCTValueAnimatedNode *)valueNode
                  callBack:(nullable RCTResponseSenderBlock)callback
{
  if ((self = [super init])) {
    _animationId = animationId;
    _toValue = toValue;
    _fromValue = valueNode.value;
    _valueNode = valueNode;
    _delay = delay;
    _frames = [frames copy];
    _outputValue = @0;
    _callback = [callback copy];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)startAnimation
{
  _animationStartTime = CACurrentMediaTime();
  _animationCurrentTime = _animationStartTime;
  _animationHasBegun = YES;
}

- (void)stopAnimation
{
  _animationHasFinished = YES;
}

- (void)removeAnimation
{
  [self stopAnimation];
  _valueNode = nil;
  if (_callback) {
    _callback(@[@{
      @"finished": @(_animationHasFinished)
    }]);
  }
}

- (void)stepAnimation
{
  if (!_animationHasBegun || _animationHasFinished || _frames.count == 0) {
    // Animation has not begun or animation has already finished.
    return;
  }

  NSTimeInterval currentTime = CACurrentMediaTime();
  NSTimeInterval stepInterval = currentTime - _animationCurrentTime;
  _animationCurrentTime = currentTime;
  NSTimeInterval currentDuration = _animationCurrentTime - _animationStartTime;

  if (_delay > 0) {
    // Decrement delay
    _delay -= stepInterval;
    return;
  }

  // Determine how many frames have passed since last update.
  // Get index of frames that surround the current interval
  NSUInteger startIndex = floor(currentDuration / SINGLE_FRAME_INTERVAL);
  NSUInteger nextIndex = startIndex + 1;

  if (nextIndex >= _frames.count) {
    // We are at the end of the animation
    // Update value and flag animation has ended.
    NSNumber *finalValue = _frames.lastObject;
    [self updateOutputWithFrameOutput:finalValue.doubleValue];
    [self stopAnimation];
    return;
  }

  // Do a linear remap of the two frames to safegaurd against variable framerates
  NSNumber *fromFrameValue = _frames[startIndex];
  NSNumber *toFrameValue = _frames[nextIndex];
  NSTimeInterval fromInterval = startIndex * SINGLE_FRAME_INTERVAL;
  NSTimeInterval toInterval = nextIndex * SINGLE_FRAME_INTERVAL;

  // Interpolate between the individual frames to ensure the animations are
  //smooth and of the proper duration regardless of the framerate.
  CGFloat frameOutput = RCTInterpolateValue(currentDuration,
                                            fromInterval,
                                            toInterval,
                                            fromFrameValue.doubleValue,
                                            toFrameValue.doubleValue);

  [self updateOutputWithFrameOutput:frameOutput];
}

- (void)updateOutputWithFrameOutput:(CGFloat)frameOutput
{
  CGFloat outputValue = RCTInterpolateValue(frameOutput, 0, 1, _fromValue, _toValue);
  _outputValue = @(outputValue);
  _valueNode.value = outputValue;
  [_valueNode setNeedsUpdate];
}

- (void)cleanupAnimationUpdate
{
  [_valueNode cleanupAnimationUpdate];
}

@end
