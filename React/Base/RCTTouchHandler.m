/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTouchHandler.h"

#if !TARGET_OS_OSX // [macOS]
#import <UIKit/UIGestureRecognizerSubclass.h>
#endif // [macOS]
#import <React/RCTUITextField.h> // [macOS]

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcherProtocol.h"
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
@implementation RCTTouchHandler {
  __weak id<RCTEventDispatcherProtocol> _eventDispatcher;

  /**
   * Arrays managed in parallel tracking native touch object along with the
   * native view that was touched, and the React touch data dictionary.
   * These must be kept track of because `UIKit` destroys the touch targets
   * if touches are canceled, and we have no other way to recover this info.
   */
  NSMutableOrderedSet *_nativeTouches; // [macOS]
  NSMutableArray<NSMutableDictionary *> *_reactTouches;
  NSMutableArray<RCTPlatformView *> *_touchViews; // [macOS]

  __weak RCTPlatformView *_cachedRootView;  // [macOS]

  uint16_t _coalescingKey;
#if TARGET_OS_OSX// [macOS
  BOOL _shouldSendMouseUpOnSystemBehalf;
#endif// macOS]
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if ((self = [super initWithTarget:nil action:NULL])) {
    _eventDispatcher = bridge.eventDispatcher;

    _nativeTouches = [NSMutableOrderedSet new];
    _reactTouches = [NSMutableArray new];
    _touchViews = [NSMutableArray new];

#if !TARGET_OS_OSX // [macOS]
    // `cancelsTouchesInView` and `delaysTouches*` are needed in order to be used as a top level
    // event delegated recognizer. Otherwise, lower-level components not built
    // using RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO; // This is default value.
    self.delaysTouchesEnded = NO;
#else // [macOS
    self.delaysPrimaryMouseButtonEvents = NO; // default is NO.
    self.delaysSecondaryMouseButtonEvents = NO; // default is NO.
    self.delaysOtherMouseButtonEvents = NO; // default is NO.
#endif // macOS]

    self.delegate = self;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)
#if TARGET_OS_OSX // [macOS
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)coder)
#endif // macOS]

- (void)attachToView:(RCTUIView *)view // [macOS]
{
  RCTAssert(self.view == nil, @"RCTTouchHandler already has attached view.");

  [view addGestureRecognizer:self];
}

