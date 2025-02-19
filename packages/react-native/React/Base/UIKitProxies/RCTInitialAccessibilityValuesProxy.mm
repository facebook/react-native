/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInitialAccessibilityValuesProxy.h"
#import <React/RCTUtils.h>
#import <mutex>

@implementation RCTInitialAccessibilityValuesProxy {
  BOOL _hasRecordedInitialAccessibilityValues;
  BOOL _isBoldTextEnabled;
  BOOL _isGrayscaleEnabled;
  BOOL _isInvertColorsEnabled;
  BOOL _isReduceMotionEnabled;
  BOOL _isDarkerSystemColorsEnabled;
  BOOL _isReduceTransparencyEnabled;
  BOOL _isVoiceOverEnabled;
  UIContentSizeCategory _preferredContentSizeCategory;
  std::mutex _mutex;
}

+ (instancetype)sharedInstance
{
  static RCTInitialAccessibilityValuesProxy *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [RCTInitialAccessibilityValuesProxy new];
  });
  return sharedInstance;
}

- (BOOL)isBoldTextEnabled
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _isBoldTextEnabled;
    }
  }

  __block BOOL isBoldTextEnabled;
  RCTUnsafeExecuteOnMainQueueSync(^{
    isBoldTextEnabled = UIAccessibilityIsBoldTextEnabled();
  });

  return isBoldTextEnabled;
}

- (BOOL)isGrayscaleEnabled
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _isGrayscaleEnabled;
    }
  }

  __block BOOL isGrayscaleEnabled;
  RCTUnsafeExecuteOnMainQueueSync(^{
    isGrayscaleEnabled = UIAccessibilityIsGrayscaleEnabled();
  });

  return isGrayscaleEnabled;
}

- (BOOL)isInvertColorsEnabled
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _isInvertColorsEnabled;
    }
  }

  __block BOOL isInvertColorsEnabled;
  RCTUnsafeExecuteOnMainQueueSync(^{
    isInvertColorsEnabled = UIAccessibilityIsInvertColorsEnabled();
  });

  return isInvertColorsEnabled;
}

- (BOOL)isReduceMotionEnabled
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _isReduceMotionEnabled;
    }
  }

  __block BOOL isReduceMotionEnabled;
  RCTUnsafeExecuteOnMainQueueSync(^{
    isReduceMotionEnabled = UIAccessibilityIsReduceMotionEnabled();
  });

  return isReduceMotionEnabled;
}

- (BOOL)isDarkerSystemColorsEnabled
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _isDarkerSystemColorsEnabled;
    }
  }

  __block BOOL isDarkerSystemColorsEnabled;
  RCTUnsafeExecuteOnMainQueueSync(^{
    isDarkerSystemColorsEnabled = UIAccessibilityDarkerSystemColorsEnabled();
  });

  return isDarkerSystemColorsEnabled;
}

- (BOOL)isReduceTransparencyEnabled
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _isReduceTransparencyEnabled;
    }
  }

  __block BOOL isReduceTransparencyEnabled;
  RCTUnsafeExecuteOnMainQueueSync(^{
    isReduceTransparencyEnabled = UIAccessibilityIsReduceTransparencyEnabled();
  });

  return isReduceTransparencyEnabled;
}

- (BOOL)isVoiceOverEnabled
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _isVoiceOverEnabled;
    }
  }

  __block BOOL isVoiceOverEnabled;
  RCTUnsafeExecuteOnMainQueueSync(^{
    isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  });

  return isVoiceOverEnabled;
}

- (UIContentSizeCategory)preferredContentSizeCategory
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAccessibilityValues) {
      return _preferredContentSizeCategory;
    }
  }

  __block UIContentSizeCategory preferredContentSizeCategory;
  RCTUnsafeExecuteOnMainQueueSync(^{
    preferredContentSizeCategory = RCTSharedApplication().preferredContentSizeCategory;
  });

  return preferredContentSizeCategory;
}

- (void)recordAccessibilityValues
{
  std::lock_guard<std::mutex> lock(_mutex);
  _hasRecordedInitialAccessibilityValues = YES;
  _isBoldTextEnabled = UIAccessibilityIsBoldTextEnabled();
  _isGrayscaleEnabled = UIAccessibilityIsGrayscaleEnabled();
  _isInvertColorsEnabled = UIAccessibilityIsInvertColorsEnabled();
  _isReduceMotionEnabled = UIAccessibilityIsReduceMotionEnabled();
  _isDarkerSystemColorsEnabled = UIAccessibilityDarkerSystemColorsEnabled();
  _isReduceTransparencyEnabled = UIAccessibilityIsReduceTransparencyEnabled();
  _isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  _preferredContentSizeCategory = RCTSharedApplication().preferredContentSizeCategory;
}

@end
