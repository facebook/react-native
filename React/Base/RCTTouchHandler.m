/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTouchHandler.h"

#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
#import <UIKit/UIGestureRecognizerSubclass.h>
#endif // ]TODO(macOS ISS#2323203)

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTSurfaceView.h"
#import "RCTTouchEvent.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@interface RCTTouchHandler () <UIGestureRecognizerDelegate>
@end

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
  NSMutableOrderedSet *_nativeTouches; // TODO(macOS ISS#2323203)
  NSMutableArray<NSMutableDictionary *> *_reactTouches;
  NSMutableArray<RCTPlatformView *> *_touchViews; // TODO(macOS ISS#2323203)

  __weak UIView *_cachedRootView;

  uint16_t _coalescingKey;
#if TARGET_OS_OSX// [TODO(macOS ISS#2323203)
  BOOL _shouldSendMouseUpOnSystemBehalf;
#endif// ]TODO(macOS ISS#2323203)
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if ((self = [super initWithTarget:nil action:NULL])) {
    _eventDispatcher = [bridge moduleForClass:[RCTEventDispatcher class]];

    _nativeTouches = [NSMutableOrderedSet new];
    _reactTouches = [NSMutableArray new];
    _touchViews = [NSMutableArray new];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    // `cancelsTouchesInView` and `delaysTouches*` are needed in order to be used as a top level
    // event delegated recognizer. Otherwise, lower-level components not built
    // using RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO; // This is default value.
    self.delaysTouchesEnded = NO;
#else // [TODO(macOS ISS#2323203)
    self.delaysPrimaryMouseButtonEvents = NO; // default is NO.
    self.delaysSecondaryMouseButtonEvents = NO; // default is NO.
    self.delaysOtherMouseButtonEvents = NO; // default is NO.
#endif // ]TODO(macOS ISS#2323203)

    self.delegate = self;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithTarget:(id)target action:(SEL)action)
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)coder)
#endif // ]TODO(macOS ISS#2323203)

- (void)attachToView:(UIView *)view
{
  RCTAssert(self.view == nil, @"RCTTouchHandler already has attached view.");

  [view addGestureRecognizer:self];
}

- (void)detachFromView:(UIView *)view
{
  RCTAssertParam(view);
  RCTAssert(self.view == view, @"RCTTouchHandler attached to another view.");

  [view removeGestureRecognizer:self];
}

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet *)touches
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  for (UITouch *touch in touches) {
#else // [TODO(macOS ISS#2323203)
  for (NSEvent *touch in touches) {
#endif // ]TODO(macOS ISS#2323203)

    RCTAssert(![_nativeTouches containsObject:touch],
              @"Touch is already recorded. This is a critical bug.");

    // Find closest React-managed touchable view
    
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    UIView *targetView = touch.view;
    while (targetView) {
      if (targetView.reactTag && targetView.userInteractionEnabled) {
        break;
      }
      targetView = targetView.superview;
    }

    NSNumber *reactTag = [targetView reactTagAtPoint:[touch locationInView:targetView]];
    if (!reactTag || !targetView.userInteractionEnabled) {
      continue;
    }
#else // [TODO(macOS ISS#2323203)
    CGPoint touchLocation = [self.view convertPoint:touch.locationInWindow fromView:nil];
    NSView *targetView = [self.view hitTest:touchLocation];
    if ([targetView isKindOfClass:NSText.class]) {
      _shouldSendMouseUpOnSystemBehalf = [(NSText*)targetView isSelectable];
    } else {
      _shouldSendMouseUpOnSystemBehalf = NO;
    }
    touchLocation = [targetView convertPoint:touchLocation fromView:self.view];
    
    while (targetView) {
      BOOL isUserInteractionEnabled = NO;
      if ([((UIView*)targetView) respondsToSelector:@selector(isUserInteractionEnabled)]) {
        isUserInteractionEnabled = ((UIView*)targetView).isUserInteractionEnabled;
      }
      if (targetView.reactTag && isUserInteractionEnabled) {
        break;
      }
      targetView = targetView.superview;
    }

    NSNumber *reactTag = [targetView reactTagAtPoint:touchLocation];
    BOOL isUserInteractionEnabled = NO;
    if ([((UIView*)targetView) respondsToSelector:@selector(isUserInteractionEnabled)]) {
      isUserInteractionEnabled = ((UIView*)targetView).isUserInteractionEnabled;
    }
    if (!reactTag || !isUserInteractionEnabled) {
      continue;
    }
#endif // ]TODO(macOS ISS#2323203)

    // Get new, unique touch identifier for the react touch
    const NSUInteger RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_reactTouches.lastObject[@"identifier"] integerValue] + 1) % RCTMaxTouches;
    touchID = [self _eventWithNumber:touchID]; // TODO(macOS ISS#2323203)

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