- (void)detachFromView:(RCTUIView *)view // [macOS]
{
  RCTAssertParam(view);
  RCTAssert(self.view == view, @"RCTTouchHandler attached to another view.");

  [view removeGestureRecognizer:self];
}

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet *)touches
{
#if !TARGET_OS_OSX // [macOS]
  for (UITouch *touch in touches) {
#else // [macOS
  for (NSEvent *touch in touches) {
#endif // macOS]

    RCTAssert(![_nativeTouches containsObject:touch], @"Touch is already recorded. This is a critical bug.");

    // Find closest React-managed touchable view
    
#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
    // -[NSView hitTest:] takes coordinates in a view's superview coordinate system.
    // The assumption here is that a RCTUIView/RCTSurfaceView will always have a superview.
    CGPoint touchLocation = [self.view.superview convertPoint:touch.locationInWindow fromView:nil];
    NSView *targetView = [self.view hitTest:touchLocation];
    // Don't record clicks on scrollbars.
    if ([targetView isKindOfClass:[NSScroller class]]) {
      continue;
    }
    // Pair the mouse down events with mouse up events so our _nativeTouches cache doesn't get stale
    if ([targetView isKindOfClass:[NSControl class]]) {
      _shouldSendMouseUpOnSystemBehalf = [(NSControl*)targetView isEnabled];
    } else if ([targetView isKindOfClass:[NSText class]]) {
      _shouldSendMouseUpOnSystemBehalf = [(NSText*)targetView isSelectable];
    }
    else if ([targetView.superview isKindOfClass:[RCTUITextField class]]) {
      _shouldSendMouseUpOnSystemBehalf = [(RCTUITextField*)targetView.superview isSelectable];
    } else {
      _shouldSendMouseUpOnSystemBehalf = NO;
    }
    touchLocation = [targetView convertPoint:touchLocation fromView:self.view.superview];
    
    while (targetView) {
      BOOL isUserInteractionEnabled = NO;
      if ([((RCTUIView*)targetView) respondsToSelector:@selector(isUserInteractionEnabled)]) { // [macOS]
        isUserInteractionEnabled = ((RCTUIView*)targetView).isUserInteractionEnabled; // [macOS]
      }
      if (targetView.reactTag && isUserInteractionEnabled) {
        break;
      }
      targetView = targetView.superview;
    }

    NSNumber *reactTag = [targetView reactTagAtPoint:touchLocation];
    BOOL isUserInteractionEnabled = NO;
    if ([((RCTUIView*)targetView) respondsToSelector:@selector(isUserInteractionEnabled)]) { // [macOS]
      isUserInteractionEnabled = ((RCTUIView*)targetView).isUserInteractionEnabled; // [macOS]
    }
    if (!reactTag || !isUserInteractionEnabled) {
      continue;
    }
#endif // macOS]

    // Get new, unique touch identifier for the react touch
    const NSUInteger RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_reactTouches.lastObject[@"identifier"] integerValue] + 1) % RCTMaxTouches;
    for (NSDictionary *reactTouch in _reactTouches) {
      NSInteger usedID = [reactTouch[@"identifier"] integerValue];
      if (usedID == touchID) {
        // ID has already been used, try next value
        touchID++;
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

- (void)_recordRemovedTouches:(NSSet *)touches
{
#if !TARGET_OS_OSX // [macOS]
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
#else // [macOS
    for (NSEvent *touch in touches) {
      NSInteger index = [_nativeTouches indexOfObjectPassingTest:^BOOL(NSEvent *event, __unused NSUInteger idx, __unused BOOL *stop) {
        return touch.eventNumber == event.eventNumber;
      }];
#endif // macOS]
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
#if !TARGET_OS_OSX // [macOS]
  UITouch *nativeTouch = _nativeTouches[touchIndex];
  CGPoint windowLocation = [nativeTouch locationInView:nativeTouch.window];
  RCTAssert(_cachedRootView, @"We were unable to find a root view for the touch");
  CGPoint rootViewLocation = [nativeTouch.window convertPoint:windowLocation toView:_cachedRootView];

  UIView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [nativeTouch.window convertPoint:windowLocation toView:touchView];
#else // [macOS
  NSEvent *nativeTouch = _nativeTouches[touchIndex];
  CGPoint location = nativeTouch.locationInWindow;
  RCTAssert(_cachedRootView, @"We were unable to find a root view for the touch");
  CGPoint rootViewLocation = [_cachedRootView convertPoint:location fromView:nil];

  NSView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [touchView convertPoint:location fromView:nil];
#endif // macOS]

  NSMutableDictionary *reactTouch = _reactTouches[touchIndex];
  reactTouch[@"pageX"] = @(RCTSanitizeNaNValue(rootViewLocation.x, @"touchEvent.pageX"));
  reactTouch[@"pageY"] = @(RCTSanitizeNaNValue(rootViewLocation.y, @"touchEvent.pageY"));
  reactTouch[@"locationX"] = @(RCTSanitizeNaNValue(touchViewLocation.x, @"touchEvent.locationX"));
  reactTouch[@"locationY"] = @(RCTSanitizeNaNValue(touchViewLocation.y, @"touchEvent.locationY"));
  reactTouch[@"timestamp"] = @(nativeTouch.timestamp * 1000); // in ms, for JS

#if !TARGET_OS_OSX // [macOS]
  // TODO: force for a 'normal' touch is usually 1.0;
  // should we expose a `normalTouchForce` constant somewhere (which would
  // have a value of `1.0 / nativeTouch.maximumPossibleForce`)?
  if (RCTForceTouchAvailable()) {
    reactTouch[@"force"] = @(RCTZeroIfNaN(nativeTouch.force / nativeTouch.maximumPossibleForce));
  } else if (nativeTouch.type == UITouchTypePencil) {
    reactTouch[@"force"] = @(RCTZeroIfNaN(nativeTouch.force / nativeTouch.maximumPossibleForce));
    reactTouch[@"altitudeAngle"] = @(RCTZeroIfNaN(nativeTouch.altitudeAngle));
  }
#else // [macOS
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
#endif // macOS]
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
#if !TARGET_OS_OSX // [macOS]
- (void)_updateAndDispatchTouches:(NSSet<UITouch *> *)touches eventName:(NSString *)eventName
#else // [macOS
- (void)_updateAndDispatchTouches:(NSSet<NSEvent *> *)touches eventName:(NSString *)eventName
#endif // macOS]
{
  // Update touches
  NSMutableArray<NSNumber *> *changedIndexes = [NSMutableArray new];
#if !TARGET_OS_OSX // [macOS]
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
#else // [macOS
  for (NSEvent *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObjectPassingTest:^BOOL(NSEvent *event, __unused NSUInteger idx, __unused BOOL *stop) {
      return touch.eventNumber == event.eventNumber;
    }];
#endif // macOS]
    
    if (index == NSNotFound) {
      continue;
    }
    
#if TARGET_OS_OSX // [macOS
    _nativeTouches[index] = touch;
#endif // macOS]

    [self _updateReactTouchAtIndex:index];
    [changedIndexes addObject:@(index)];
  }

  if (changedIndexes.count == 0) {
    return;
  }

  // Deep copy the touches because they will be accessed from another thread
  // TODO: would it be safer to do this in the bridge or executor, rather than trusting caller?
  NSMutableArray<NSDictionary *> *reactTouches = [[NSMutableArray alloc] initWithCapacity:_reactTouches.count];
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
 * To ensure compatibility when using UIManager.measure and RCTTouchHandler, we have to adopt
 * UIManager.measure's behavior in finding a "root view".
 * Usually RCTTouchHandler is already attached to a root view but in some cases (e.g. Modal),
 * we are instead attached to some RCTView subtree. This is also the case when embedding some RN
 * views inside a separate ViewController not controlled by RN.
 * This logic will either find the nearest rootView, or go all the way to the UIWindow.
 * While this is not optimal, it is exactly what UIManager.measure does, and what Touchable.js
 * relies on.
 * We cache it here so that we don't have to repeat it for every touch in the gesture.
 */
- (void)_cacheRootView
{
  RCTPlatformView *rootView = self.view;  // [macOS]
  while (rootView.superview && ![rootView isReactRootView] && ![rootView isKindOfClass:[RCTSurfaceView class]]) {
    rootView = rootView.superview;
  }
  _cachedRootView = rootView;
}

#pragma mark - Gesture Recognizer Delegate Callbacks

#if !TARGET_OS_OSX // [macOS]
static BOOL RCTAllTouchesAreCancelledOrEnded(NSSet *touches) // [macOS]
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved || touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

static BOOL RCTAnyTouchesChanged(NSSet *touches) // [macOS]
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}
#endif // [macOS]

#pragma mark - `UIResponder`-ish touch-delivery methods

- (void)interactionsBegan:(NSSet *)touches  // [macOS]
{
  [self _cacheRootView];

  // "start" has to record new touches *before* extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];

  // [macOS Filter out touches that were ignored.
  touches = [touches objectsPassingTest:^(id touch, BOOL *stop) {
    return [_nativeTouches containsObject:touch];
  }]; // macOS]

  [self _updateAndDispatchTouches:touches eventName:@"touchStart"];

  if (self.state == UIGestureRecognizerStatePossible) {
    self.state = UIGestureRecognizerStateBegan;
  } else if (self.state == UIGestureRecognizerStateBegan) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)interactionsMoved:(NSSet *)touches // [macOS]
{
  [self _updateAndDispatchTouches:touches eventName:@"touchMove"];
  self.state = UIGestureRecognizerStateChanged;
}

- (void)interactionsEnded:(NSSet *)touches withEvent:(UIEvent*)event // [macOS]
{
  [self _updateAndDispatchTouches:touches eventName:@"touchEnd"];
#if !TARGET_OS_OSX // [macOS]
  if (RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateEnded;
  } else if (RCTAnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
#else // [macOS
  self.state = UIGestureRecognizerStateEnded;
#endif // macOS]

  [self _recordRemovedTouches:touches];
}

- (void)interactionsCancelled:(NSSet *)touches withEvent:(UIEvent*)event // [macOS]
{
  [self _updateAndDispatchTouches:touches eventName:@"touchCancel"];
#if !TARGET_OS_OSX // [macOS]
  if (RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateCancelled;
  } else if (RCTAnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
#else // [macOS
  self.state = UIGestureRecognizerStateCancelled;
#endif // macOS]
  
  [self _recordRemovedTouches:touches];
}
  
#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS

- (BOOL)acceptsFirstMouse:(NSEvent *)event
{
  // This will only be called if the hit-tested view returns YES for acceptsFirstMouse,
  // therefore asking it again would be redundant.
  return YES;
}

- (void)mouseDown:(NSEvent *)event
{
  [super mouseDown:event];
  [self interactionsBegan:[NSSet setWithObject:event]];
  // [macOS
  if (_shouldSendMouseUpOnSystemBehalf) {
    _shouldSendMouseUpOnSystemBehalf = NO;
    
    NSEvent *newEvent = [NSEvent mouseEventWithType:NSEventTypeLeftMouseUp
                                           location:[event locationInWindow]
                                      modifierFlags:[event modifierFlags]
                                          timestamp:[event timestamp]
                                       windowNumber:[event windowNumber]
                                            context:nil
                                        eventNumber:[event eventNumber]
                                         clickCount:[event clickCount]
                                           pressure:[event pressure]];
    [self interactionsEnded:[NSSet setWithObject:newEvent] withEvent:newEvent];
    // macOS]
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
  
#endif // macOS]

- (BOOL)canPreventGestureRecognizer:(__unused UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  // We fail in favour of other external gesture recognizers.
  // iOS will ask `delegate`'s opinion about this gesture recognizer little bit later.
  return !RCTUIViewIsDescendantOfView(preventingGestureRecognizer.view, self.view); // macOS 
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

#if TARGET_OS_OSX // [macOS
+ (instancetype)touchHandlerForEvent:(NSEvent *)event {
  // The window's frame view must be used for hit testing against `locationInWindow`
  NSView *hitView = [event.window.contentView.superview hitTest:event.locationInWindow];
  return [self touchHandlerForView:hitView];
}

+ (instancetype)touchHandlerForView:(NSView *)view {
  if ([view isKindOfClass:[RCTRootView class]]) {
    // The RCTTouchHandler is attached to the contentView.
    view = ((RCTRootView *)view).contentView;
  }

  while (view) {
    for (NSGestureRecognizer *gestureRecognizer in view.gestureRecognizers) {
      if ([gestureRecognizer isKindOfClass:[self class]]) {
        return (RCTTouchHandler *)gestureRecognizer;
      }
    }

    view = view.superview;
  }

  return nil;
}

- (void)willShowMenuWithEvent:(NSEvent *)event
{
  if (event.type == NSEventTypeRightMouseDown) {
    [self interactionsEnded:[NSSet setWithObject:event] withEvent:event];
  }
}
  
- (void)cancelTouchWithEvent:(NSEvent *)event
{
  [self interactionsCancelled:[NSSet setWithObject:event] withEvent:event];
}
#endif // macOS]

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(__unused UIGestureRecognizer *)gestureRecognizer
    shouldRequireFailureOfGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  // Same condition for `failure of` as for `be prevented by`.
  return [self canBePreventedByGestureRecognizer:otherGestureRecognizer];
}

@end
