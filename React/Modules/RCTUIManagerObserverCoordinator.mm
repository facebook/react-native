/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUIManagerObserverCoordinator.h"

#import <mutex>

#import "RCTUIManager.h"

@implementation RCTUIManagerObserverCoordinator {
  NSHashTable<id<RCTUIManagerObserver>> *_observers;
  std::mutex _mutex;
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
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<RCTUIManagerObserver>)observer
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers removeObject:observer];
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformLayout:(RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformLayout:)]) {
      [observer uiManagerWillPerformLayout:manager];
    }
  }
}

- (void)uiManagerDidPerformLayout:(RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformLayout:)]) {
      [observer uiManagerDidPerformLayout:manager];
    }
  }
}

- (void)uiManagerWillPerformMounting:(RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformMounting:)]) {
      [observer uiManagerWillPerformMounting:manager];
    }
  }
}

- (BOOL)uiManager:(RCTUIManager *)manager performMountingWithBlock:(RCTUIManagerMountingBlock)block
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManager:performMountingWithBlock:)]) {
      if ([observer uiManager:manager performMountingWithBlock:block]) {
        return YES;
      }
    }
  }
  return NO;
}

- (void)uiManagerDidPerformMounting:(RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformMounting:)]) {
      [observer uiManagerDidPerformMounting:manager];
    }
  }
}

@end
