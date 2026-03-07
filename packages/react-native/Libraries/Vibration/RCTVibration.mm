/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreHaptics/CoreHaptics.h>
#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTLog.h>
#import <React/RCTVibration.h>

#import "RCTVibrationPlugins.h"

@interface RCTVibration () <NativeVibrationSpec>
@end

@implementation RCTVibration {
  CHHapticEngine *_engine;
  id<CHHapticPatternPlayer> _player;
  NSLock *_lock;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    _lock = [[NSLock alloc] init];
  }
  return self;
}



- (CHHapticEngine *)ensureEngine
{
  [_lock lock];
  if (_engine) {
    [_lock unlock];
    return _engine;
  }

  NSError *error = nil;
  _engine = [[CHHapticEngine alloc] initAndReturnError:&error];

  if (error) {
    RCTLogWarn(@"Failed to create haptic engine: %@", error.localizedDescription);
    [_lock unlock];
    return nil;
  }

  _engine.playsHapticsOnly = YES;
  _engine.autoShutdownEnabled = YES;

  __weak RCTVibration *weakSelf = self;
  _engine.resetHandler = ^{
    RCTVibration *strongSelf = weakSelf;
    [strongSelf->_lock lock];
    [strongSelf->_engine startAndReturnError:nil];
    [strongSelf->_lock unlock];
  };

  _engine.stoppedHandler = ^(CHHapticEngineStoppedReason reason) {
    RCTVibration *strongSelf = weakSelf;
    [strongSelf->_lock lock];
    strongSelf->_engine = nil;
    [strongSelf->_lock unlock];
  };

  [_engine startAndReturnError:&error];
  if (error) {
    RCTLogWarn(@"Failed to start haptic engine: %@", error.localizedDescription);
    _engine = nil;
    [_lock unlock];
    return nil;
  }

  CHHapticEngine *engine = _engine;
  [_lock unlock];
  return engine;
}

- (void)stopCurrentPlayer
{
  [_lock lock];
  if (_player) {
    [_player stopAtTime:CHHapticTimeImmediate error:nil];
    _player = nil;
  }
  [_lock unlock];
}

- (CHHapticPattern *)hapticPatternFromArray:(NSArray<NSNumber *> *)pattern startIndex:(NSUInteger)startIndex
{
  if (startIndex >= pattern.count)
    return nil;

  NSMutableArray<CHHapticEvent *> *events = [NSMutableArray array];
  NSTimeInterval currentTime = 0;

  for (NSUInteger i = startIndex; i < pattern.count; i++) {
    double valueMs = [pattern[i] doubleValue];
    NSTimeInterval valueSeconds = MAX(valueMs, 0) / 1000.0;

    if (i % 2 == 0) {
      currentTime += valueSeconds;
    } else if (valueSeconds > 0) {
      CHHapticEventParameter *intensity =
          [[CHHapticEventParameter alloc] initWithParameterID:CHHapticEventParameterIDHapticIntensity value:1.0];
      CHHapticEventParameter *sharpness =
          [[CHHapticEventParameter alloc] initWithParameterID:CHHapticEventParameterIDHapticSharpness value:0.5];

      [events addObject:[[CHHapticEvent alloc] initWithEventType:CHHapticEventTypeHapticContinuous
                                                      parameters:@[ intensity, sharpness ]
                                                    relativeTime:currentTime
                                                        duration:valueSeconds]];
      currentTime += valueSeconds;
    }
  }

  if (events.count == 0)
    return nil;

  NSError *error = nil;
  CHHapticPattern *hapticPattern = [[CHHapticPattern alloc] initWithEvents:events parameters:@[] error:&error];
  if (error) {
    RCTLogWarn(@"Failed to create haptic pattern: %@", error.localizedDescription);
    return nil;
  }

  return hapticPattern;
}

- (void)_playPattern:(CHHapticPattern *)pattern isLooping:(BOOL)isLooping
{
  CHHapticEngine *engine = [self ensureEngine];
  if (!engine || !pattern)
    return;

  NSError *error = nil;
  id<CHHapticPatternPlayer> newPlayer;

  if (isLooping) {
    id<CHHapticAdvancedPatternPlayer> advPlayer = [engine createAdvancedPlayerWithPattern:pattern error:&error];
    advPlayer.loopEnabled = YES;
    newPlayer = advPlayer;
  } else {
    newPlayer = [engine createPlayerWithPattern:pattern error:&error];
  }

  if (!error && newPlayer) {
    [_lock lock];
    _player = newPlayer;
    [_player startAtTime:CHHapticTimeImmediate error:nil];
    [_lock unlock];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeVibrationSpecJSI>(params);
}

RCT_EXPORT_METHOD(vibrate : (double)durationMs)
{
  if (![CHHapticEngine capabilitiesForHardware].supportsHaptics)
    return;

  dispatch_async(dispatch_get_main_queue(), ^{
    [self stopCurrentPlayer];

    double duration = (durationMs <= 0) ? 400 : durationMs;
    CHHapticPattern *pattern = [self hapticPatternFromArray:@[ @0, @(duration) ] startIndex:0];
    [self _playPattern:pattern isLooping:NO];
  });
}

RCT_EXPORT_METHOD(vibrateByPattern : (NSArray<NSNumber *> *)pattern repeat : (double)repeat)
{
  if (![CHHapticEngine capabilitiesForHardware].supportsHaptics || pattern.count == 0)
    return;

  dispatch_async(dispatch_get_main_queue(), ^{
    [self stopCurrentPlayer];

    NSInteger repeatIndex = (NSInteger)repeat;
    BOOL shouldLoop = (repeatIndex >= 0 && repeatIndex < (NSInteger)pattern.count);

    if (!shouldLoop) {
      [self _playPattern:[self hapticPatternFromArray:pattern startIndex:0] isLooping:NO];
    } else if (repeatIndex == 0) {
      [self _playPattern:[self hapticPatternFromArray:pattern startIndex:0] isLooping:YES];
    } else {
      // Play prefix once, then loop the remainder
      CHHapticPattern *fullPattern = [self hapticPatternFromArray:pattern startIndex:0];
      if (!fullPattern)
        return;

      CHHapticEngine *engine = [self ensureEngine];
      NSError *error = nil;
      id<CHHapticAdvancedPatternPlayer> prefixPlayer = [engine createAdvancedPlayerWithPattern:fullPattern
                                                                                         error:&error];

      if (error || !prefixPlayer)
        return;

      __weak RCTVibration *weakSelf = self;
      prefixPlayer.completionHandler = ^(NSError *_Nullable err) {
        dispatch_async(dispatch_get_main_queue(), ^{
          RCTVibration *strongSelf = weakSelf;
          if (!strongSelf)
            return;

          [strongSelf->_lock lock];
          BOOL wasCancelled = (strongSelf->_player == nil);
          [strongSelf->_lock unlock];

          if (wasCancelled)
            return;

          CHHapticPattern *loopPart = [strongSelf hapticPatternFromArray:pattern startIndex:(NSUInteger)repeatIndex];
          [strongSelf _playPattern:loopPart isLooping:YES];
        });
      };

      [_lock lock];
      self->_player = prefixPlayer;
      [self->_player startAtTime:CHHapticTimeImmediate error:nil];
      [_lock unlock];
    }
  });
}

RCT_EXPORT_METHOD(cancel)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self stopCurrentPlayer];
  });
}

@end

Class RCTVibrationCls(void)
{
  return RCTVibration.class;
}
