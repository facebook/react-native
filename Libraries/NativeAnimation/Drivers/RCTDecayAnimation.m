/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDecayAnimation.h"

#import <UIKit/UIKit.h>
#import <React/RCTConvert.h>

#import "RCTValueAnimatedNode.h"

@interface RCTDecayAnimation ()

@property (nonatomic, strong) NSNumber *animationId;
@property (nonatomic, strong) RCTValueAnimatedNode *valueNode;
@property (nonatomic, assign) BOOL animationHasBegun;
@property (nonatomic, assign) BOOL animationHasFinished;

@end

@implementation RCTDecayAnimation
{
  CGFloat _velocity;
  CGFloat _deceleration;
  NSTimeInterval _frameStartTime;
  CGFloat _fromValue;
  CGFloat _lastValue;
  NSInteger _iterations;
  NSInteger _currentLoop;
  RCTResponseSenderBlock _callback;
}

- (instancetype)initWithId:(NSNumber *)animationId
                    config:(NSDictionary *)config
                   forNode:(RCTValueAnimatedNode *)valueNode
                  callBack:(nullable RCTResponseSenderBlock)callback;
{
  if ((self = [super init])) {
    _callback = [callback copy];
    _animationId = animationId;
    _valueNode = valueNode;
    _fromValue = 0;
    _lastValue = 0;
    _velocity = [RCTConvert CGFloat:config[@"velocity"]]; // initial velocity
    [self resetAnimationConfig:config];
  }
  return self;
}

- (void)resetAnimationConfig:(NSDictionary *)config
{
  NSNumber *iterations = [RCTConvert NSNumber:config[@"iterations"]] ?: @1;
  _fromValue = _lastValue;
  _deceleration = [RCTConvert CGFloat:config[@"deceleration"]];
  _iterations = iterations.integerValue;
  _currentLoop = 1;
  _animationHasFinished = iterations.integerValue == 0;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)startAnimation
{
  _frameStartTime = -1;
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
  if (!_animationHasBegun || _animationHasFinished) {
    // Animation has not begun or animation has already finished.
    return;
  }

  if (_frameStartTime == -1) {
    // Since this is the first animation step, consider the start to be on the previous frame.
    _frameStartTime = currentTime - RCTSingleFrameInterval;
    if (_fromValue == _lastValue) {
      // First iteration, assign _fromValue based on _valueNode.
      _fromValue = _valueNode.value;
    } else {
      // Not the first iteration, reset _valueNode based on _fromValue.
      [self updateValue:_fromValue];
    }
    _lastValue = _valueNode.value;
  }

  CGFloat value = _fromValue +
    (_velocity / (1 - _deceleration)) *
    (1 - exp(-(1 - _deceleration) * (currentTime - _frameStartTime) * 1000.0));

  [self updateValue:value];

  if (fabs(_lastValue - value) < 0.1) {
    if (_iterations == -1 || _currentLoop < _iterations) {
      // Set _frameStartTime to -1 to reset instance variables on the next runAnimationStep.
      _frameStartTime = -1;
      _currentLoop++;
    } else {
      _animationHasFinished = true;
      return;
    }
  }

  _lastValue = value;
}

- (void)updateValue:(CGFloat)outputValue
{
  _valueNode.value = outputValue;
  [_valueNode setNeedsUpdate];
}

@end
