/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWindowSafeAreaProxy.h"
#import <React/RCTAssert.h>
#import <React/RCTUtils.h>
#import <mutex>

#import <React/RCTConstants.h>

@implementation RCTWindowSafeAreaProxy {
  BOOL _isObserving;
  std::mutex _mutex;
  UIEdgeInsets _currentSafeAreaInsets;
}

+ (instancetype)sharedInstance
{
  static RCTWindowSafeAreaProxy *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [RCTWindowSafeAreaProxy new];
  });
  return sharedInstance;
}

- (void)startObservingSafeArea
{
  RCTAssertMainQueue();
  std::lock_guard<std::mutex> lock(_mutex);
  if (!_isObserving) {
    _isObserving = YES;
    _currentSafeAreaInsets = RCTKeyWindow().safeAreaInsets;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_interfaceFrameDidChange)
                                                 name:RCTUserInterfaceStyleDidChangeNotification
                                               object:nil];
  }
}

- (UIEdgeInsets)currentSafeAreaInsets
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_isObserving) {
      return _currentSafeAreaInsets;
    }
  }

  // Fallback in case [startObservingSafeArea startObservingSafeArea] was not called.
  __block UIEdgeInsets insets;
#if !TARGET_OS_MACCATALYST
  RCTUnsafeExecuteOnMainQueueSync(^{
    insets = [UIApplication sharedApplication].delegate.window.safeAreaInsets;
  });
#endif
  return insets;
}

- (void)_interfaceFrameDidChange
{
  std::lock_guard<std::mutex> lock(_mutex);
  _currentSafeAreaInsets = RCTKeyWindow().safeAreaInsets;
}

@end
