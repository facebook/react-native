/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUIManagerObserverCoordinator.h"

#import "RCTUIManager.h"

@implementation RCTUIManagerObserverCoordinator {
  NSHashTable<id<RCTUIManagerObserver>> *_observers;
}

- (instancetype)init
{
  if (self = [super init]) {
    _observers = [[NSHashTable alloc] initWithOptions:NSHashTableWeakMemory capacity:0];
  }

  return self;
}

- (void)addObserver:(id<RCTUIManagerObserver>)observer
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self->_observers addObject:observer];
  });
}

- (void)removeObserver:(id<RCTUIManagerObserver>)observer
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self->_observers removeObject:observer];
  });
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformLayout:(RCTUIManager *)manager
{
  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformLayout:)]) {
      [observer uiManagerWillPerformLayout:manager];
    }
  }
}

- (void)uiManagerDidPerformLayout:(RCTUIManager *)manager
{
  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformLayout:)]) {
      [observer uiManagerDidPerformLayout:manager];
    }
  }
}

- (void)uiManagerWillFlushUIBlocks:(RCTUIManager *)manager
{
  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillFlushUIBlocks:)]) {
      [observer uiManagerWillFlushUIBlocks:manager];
    }
  }
}

@end
