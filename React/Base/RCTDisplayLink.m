/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDisplayLink.h"

#import <Foundation/Foundation.h>
#import <QuartzCore/CADisplayLink.h>

#import "RCTAssert.h"
#import "RCTBridgeModule.h"
#import "RCTFrameUpdate.h"
#import "RCTModuleData.h"
#import "RCTProfile.h"

@implementation RCTDisplayLink
{
  CADisplayLink *_jsDisplayLink;
  NSMutableSet<RCTModuleData *> *_frameUpdateObservers;
  NSRunLoop *_runLoop;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _frameUpdateObservers = [NSMutableSet new];
    _jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_jsThreadUpdate:)];
  }

  return self;
}

- (void)registerModuleForFrameUpdates:(id<RCTBridgeModule>)module
                       withModuleData:(RCTModuleData *)moduleData
{
  if ([_frameUpdateObservers containsObject:moduleData] ||
      ![moduleData.moduleClass conformsToProtocol:@protocol(RCTFrameUpdateObserver)]) {
    return;
  }

  [_frameUpdateObservers addObject:moduleData];
  // Don't access the module instance via moduleData, as this will cause deadlock
  id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)module;
  __weak typeof(self) weakSelf = self;
  observer.pauseCallback = ^{
    typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    CFRunLoopRef cfRunLoop = [strongSelf->_runLoop getCFRunLoop];

    if (!_runLoop) {
      return;
    }

    CFRunLoopPerformBlock(cfRunLoop, kCFRunLoopDefaultMode, ^{
                            [weakSelf updateJSDisplayLinkState];
                          });
    CFRunLoopWakeUp(cfRunLoop);
  };
}

- (void)addToRunLoop:(NSRunLoop *)runLoop
{
  _runLoop = runLoop;
  [_jsDisplayLink addToRunLoop:runLoop forMode:NSRunLoopCommonModes];
}

- (void)invalidate
{
  [_jsDisplayLink invalidate];
}

- (void)assertOnRunLoop
{
  RCTAssert(_runLoop == [NSRunLoop currentRunLoop],
            @"This method must be called on the CADisplayLink run loop");
}

- (void)dispatchBlock:(dispatch_block_t)block
                queue:(dispatch_queue_t)queue
{
  if (queue == RCTJSThread) {
    block();
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

- (void)_jsThreadUpdate:(CADisplayLink *)displayLink
{
  [self assertOnRunLoop];

  RCT_PROFILE_BEGIN_EVENT(0, @"-[RCTDisplayLink _jsThreadUpdate:]", nil);

  RCTFrameUpdate *frameUpdate = [[RCTFrameUpdate alloc] initWithDisplayLink:displayLink];
  for (RCTModuleData *moduleData in _frameUpdateObservers) {
    id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)moduleData.instance;
    if (!observer.paused) {
      RCTProfileBeginFlowEvent();

      [self dispatchBlock:^{
        RCTProfileEndFlowEvent();
        [observer didUpdateFrame:frameUpdate];
      } queue:moduleData.methodQueue];
    }
  }

  [self updateJSDisplayLinkState];

  RCTProfileImmediateEvent(0, @"JS Thread Tick", displayLink.timestamp, 'g');

  RCT_PROFILE_END_EVENT(0, @"objc_call", nil);
}

- (void)updateJSDisplayLinkState
{
  [self assertOnRunLoop];

  BOOL pauseDisplayLink = YES;
  for (RCTModuleData *moduleData in _frameUpdateObservers) {
    id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)moduleData.instance;
    if (!observer.paused) {
      pauseDisplayLink = NO;
      break;
    }
  }
  _jsDisplayLink.paused = pauseDisplayLink;
}

@end
