/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTraitCollectionProxy.h"
#import <React/RCTUtils.h>
#import <mutex>

#import <React/RCTConstants.h>

@implementation RCTTraitCollectionProxy {
  BOOL _isObserving;
  std::mutex _mutex;
  UITraitCollection *_currentTraitCollection;
}

+ (instancetype)sharedInstance
{
  static RCTTraitCollectionProxy *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [RCTTraitCollectionProxy new];
  });
  return sharedInstance;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _isObserving = NO;
    _currentTraitCollection = [RCTKeyWindow().traitCollection copy];
  }
  return self;
}

- (void)startObservingTraitCollection
{
  RCTAssertMainQueue();
  std::lock_guard<std::mutex> lock(_mutex);
  if (!_isObserving) {
    _isObserving = YES;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_appearanceDidChange:)
                                                 name:RCTUserInterfaceStyleDidChangeNotification
                                               object:nil];
  }
}

- (UITraitCollection *)currentTraitCollection
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_isObserving) {
      return _currentTraitCollection;
    }
  }

  // Fallback in case [RCTTraitCollectionProxy startObservingTraitCollection] was not called.
  __block UITraitCollection *traitCollection = nil;
  RCTUnsafeExecuteOnMainQueueSync(^{
    traitCollection = [RCTKeyWindow().traitCollection copy];
  });
  return traitCollection;
}

- (void)_appearanceDidChange:(NSNotification *)notification
{
  std::lock_guard<std::mutex> lock(_mutex);

  NSDictionary *userInfo = [notification userInfo];
  if (userInfo) {
    _currentTraitCollection = userInfo[RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey];
  }
}

@end
