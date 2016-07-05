/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTConvert.h"
#import "RCTVibration.h"

#import <AudioToolbox/AudioToolbox.h>

@implementation RCTVibration {
  NSTimer *_timer;
  NSArray *_pattern;
  BOOL _repeat;
  BOOL _vibrating;
  NSUInteger _index;
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(vibrate)
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

RCT_EXPORT_METHOD(vibrateByPattern:(NSArray *)pattern
                  repeat:(BOOL)repeat
                  initialVibrate:(BOOL)initialVibrate)
{
  if (_vibrating) {
    return;
  }
  _vibrating = YES;
  _pattern = pattern;
  _repeat = repeat;
  _index = 0;
  if (initialVibrate) {
    [self vibrate];
  }
  [self vibrateDelayedWithInterval:
        [RCTConvert NSTimeInterval:_pattern[_index]] ?: 1.0];
}

RCT_EXPORT_METHOD(cancel)
{
  _vibrating = NO;
  [self deleteTimer];
}

- (void)vibrateDelayedWithInterval:(NSTimeInterval)interval
{
  if (_timer) {
    [self deleteTimer];
  }
  _timer =
    [NSTimer timerWithTimeInterval:interval
                                     target:self
                                   selector:@selector(_onTick:)
                                   userInfo:nil
                                    repeats:NO];
  [[NSRunLoop mainRunLoop] addTimer:_timer
                            forMode:NSRunLoopCommonModes];
}

- (void)_onTick:(NSTimer *)timer
{
  if (!_vibrating) {
    return;
  }

  [self vibrate];
  _index = _index + 1;

  if (_index >= [_pattern count]) {
    if (_repeat) {
      _index = 0;
    } else {
      [self cancel];
      return;
    }
  }
  [self vibrateDelayedWithInterval:
        [RCTConvert NSTimeInterval:_pattern[_index]] ?: 1.0];
}

- (void)deleteTimer
{
  if (_timer && _timer.valid) {
    [_timer invalidate];
  }
  _timer = nil;
}

- (void)dealloc
{
  [self deleteTimer];
}

@end
