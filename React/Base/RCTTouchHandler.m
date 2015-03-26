/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTouchHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTLog.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"

// TODO: this class behaves a lot like a module, and could be implemented as a
// module if we were to assume that modules and RootViews had a 1:1 relationship

@interface RCTTouchEvent : NSObject

@property (nonatomic, assign, readonly) NSUInteger id;
@property (nonatomic, copy, readonly) NSString *eventName;
@property (nonatomic, copy, readonly) NSArray *touches;
@property (nonatomic, copy, readonly) NSArray *changedIndexes;
@property (nonatomic, assign, readonly) CFTimeInterval originatingTime;

@end


@implementation RCTTouchEvent

+ (instancetype)touchWithEventName:(NSString *)eventName touches:(NSArray *)touches changedIndexes:(NSArray *)changedIndexes originatingTime:(CFTimeInterval)originatingTime
{
  RCTTouchEvent *touchEvent = [[self alloc] init];
  touchEvent->_id = [self newID];
  touchEvent->_eventName = [eventName copy];
  touchEvent->_touches = [touches copy];
  touchEvent->_changedIndexes = [changedIndexes copy];
  touchEvent->_originatingTime = originatingTime;
  return touchEvent;
}

+ (NSUInteger)newID
{
  static NSUInteger id = 0;
  return ++id;
}

@end

@implementation RCTTouchHandler
{
  __weak RCTBridge *_bridge;

  /**
   * Arrays managed in parallel tracking native touch object along with the
   * native view that was touched, and the react touch data dictionary.
   * This must be kept track of because `UIKit` destroys the touch targets
   * if touches are canceled and we have no other way to recover this information.
   */
  NSMutableOrderedSet *_nativeTouches;
  NSMutableArray *_reactTouches;
  NSMutableArray *_touchViews;

  BOOL _recordingInteractionTiming;
  CFTimeInterval _mostRecentEnqueueJS;
  CADisplayLink *_displayLink;
  NSMutableArray *_pendingTouches;
  NSMutableArray *_bridgeInteractionTiming;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithTarget:nil action:NULL])) {

    RCTAssert(bridge != nil, @"Expect an event dispatcher");

    _bridge = bridge;

    _nativeTouches = [[NSMutableOrderedSet alloc] init];
    _reactTouches = [[NSMutableArray alloc] init];
    _touchViews = [[NSMutableArray alloc] init];

    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_update:)];
    _pendingTouches = [[NSMutableArray alloc] init];
    _bridgeInteractionTiming = [[NSMutableArray alloc] init];

    [_displayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];

    // `cancelsTouchesInView` is needed in order to be used as a top level event delegated recognizer. Otherwise, lower
    // level components not build using RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
  }
  return self;
}

- (BOOL)isValid
{
  return _displayLink != nil;
}

- (void)invalidate
{
  [_displayLink invalidate];
  _displayLink = nil;
}

typedef NS_ENUM(NSInteger, RCTTouchEventType) {
  RCTTouchEventTypeStart,
  RCTTouchEventTypeMove,
  RCTTouchEventTypeEnd,
  RCTTouchEventTypeCancel
};

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet *)touches
{
  for (UITouch *touch in touches) {

    RCTAssert(![_nativeTouches containsObject:touch],
              @"Touch is already recorded. This is a critical bug.");

    // Find closest React-managed touchable view
    UIView *targetView = touch.view;
    while (targetView) {
      if (targetView.reactTag && targetView.userInteractionEnabled &&
          [targetView reactRespondsToTouch:touch]) {
        break;
      }
      targetView = targetView.superview;
    }

    NSNumber *reactTag = [targetView reactTagAtPoint:[touch locationInView:targetView]];
    if (!reactTag || !targetView.userInteractionEnabled) {
      return;
    }

    // Get new, unique touch id
    const NSUInteger RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_reactTouches.lastObject[@"target"] integerValue] + 1) % RCTMaxTouches;
    for (NSDictionary *reactTouch in _reactTouches) {
      NSInteger usedID = [reactTouch[@"target"] integerValue];
      if (usedID == touchID) {
        // ID has already been used, try next value
        touchID ++;
      } else if (usedID > touchID) {
        // If usedID > touchID, touchID must be unique, so we can stop looking
        break;
      }
    }

    // Create touch
    NSMutableDictionary *reactTouch = [[NSMutableDictionary alloc] initWithCapacity:9];
    reactTouch[@"target"] = reactTag;
    reactTouch[@"identifier"] = @(touchID);
    reactTouch[@"touches"] = [NSNull null];        // We hijack this touchObj to serve both as an event
    reactTouch[@"changedTouches"] = [NSNull null]; // and as a Touch object, so making this JIT friendly.

    // Add to arrays
    [_touchViews addObject:targetView];
    [_nativeTouches addObject:touch];
    [_reactTouches addObject:reactTouch];
  }
}

- (void)_recordRemovedTouches:(NSSet *)touches
{
  for (UITouch *touch in touches) {
    NSUInteger index = [_nativeTouches indexOfObject:touch];
    if(index == NSNotFound) {
      continue;
    }

    [_touchViews removeObjectAtIndex:index];
    [_nativeTouches removeObjectAtIndex:index];
    [_reactTouches removeObjectAtIndex:index];
  }
}

