/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInitialAppStateProxy.h"
#import <React/RCTUtils.h>
#import <mutex>

#import <React/RCTConstants.h>

@implementation RCTInitialAppStateProxy {
  BOOL _hasRecordedInitialAppState;
  UIApplicationState _initialAppState;
  std::mutex _mutex;
}

+ (instancetype)sharedInstance
{
  static RCTInitialAppStateProxy *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [RCTInitialAppStateProxy new];
  });
  return sharedInstance;
}

- (UIApplicationState)initialAppState
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_hasRecordedInitialAppState) {
      return _initialAppState;
    }
  }

  __block UIApplicationState initialAppState;
  RCTUnsafeExecuteOnMainQueueSync(^{
    initialAppState = [UIApplication sharedApplication].applicationState;
  });

  return initialAppState;
}

- (void)recordAppState
{
  std::lock_guard<std::mutex> lock(_mutex);
  _hasRecordedInitialAppState = YES;
  _initialAppState = [UIApplication sharedApplication].applicationState;
}

@end
