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
#import "RCTAnimation.h"

const double SINGLE_FRAME_INTERVAL = 1.f / 60.f;

@interface RCTAnimationDriverNode ()

@property (nonatomic, copy) RCTResponseSenderBlock callback;

@end

@implementation RCTAnimationDriverNode {
  NSArray *_frames;
  double _delay;
  double _toValue;
  double _fromValue;
  double _animationStartTime;
  double _animationCurrentTime;
  double _animationEndTime;
  double _animationDuration;
  RCTValueAnimatedNode *_valueNode;
}

- (instancetype)initWithId:(nonnull NSNumber *)animationId
                     delay:(nullable NSNumber *)delay
                   toValue:(nonnull NSNumber *)toValue
                    frames:(nonnull NSArray *)frames
                   forNode:(nonnull RCTValueAnimatedNode *)valueNode
                  callBack:(nullable RCTResponseSenderBlock)callback {
  self = [super init];
  if (self) {
    _animationId = animationId;
    _toValue = toValue.doubleValue;
    _fromValue = valueNode.value.doubleValue;
    _valueNode = valueNode;
    _delay = delay ? delay.doubleValue : 0;
    _frames = [NSArray arrayWithArray:frames];
    _outputValue = @0;
    self.callback = callback;
  }
  return self;
}

- (void)startAnimation {
  _animationStartTime = CACurrentMediaTime();
  _animationCurrentTime = _animationStartTime;
  _animationHasBegun = YES;
}

- (void)stopAnimation {
  _animationHasFinished = true;
  _animationEndTime = CACurrentMediaTime();
  _animationDuration = _animationEndTime - _animationStartTime;
}

- (void)removeAnimation {
  [self stopAnimation];
  _valueNode = nil;
  if (self.callback) {
    self.callback(nil);
  }
}

- (void)stepAnimation {
  if (!self.animationHasBegun ||
      self.animationHasFinished ||
      _frames.count == 0) {
    // Animation has not begun or animation has already finished.
    return;
  }
  
  double currentTime = CACurrentMediaTime();
  double stepInterval = currentTime - _animationCurrentTime;
  _animationCurrentTime = currentTime;
  double currentDuration = _animationCurrentTime - _animationStartTime;
  
  
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
  double fromInterval = startIndex * SINGLE_FRAME_INTERVAL;
  double toInterval = nextIndex * SINGLE_FRAME_INTERVAL;
  // Interpolate between the individual frames to ensure the animations are
  //smooth and of the proper duration regardless of the framerate.
  double frameOutput = RemapValue(currentDuration, fromInterval, toInterval,
                                  fromFrameValue.doubleValue, toFrameValue.doubleValue);
  [self updateOutputWithFrameOutput:frameOutput];
}

- (void)updateOutputWithFrameOutput:(double)frameOutput {
  double outputValue = RemapValue(frameOutput, 0, 1, _fromValue, _toValue);
  _outputValue = @(outputValue);
  _valueNode.value = _outputValue;
  [_valueNode setNeedsUpdate];
}

- (void)cleanupAnimationUpdate {
  [_valueNode cleanupAnimationUpdate];
}

@end