- (void)_updateReactTouchAtIndex:(NSInteger)touchIndex
{
  UITouch *nativeTouch = _nativeTouches[touchIndex];
  CGPoint windowLocation = [nativeTouch locationInView:nativeTouch.window];
  CGPoint rootViewLocation = [nativeTouch.window convertPoint:windowLocation toView:self.view];

  UIView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [nativeTouch.window convertPoint:windowLocation toView:touchView];

  NSMutableDictionary *reactTouch = _reactTouches[touchIndex];
  reactTouch[@"pageX"] = @(rootViewLocation.x);
  reactTouch[@"pageY"] = @(rootViewLocation.y);
  reactTouch[@"locationX"] = @(touchViewLocation.x);
  reactTouch[@"locationY"] = @(touchViewLocation.y);
  reactTouch[@"timestamp"] =  @(nativeTouch.timestamp * 1000); // in ms, for JS
}

+ (NSArray *)JSMethods
{
  return @[@"RCTEventEmitter.receiveTouches"];
}

/**
 * Constructs information about touch events to send across the serialized
 * boundary. This data should be compliant with W3C `Touch` objects. This data
 * alone isn't sufficient to construct W3C `Event` objects. To construct that,
 * there must be a simple receiver on the other side of the bridge that
 * organizes the touch objects into `Event`s.
 *
 * We send the data as an array of `Touch`es, the type of action
 * (start/end/move/cancel) and the indices that represent "changed" `Touch`es
 * from that array.
 */
- (void)_updateAndDispatchTouches:(NSSet *)touches eventName:(NSString *)eventName originatingTime:(CFTimeInterval)originatingTime
{
  // Update touches
  CFTimeInterval enqueueTime = CACurrentMediaTime();
  NSMutableArray *changedIndexes = [[NSMutableArray alloc] init];
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
    if (index == NSNotFound) {
      continue;
    }

    [self _updateReactTouchAtIndex:index];
    [changedIndexes addObject:@(index)];
  }

  if (changedIndexes.count == 0) {
    return;
  }

  // Deep copy the touches because they will be accessed from another thread
  // TODO: would it be safer to do this in the bridge or executor, rather than trusting caller?
  NSMutableArray *reactTouches = [[NSMutableArray alloc] initWithCapacity:_reactTouches.count];
  for (NSDictionary *touch in _reactTouches) {
    [reactTouches addObject:[touch copy]];
  }

  RCTTouchEvent *touch = [RCTTouchEvent touchWithEventName:eventName
                                              touches:reactTouches
                                       changedIndexes:changedIndexes
                                      originatingTime:originatingTime];
  [_pendingTouches addObject:touch];

  if (_recordingInteractionTiming) {
    [_bridgeInteractionTiming addObject:@{
      @"timeSeconds": @(touch.originatingTime),
      @"operation": @"taskOriginated",
      @"taskID": @(touch.id),
    }];
    [_bridgeInteractionTiming addObject:@{
      @"timeSeconds": @(enqueueTime),
      @"operation": @"taskEnqueuedPending",
      @"taskID": @(touch.id),
    }];
  }
}

- (void)_update:(CADisplayLink *)sender
{
  // Dispatch touch event
  NSUInteger pendingCount = _pendingTouches.count;
  for (RCTTouchEvent *touch in _pendingTouches) {
    _mostRecentEnqueueJS = CACurrentMediaTime();
    [_bridge enqueueJSCall:@"RCTEventEmitter.receiveTouches"
                      args:@[touch.eventName, touch.touches, touch.changedIndexes]];
  }

  if (_recordingInteractionTiming) {
    for (RCTTouchEvent *touch in _pendingTouches) {
      [_bridgeInteractionTiming addObject:@{
        @"timeSeconds": @(sender.timestamp),
        @"operation": @"frameAlignedDispatch",
        @"taskID": @(touch.id),
      }];
    }

    if (pendingCount > 0 || sender.timestamp - _mostRecentEnqueueJS < 0.1) {
      [_bridgeInteractionTiming addObject:@{
        @"timeSeconds": @(sender.timestamp),
        @"operation": @"mainThreadDisplayLink",
        @"taskID": @([RCTTouchEvent newID]),
      }];
    }
  }

  [_pendingTouches removeAllObjects];
}

- (void)startOrResetInteractionTiming
{
  RCTAssertMainThread();
  [_bridgeInteractionTiming removeAllObjects];
  _recordingInteractionTiming = YES;
}

- (NSDictionary *)endAndResetInteractionTiming
{
  RCTAssertMainThread();
  _recordingInteractionTiming = NO;
  NSArray *_prevInteractionTimingData = _bridgeInteractionTiming;
  _bridgeInteractionTiming = [[NSMutableArray alloc] init];
  return @{ @"interactionTiming": _prevInteractionTimingData };
}

#pragma mark - Gesture Recognizer Delegate Callbacks

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  self.state = UIGestureRecognizerStateBegan;

  // "start" has to record new touches before extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];
  [self _updateAndDispatchTouches:touches eventName:@"topTouchStart" originatingTime:event.timestamp];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  if (self.state == UIGestureRecognizerStateFailed) {
    return;
  }
  [self _updateAndDispatchTouches:touches eventName:@"topTouchMove" originatingTime:event.timestamp];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [self _updateAndDispatchTouches:touches eventName:@"topTouchEnd" originatingTime:event.timestamp];
  [self _recordRemovedTouches:touches];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [self _updateAndDispatchTouches:touches eventName:@"topTouchCancel" originatingTime:event.timestamp];
  [self _recordRemovedTouches:touches];
}

- (BOOL)canPreventGestureRecognizer:(UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  return NO;
}

@end
