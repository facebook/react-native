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
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTTouchEvent.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"

// TODO: this class behaves a lot like a module, and could be implemented as a
// module if we were to assume that modules and RootViews had a 1:1 relationship
@implementation RCTTouchHandler
{
  __weak RCTEventDispatcher *_eventDispatcher;

  /**
   * Arrays managed in parallel tracking native touch object along with the
   * native view that was touched, and the React touch data dictionary.
   * These must be kept track of because `UIKit` destroys the touch targets
   * if touches are canceled, and we have no other way to recover this info.
   */
  NSMutableOrderedSet<UITouch *> *_nativeTouches;
  NSMutableArray<NSMutableDictionary *> *_reactTouches;
  NSMutableArray<UIView *> *_touchViews;

  BOOL _dispatchedInitialTouches;
  BOOL _recordingInteractionTiming;
  CFTimeInterval _mostRecentEnqueueJS;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if ((self = [super initWithTarget:self action:@selector(handleGestureUpdate:)])) {

    _eventDispatcher = [bridge moduleForClass:[RCTEventDispatcher class]];
    _dispatchedInitialTouches = NO;
    _nativeTouches = [NSMutableOrderedSet new];
    _reactTouches = [NSMutableArray new];
    _touchViews = [NSMutableArray new];

    // `cancelsTouchesInView` is needed in order to be used as a top level
    // event delegated recognizer. Otherwise, lower-level components not built
    // using RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithTarget:(id)target action:(SEL)action)

typedef NS_ENUM(NSInteger, RCTTouchEventType) {
  RCTTouchEventTypeStart,
  RCTTouchEventTypeMove,
  RCTTouchEventTypeEnd,
  RCTTouchEventTypeCancel
};

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet<UITouch *> *)touches
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

    // Get new, unique touch identifier for the react touch
    const NSUInteger RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_reactTouches.lastObject[@"identifier"] integerValue] + 1) % RCTMaxTouches;
    for (NSDictionary *reactTouch in _reactTouches) {
      NSInteger usedID = [reactTouch[@"identifier"] integerValue];
      if (usedID == touchID) {
        // ID has already been used, try next value
        touchID ++;
      } else if (usedID > touchID) {
        // If usedID > touchID, touchID must be unique, so we can stop looking
        break;
      }
    }

    // Create touch
    NSMutableDictionary *reactTouch = [[NSMutableDictionary alloc] initWithCapacity:RCTMaxTouches];
    reactTouch[@"target"] = reactTag;
    reactTouch[@"identifier"] = @(touchID);

    // Add to arrays
    [_touchViews addObject:targetView];
    [_nativeTouches addObject:touch];
    [_reactTouches addObject:reactTouch];
  }
}

- (void)_recordRemovedTouches:(NSSet<UITouch *> *)touches
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

  // TODO: force for a 'normal' touch is usually 1.0;
  // should we expose a `normalTouchForce` constant somewhere (which would
  // have a value of `1.0 / nativeTouch.maximumPossibleForce`)?
  if (RCTForceTouchAvailable()) {
    reactTouch[@"force"] = @(RCTZeroIfNaN(nativeTouch.force / nativeTouch.maximumPossibleForce));
  }
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
- (void)_updateAndDispatchTouches:(NSSet<UITouch *> *)touches
                        eventName:(NSString *)eventName
                  originatingTime:(__unused CFTimeInterval)originatingTime
{
  // Update touches
  NSMutableArray<NSNumber *> *changedIndexes = [NSMutableArray new];
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
  NSMutableArray<NSDictionary *> *reactTouches =
    [[NSMutableArray alloc] initWithCapacity:_reactTouches.count];
  for (NSDictionary *touch in _reactTouches) {
    [reactTouches addObject:[touch copy]];
  }

  RCTTouchEvent *event = [[RCTTouchEvent alloc] initWithEventName:eventName
                                                     reactTouches:reactTouches
                                                   changedIndexes:changedIndexes];
  [_eventDispatcher sendEvent:event];
}

#pragma mark - Gesture Recognizer Delegate Callbacks

static BOOL RCTAllTouchesAreCancelledOrEnded(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan ||
        touch.phase == UITouchPhaseMoved ||
        touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

static BOOL RCTAnyTouchesChanged(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan ||
        touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}

- (void)handleGestureUpdate:(__unused UIGestureRecognizer *)gesture
{
  // If gesture just recognized, send all touches to JS as if they just began.
  if (self.state == UIGestureRecognizerStateBegan) {
    [self _updateAndDispatchTouches:_nativeTouches.set eventName:@"topTouchStart" originatingTime:0];

    // We store this flag separately from `state` because after a gesture is
    // recognized, its `state` changes immediately but its action (this
    // method) isn't fired until dependent gesture recognizers have failed. We
    // only want to send move/end/cancel touches if we've sent the touchStart.
    _dispatchedInitialTouches = YES;
  }

  // For the other states, we could dispatch the updates here but since we
  // specifically send info about which touches changed, it's simpler to
  // dispatch the updates from the raw touch methods below.
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];

  // "start" has to record new touches before extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];
  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchStart" originatingTime:event.timestamp];
    self.state = UIGestureRecognizerStateChanged;
  } else {
    self.state = UIGestureRecognizerStateBegan;
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];

  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchMove" originatingTime:event.timestamp];
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];

  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchEnd" originatingTime:event.timestamp];

    if (RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
      self.state = UIGestureRecognizerStateEnded;
    } else if (RCTAnyTouchesChanged(event.allTouches)) {
      self.state = UIGestureRecognizerStateChanged;
    }
  }
  [self _recordRemovedTouches:touches];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];

  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchCancel" originatingTime:event.timestamp];

    if (RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
      self.state = UIGestureRecognizerStateCancelled;
    } else if (RCTAnyTouchesChanged(event.allTouches)) {
      self.state = UIGestureRecognizerStateChanged;
    }
  }
  [self _recordRemovedTouches:touches];
}

- (BOOL)canPreventGestureRecognizer:(__unused UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(__unused UIGestureRecognizer *)preventingGestureRecognizer
{
  return NO;
}

- (void)reset
{
  _dispatchedInitialTouches = NO;
}

- (void)cancel
{
  self.enabled = NO;
  self.enabled = YES;
}

@end