// [TODO(macOS ISS#2323203)
- (NSInteger)_eventWithNumber:(NSInteger)touchID
{
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
  return touchID;
}
// ]TODO(macOS ISS#2323203)

- (void)_recordRemovedTouches:(NSSet *)touches
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
#else // [TODO(macOS ISS#2323203)
    for (NSEvent *touch in touches) {
      NSInteger index = [_nativeTouches indexOfObjectPassingTest:^BOOL(NSEvent *event, __unused NSUInteger idx, __unused BOOL *stop) {
        return touch.eventNumber == event.eventNumber;
      }];
#endif // ]TODO(macOS ISS#2323203)
    if (index == NSNotFound) {
      continue;
    }

    [_touchViews removeObjectAtIndex:index];
    [_nativeTouches removeObjectAtIndex:index];
    [_reactTouches removeObjectAtIndex:index];
  }
}

- (void)_updateReactTouchAtIndex:(NSInteger)touchIndex
{
#if !TARGET_OS_OSX  // TODO(macOS ISS#2323203)
  UITouch *nativeTouch = _nativeTouches[touchIndex];
  CGPoint windowLocation = [nativeTouch locationInView:nativeTouch.window];
  RCTAssert(_cachedRootView, @"We were unable to find a root view for the touch");
  CGPoint rootViewLocation = [nativeTouch.window convertPoint:windowLocation toView:_cachedRootView];

  UIView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [nativeTouch.window convertPoint:windowLocation toView:touchView];
#else // [TODO(macOS ISS#2323203)
  NSEvent *nativeTouch = _nativeTouches[touchIndex];
  CGPoint location = nativeTouch.locationInWindow;
  CGPoint rootViewLocation = CGPointMake(location.x, CGRectGetHeight(self.view.window.frame) - location.y);
  CGPoint touchViewLocation = rootViewLocation;
#endif // ]TODO(macOS ISS#2323203)

  NSMutableDictionary *reactTouch = _reactTouches[touchIndex];
  reactTouch[@"pageX"] = @(RCTSanitizeNaNValue(rootViewLocation.x, @"touchEvent.pageX"));
  reactTouch[@"pageY"] = @(RCTSanitizeNaNValue(rootViewLocation.y, @"touchEvent.pageY"));
  reactTouch[@"locationX"] = @(RCTSanitizeNaNValue(touchViewLocation.x, @"touchEvent.locationX"));
  reactTouch[@"locationY"] = @(RCTSanitizeNaNValue(touchViewLocation.y, @"touchEvent.locationY"));
  reactTouch[@"timestamp"] =  @(nativeTouch.timestamp * 1000); // in ms, for JS
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  // TODO: force for a 'normal' touch is usually 1.0;
  // should we expose a `normalTouchForce` constant somewhere (which would
  // have a value of `1.0 / nativeTouch.maximumPossibleForce`)?
  if (RCTForceTouchAvailable()) {
    if (@available(iOS 9.0, *)) { // TODO(OSS Candidate ISS#2710739)
      reactTouch[@"force"] = @(RCTZeroIfNaN(nativeTouch.force / nativeTouch.maximumPossibleForce));
    } else {
      reactTouch[@"force"] = @(0);
    }
  }
#else // [TODO(macOS ISS#2323203)
  NSEventModifierFlags modifierFlags = nativeTouch.modifierFlags;
  if (modifierFlags & NSEventModifierFlagShift) {
    reactTouch[@"shiftKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagControl) {
    reactTouch[@"ctrlKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagOption) {
    reactTouch[@"altKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagCommand) {
    reactTouch[@"metaKey"] = @YES;
  }
  
  NSEventType type = nativeTouch.type;
  if (type == NSEventTypeLeftMouseDown || type == NSEventTypeLeftMouseUp || type == NSEventTypeLeftMouseDragged) {
    reactTouch[@"button"] = @0;
  } else if (type == NSEventTypeRightMouseDown || type == NSEventTypeRightMouseUp || type == NSEventTypeRightMouseDragged) {
    reactTouch[@"button"] = @2;
  }
#endif // ]TODO(macOS ISS#2323203)
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
- (void)_updateAndDispatchTouches:(NSSet *)touches // TODO(macOS ISS#2323203)
                        eventName:(NSString *)eventName
{
  // Update touches
  NSMutableArray<NSNumber *> *changedIndexes = [NSMutableArray new];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
#else // [TODO(macOS ISS#2323203)
  for (NSEvent *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObjectPassingTest:^BOOL(NSEvent *event, __unused NSUInteger idx, __unused BOOL *stop) {
      return touch.eventNumber == event.eventNumber;
    }];
#endif // ]TODO(macOS ISS#2323203)
    
    if (index == NSNotFound) {
      continue;
    }
    
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
    _nativeTouches[index] = touch;
#endif // ]TODO(macOS ISS#2323203)

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

  BOOL canBeCoalesced = [eventName isEqualToString:@"touchMove"];

  // We increment `_coalescingKey` twice here just for sure that
  // this `_coalescingKey` will not be reused by another (preceding or following) event
  // (yes, even if coalescing only happens (and makes sense) on events of the same type).

  if (!canBeCoalesced) {
    _coalescingKey++;
  }

  RCTTouchEvent *event = [[RCTTouchEvent alloc] initWithEventName:eventName
                                                         reactTag:self.view.reactTag
                                                     reactTouches:reactTouches
                                                   changedIndexes:changedIndexes
                                                    coalescingKey:_coalescingKey];

  if (!canBeCoalesced) {
    _coalescingKey++;
  }

  [_eventDispatcher sendEvent:event];
}

/***
 * To ensure compatibilty when using UIManager.measure and RCTTouchHandler, we have to adopt
 * UIManager.measure's behavior in finding a "root view".
 * Usually RCTTouchHandler is already attached to a root view but in some cases (e.g. Modal),
 * we are instead attached to some RCTView subtree. This is also the case when embedding some RN
 * views inside a seperate ViewController not controlled by RN.
 * This logic will either find the nearest rootView, or go all the way to the UIWindow.
 * While this is not optimal, it is exactly what UIManager.measure does, and what Touchable.js
 * relies on.
 * We cache it here so that we don't have to repeat it for every touch in the gesture.
 */
- (void)_cacheRootView
{
  UIView *rootView = self.view;
  while (rootView.superview && ![rootView isReactRootView] && ![rootView isKindOfClass:[RCTSurfaceView class]]) {
    rootView = rootView.superview;
  }
  _cachedRootView = rootView;
}

#pragma mark - Gesture Recognizer Delegate Callbacks

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
static BOOL RCTAllTouchesAreCancelledOrEnded(NSSet *touches) // TODO(macOS ISS#2323203)
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

static BOOL RCTAnyTouchesChanged(NSSet *touches) // [TODO(macOS ISS#2323203)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan ||
        touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}
#endif // ]TODO(macOS ISS#2323203)

#pragma mark - `UIResponder`-ish touch-delivery methods

- (void)interactionsBegan:(NSSet *)touches  // TODO(macOS ISS#2323203)
{
  [self _cacheRootView];

  // "start" has to record new touches *before* extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];

  [self _updateAndDispatchTouches:touches eventName:@"touchStart"];

  if (self.state == UIGestureRecognizerStatePossible) {
    self.state = UIGestureRecognizerStateBegan;
  } else if (self.state == UIGestureRecognizerStateBegan) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)interactionsMoved:(NSSet *)touches // TODO(macOS ISS#2323203)
{
  [self _updateAndDispatchTouches:touches eventName:@"touchMove"];
  self.state = UIGestureRecognizerStateChanged;
}

- (void)interactionsEnded:(NSSet *)touches withEvent:(UIEvent*)event // TODO(macOS ISS#2323203)
{
  [self _updateAndDispatchTouches:touches eventName:@"touchEnd"];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateEnded;
  } else if (RCTAnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
#else // [TODO(macOS ISS#2323203)
  self.state = UIGestureRecognizerStateEnded;
#endif // ]TODO(macOS ISS#2323203)

  [self _recordRemovedTouches:touches];
}

- (void)interactionsCancelled:(NSSet *)touches withEvent:(UIEvent*)event // TODO(macOS ISS#2323203)
{
  [self _updateAndDispatchTouches:touches eventName:@"touchCancel"];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateCancelled;
  } else if (RCTAnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
#else // [TODO(macOS ISS#2323203)
  self.state = UIGestureRecognizerStateCancelled;
#endif // ]TODO(macOS ISS#2323203)
  
  [self _recordRemovedTouches:touches];
}
  
#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  [self interactionsBegan:touches];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  [self interactionsMoved:touches];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [self interactionsEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [self interactionsCancelled:touches withEvent:event];
}
#else
  
- (void)mouseDown:(NSEvent *)event
{
  [super mouseDown:event];
  [self interactionsBegan:[NSSet setWithObject:event]];
  // [TODO(macOS ISS#2323203)
  if (_shouldSendMouseUpOnSystemBehalf) {
    _shouldSendMouseUpOnSystemBehalf = NO;
    
    NSEvent *newEvent = [NSEvent mouseEventWithType:NSEventTypeLeftMouseUp
                                           location:[event locationInWindow]
                                      modifierFlags:[event modifierFlags]
                                          timestamp:[event timestamp]
                                       windowNumber:[event windowNumber]
                                            context:[event context]
                                        eventNumber:[event eventNumber]
                                         clickCount:[event clickCount]
                                           pressure:[event pressure]];
    [self interactionsEnded:[NSSet setWithObject:newEvent] withEvent:newEvent];
    // ]TODO(macOS ISS#2323203)
  }
}
  
- (void)rightMouseDown:(NSEvent *)event
{
  [super rightMouseDown:event];
  [self interactionsBegan:[NSSet setWithObject:event]];
}
  
- (void)mouseDragged:(NSEvent *)event
{
  [super mouseDragged:event];
  [self interactionsMoved:[NSSet setWithObject:event]];
}
  
- (void)rightMouseDragged:(NSEvent *)event
{
  [super rightMouseDragged:event];
  [self interactionsMoved:[NSSet setWithObject:event]];
}

- (void)mouseUp:(NSEvent *)event
{
  [super mouseUp:event];
  [self interactionsEnded:[NSSet setWithObject:event] withEvent:event];
}
  
- (void)rightMouseUp:(NSEvent *)event
{
  [super rightMouseUp:event];
  [self interactionsEnded:[NSSet setWithObject:event] withEvent:event];
}
  
#endif // ]TODO(macOS ISS#2323203)

- (BOOL)canPreventGestureRecognizer:(__unused UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  // We fail in favour of other external gesture recognizers.
  // iOS will ask `delegate`'s opinion about this gesture recognizer little bit later.
  return !UIViewIsDescendantOfView(preventingGestureRecognizer.view, self.view); // TODO(macOS ISS#2323203)
}

- (void)reset
{
  if (_nativeTouches.count != 0) {
    [self _updateAndDispatchTouches:_nativeTouches.set eventName:@"touchCancel"];

    [_nativeTouches removeAllObjects];
    [_reactTouches removeAllObjects];
    [_touchViews removeAllObjects];

    _cachedRootView = nil;
  }
}

#pragma mark - Other

- (void)cancel
{
  self.enabled = NO;
  self.enabled = YES;
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (void)willShowMenuWithEvent:(NSEvent*)event
{
  if (event.type == NSEventTypeRightMouseDown) {
    [self interactionsEnded:[NSSet setWithObject:event] withEvent:event];
  }
}
#endif // ]TODO(macOS ISS#2323203)

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(__unused UIGestureRecognizer *)gestureRecognizer shouldRequireFailureOfGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  // Same condition for `failure of` as for `be prevented by`.
  return [self canBePreventedByGestureRecognizer:otherGestureRecognizer];
}

@end
