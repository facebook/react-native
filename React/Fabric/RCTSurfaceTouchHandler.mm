/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceTouchHandler.h"

#import <React/RCTUtils.h>
#import <React/RCTViewComponentView.h>
#import <UIKit/UIGestureRecognizerSubclass.h>

#import "RCTConversions.h"
#import "RCTTouchableComponentViewProtocol.h"

using namespace facebook::react;

template <size_t size>
class IdentifierPool {
 public:
  void enqueue(int index)
  {
    usage[index] = false;
  }

  int dequeue()
  {
    while (true) {
      if (!usage[lastIndex]) {
        usage[lastIndex] = true;
        return lastIndex;
      }
      lastIndex = (lastIndex + 1) % size;
    }
  }

  void reset()
  {
    for (int i = 0; i < size; i++) {
      usage[i] = false;
    }
  }

 private:
  bool usage[size];
  int lastIndex;
};

typedef NS_ENUM(NSInteger, RCTTouchEventType) {
  RCTTouchEventTypeTouchStart,
  RCTTouchEventTypeTouchMove,
  RCTTouchEventTypeTouchEnd,
  RCTTouchEventTypeTouchCancel,
};

struct ActiveTouch {
  Touch touch;
  SharedTouchEventEmitter eventEmitter;

  /*
   * The type of touch received.
   */
  UITouchType touchType;

  /*
   * The radius (in points) of the touch.
   */
  CGFloat majorRadius;

  /*
   * The altitude (in radians) of the stylus.
   */
  CGFloat altitudeAngle;

  /*
   * The azimuth angle (in radians) of the stylus.
   */
  CGFloat azimuthAngle;

  /*
   * The button mask of the touch
   */
  UIEventButtonMask buttonMask;

  /*
   * A component view on which the touch was begun.
   */
  __strong UIView<RCTComponentViewProtocol> *componentView = nil;

  struct Hasher {
    size_t operator()(const ActiveTouch &activeTouch) const
    {
      return std::hash<decltype(activeTouch.touch.identifier)>()(activeTouch.touch.identifier);
    }
  };

  struct Comparator {
    bool operator()(const ActiveTouch &lhs, const ActiveTouch &rhs) const
    {
      return lhs.touch.identifier == rhs.touch.identifier;
    }
  };
};

// Returns a CGPoint which represents the tiltX/Y values (in RADIANS)
// Adapted from https://gist.github.com/k3a/2903719bb42b48c9198d20c2d6f73ac1
static CGPoint SphericalToTilt(CGFloat altitudeAngleRad, CGFloat azimuthAngleRad)
{
  if (altitudeAngleRad == M_PI / 2.0) {
    return CGPointMake(0.0, 0.0);
  } else if (altitudeAngleRad == 0.0) {
    // when pen is laying on the pad it is impossible to precisely encode but at least approximate for 4 cases
    if (azimuthAngleRad > 7.0 * M_PI / 4.0 || azimuthAngleRad <= M_PI / 4.0) {
      // for azimuthRad == 0, the pen is on the positive Y axis
      return CGPointMake(0.0, M_PI / 2.0);
    } else if (azimuthAngleRad > M_PI / 4.0 && azimuthAngleRad <= 3 * M_PI / 4.0) {
      // for azimuthRad == math.pi/2 the pen is on the positive X axis
      return CGPointMake(M_PI / 2.0, 0.0);
    } else if (azimuthAngleRad > 3.0 * M_PI / 4.0 && azimuthAngleRad <= 5.0 * M_PI / 4.0) {
      // for azimuthRad == math.pi, the pen is on the negative Y axis
      return CGPointMake(0.0, -M_PI / 2.0);
    } else if (azimuthAngleRad > 5.0 * M_PI / 4.0 && azimuthAngleRad <= 7.0 * M_PI / 4.0) {
      // for azimuthRad == math.pi + math.pi/2 pen on negative X axis
      return CGPointMake(-M_PI / 2.0, 0.0);
    }
  }

  CGFloat tanAlt = tan(altitudeAngleRad); // tan(x) = sin(x)/cos(x)

  CGFloat tiltXrad = atan(sin(azimuthAngleRad) / tanAlt);
  CGFloat tiltYrad = atan(cos(azimuthAngleRad) / tanAlt);

  return CGPointMake(tiltXrad, tiltYrad);
}

static CGFloat RadsToDegrees(CGFloat rads)
{
  return rads * 180 / M_PI;
}

static int ButtonMaskToButtons(UIEventButtonMask buttonMask)
{
  if (@available(iOS 13.4, *)) {
    return (((buttonMask & UIEventButtonMaskPrimary) > 0) ? 1 : 0) |
        (((buttonMask & UIEventButtonMaskSecondary) > 0) ? 2 : 0);
  }
  return 0;
}

static void UpdateActiveTouchWithUITouch(
    ActiveTouch &activeTouch,
    UITouch *uiTouch,
    UIEvent *uiEvent,
    UIView *rootComponentView,
    CGPoint rootViewOriginOffset)
{
  CGPoint offsetPoint = [uiTouch locationInView:activeTouch.componentView];
  CGPoint screenPoint = [uiTouch locationInView:uiTouch.window];
  CGPoint pagePoint = [uiTouch locationInView:rootComponentView];
  pagePoint = CGPointMake(pagePoint.x + rootViewOriginOffset.x, pagePoint.y + rootViewOriginOffset.y);

  activeTouch.touch.offsetPoint = RCTPointFromCGPoint(offsetPoint);
  activeTouch.touch.screenPoint = RCTPointFromCGPoint(screenPoint);
  activeTouch.touch.pagePoint = RCTPointFromCGPoint(pagePoint);

  activeTouch.touch.timestamp = uiTouch.timestamp;

  if (RCTForceTouchAvailable()) {
    activeTouch.touch.force = RCTZeroIfNaN(uiTouch.force / uiTouch.maximumPossibleForce);
  }

  activeTouch.touchType = uiTouch.type;
  activeTouch.majorRadius = uiTouch.majorRadius;
  activeTouch.altitudeAngle = uiTouch.altitudeAngle;
  activeTouch.azimuthAngle = [uiTouch azimuthAngleInView:nil];
  if (@available(iOS 13.4, *)) {
    activeTouch.buttonMask = uiEvent.buttonMask;
  } else {
    activeTouch.buttonMask = 0;
  }
}

static ActiveTouch
CreateTouchWithUITouch(UITouch *uiTouch, UIEvent *uiEvent, UIView *rootComponentView, CGPoint rootViewOriginOffset)
{
  ActiveTouch activeTouch = {};

  // Find closest Fabric-managed touchable view
  UIView *componentView = uiTouch.view;
  while (componentView) {
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      activeTouch.eventEmitter = [(id<RCTTouchableComponentViewProtocol>)componentView
          touchEventEmitterAtPoint:[uiTouch locationInView:componentView]];
      activeTouch.touch.target = (Tag)componentView.tag;
      activeTouch.componentView = componentView;
      break;
    }
    componentView = componentView.superview;
  }

  UpdateActiveTouchWithUITouch(activeTouch, uiTouch, uiEvent, rootComponentView, rootViewOriginOffset);
  return activeTouch;
}

static UIView *FindClosestFabricManagedTouchableView(UIView *componentView)
{
  while (componentView) {
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      return componentView;
    }
    componentView = componentView.superview;
  }
  return nil;
}

static NSOrderedSet *GetTouchableViewsInPathToRoot(UIView *componentView)
{
  NSMutableOrderedSet *results = [NSMutableOrderedSet orderedSet];
  do {
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      [results addObject:componentView];
    }
    componentView = componentView.superview;
  } while (componentView);
  return results;
}

static SharedTouchEventEmitter GetTouchEmitterFromView(UIView *componentView, CGPoint point)
{
  return [(id<RCTTouchableComponentViewProtocol>)componentView touchEventEmitterAtPoint:point];
}

static const char *PointerTypeCStringFromUITouchType(UITouchType type)
{
  switch (type) {
    case UITouchTypeDirect:
      return "touch";
    case UITouchTypePencil:
      return "pen";
    case UITouchTypeIndirectPointer:
      return "mouse";
    case UITouchTypeIndirect:
    default:
      return "";
  }
}

static PointerEvent CreatePointerEventFromActiveTouch(ActiveTouch activeTouch, RCTTouchEventType eventType)
{
  Touch touch = activeTouch.touch;

  PointerEvent event = {};
  event.pointerId = touch.identifier;
  event.pressure = touch.force;
  event.pointerType = PointerTypeCStringFromUITouchType(activeTouch.touchType);
  event.clientPoint = touch.pagePoint;

  CGFloat pointerSize = activeTouch.majorRadius * 2.0;
  if (@available(iOS 13.4, *)) {
    if (activeTouch.touchType == UITouchTypeIndirectPointer) {
      // mouse type pointers should always report a size of 1
      pointerSize = 1.0;
    }
  }
  event.width = pointerSize;
  event.height = pointerSize;

  CGPoint tilt = SphericalToTilt(activeTouch.altitudeAngle, activeTouch.azimuthAngle);
  event.tiltX = RadsToDegrees(tilt.x);
  event.tiltY = RadsToDegrees(tilt.y);

  event.detail = 0;

  event.buttons = ButtonMaskToButtons(activeTouch.buttonMask);
  // UIEvent's button mask for touch end events still marks the button as down
  // so this ensures it's set to 0 as per the pointer event spec
  if (eventType == RCTTouchEventTypeTouchEnd) {
    event.buttons = 0;
  }

  return event;
}

static PointerEvent
CreatePointerEventFromIncompleteHoverData(UIView *view, CGPoint clientLocation, NSTimeInterval timestamp)
{
  PointerEvent event = {};
  // "touch" events produced from a mouse cursor on iOS always have the ID 0 so
  // we can just assume that here since these sort of hover events only ever come
  // from the mouse
  event.pointerId = 0;
  event.pressure = 0.0;
  event.pointerType = "mouse";
  event.clientPoint = RCTPointFromCGPoint(clientLocation);
  event.width = 1.0;
  event.height = 1.0;
  event.tiltX = 0;
  event.tiltY = 0;
  event.detail = 0;
  event.buttons = 0;
  return event;
}

static BOOL AllTouchesAreCancelledOrEnded(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved || touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

static BOOL AnyTouchesChanged(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}

static BOOL IsViewListeningToEvent(UIView *view, ViewEvents::Offset eventType)
{
  if ([view.class conformsToProtocol:@protocol(RCTComponentViewProtocol)]) {
    auto props = ((id<RCTComponentViewProtocol>)view).props;
    if (SharedViewProps viewProps = std::dynamic_pointer_cast<ViewProps const>(props)) {
      return viewProps->events[eventType];
    }
  }
  return NO;
}

static BOOL IsAnyViewInPathListeningToEvent(NSOrderedSet<UIView *> *viewPath, ViewEvents::Offset eventType)
{
  for (UIView *view in viewPath) {
    if (IsViewListeningToEvent(view, eventType)) {
      return YES;
    }
  }
  return NO;
}

/**
 * Surprisingly, `__unsafe_unretained id` pointers are not regular pointers
 * and `std::hash<>` cannot hash them.
 * This is quite trivial but decent implementation of hasher function
 * inspired by this research: https://stackoverflow.com/a/21062520/496389.
 */
template <typename PointerT>
struct PointerHasher {
  constexpr std::size_t operator()(const PointerT &value) const
  {
    return reinterpret_cast<size_t>(value);
  }
};

@interface RCTSurfaceTouchHandler () <UIGestureRecognizerDelegate>
@end

@implementation RCTSurfaceTouchHandler {
  std::unordered_map<__unsafe_unretained UITouch *, ActiveTouch, PointerHasher<__unsafe_unretained UITouch *>>
      _activeTouches;

  /*
   * We hold the view weakly to prevent a retain cycle.
   */
  __weak UIView *_rootComponentView;
  IdentifierPool<11> _identifierPool;

  UIHoverGestureRecognizer *_hoverRecognizer API_AVAILABLE(ios(13.0));
  NSOrderedSet *_currentlyHoveredViews;
}

- (instancetype)init
{
  if (self = [super initWithTarget:nil action:nil]) {
    // `cancelsTouchesInView` and `delaysTouches*` are needed in order
    // to be used as a top level event delegated recognizer.
    // Otherwise, lower-level components not built using React Native,
    // will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO; // This is default value.
    self.delaysTouchesEnded = NO;

    self.delegate = self;

    _hoverRecognizer = nil;
    _currentlyHoveredViews = [NSOrderedSet orderedSet];
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)

- (void)attachToView:(UIView *)view
{
  RCTAssert(self.view == nil, @"RCTTouchHandler already has attached view.");

  [view addGestureRecognizer:self];
  _rootComponentView = view;

  if (RCTGetDispatchW3CPointerEvents()) {
    if (@available(iOS 13.0, *)) {
      _hoverRecognizer = [[UIHoverGestureRecognizer alloc] initWithTarget:self action:@selector(hovering:)];
      [view addGestureRecognizer:_hoverRecognizer];
    }
  }
}

- (void)detachFromView:(UIView *)view
{
  RCTAssertParam(view);
  RCTAssert(self.view == view, @"RCTTouchHandler attached to another view.");

  [view removeGestureRecognizer:self];
  _rootComponentView = nil;

  if (_hoverRecognizer != nil) {
    [view removeGestureRecognizer:_hoverRecognizer];
    _hoverRecognizer = nil;
  }
}

- (void)_registerTouches:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  for (UITouch *touch in touches) {
    auto activeTouch = CreateTouchWithUITouch(touch, event, _rootComponentView, _viewOriginOffset);
    activeTouch.touch.identifier = _identifierPool.dequeue();
    _activeTouches.emplace(touch, activeTouch);
  }
}

- (void)_updateTouches:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  for (UITouch *touch in touches) {
    auto iterator = _activeTouches.find(touch);
    assert(iterator != _activeTouches.end() && "Inconsistency between local and UIKit touch registries");
    if (iterator == _activeTouches.end()) {
      continue;
    }

    UpdateActiveTouchWithUITouch(iterator->second, touch, event, _rootComponentView, _viewOriginOffset);
  }
}

- (void)_unregisterTouches:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    auto iterator = _activeTouches.find(touch);
    assert(iterator != _activeTouches.end() && "Inconsistency between local and UIKit touch registries");
    if (iterator == _activeTouches.end()) {
      continue;
    }
    auto &activeTouch = iterator->second;
    _identifierPool.enqueue(activeTouch.touch.identifier);
    _activeTouches.erase(touch);
  }
}

- (std::vector<ActiveTouch>)_activeTouchesFromTouches:(NSSet<UITouch *> *)touches
{
  std::vector<ActiveTouch> activeTouches;
  activeTouches.reserve(touches.count);

  for (UITouch *touch in touches) {
    auto iterator = _activeTouches.find(touch);
    assert(iterator != _activeTouches.end() && "Inconsistency between local and UIKit touch registries");
    if (iterator == _activeTouches.end()) {
      continue;
    }
    activeTouches.push_back(iterator->second);
  }

  return activeTouches;
}

- (void)_dispatchActiveTouches:(std::vector<ActiveTouch>)activeTouches eventType:(RCTTouchEventType)eventType
{
  TouchEvent event = {};
  std::unordered_set<ActiveTouch, ActiveTouch::Hasher, ActiveTouch::Comparator> changedActiveTouches = {};
  std::unordered_set<SharedTouchEventEmitter> uniqueEventEmitters = {};
  BOOL isEndishEventType = eventType == RCTTouchEventTypeTouchEnd || eventType == RCTTouchEventTypeTouchCancel;

  for (const auto &activeTouch : activeTouches) {
    if (!activeTouch.eventEmitter) {
      continue;
    }

    changedActiveTouches.insert(activeTouch);
    event.changedTouches.insert(activeTouch.touch);
    uniqueEventEmitters.insert(activeTouch.eventEmitter);

    // emit w3c pointer events
    if (RCTGetDispatchW3CPointerEvents()) {
      PointerEvent pointerEvent = CreatePointerEventFromActiveTouch(activeTouch, eventType);
      switch (eventType) {
        case RCTTouchEventTypeTouchStart:
          activeTouch.eventEmitter->onPointerDown(pointerEvent);
          break;
        case RCTTouchEventTypeTouchMove:
          activeTouch.eventEmitter->onPointerMove(pointerEvent);
          break;
        case RCTTouchEventTypeTouchEnd:
          activeTouch.eventEmitter->onPointerUp(pointerEvent);
          break;
        case RCTTouchEventTypeTouchCancel:
          activeTouch.eventEmitter->onPointerCancel(pointerEvent);
          break;
      }
    }
  }

  for (const auto &pair : _activeTouches) {
    if (!pair.second.eventEmitter) {
      continue;
    }

    if (isEndishEventType && event.changedTouches.find(pair.second.touch) != event.changedTouches.end()) {
      continue;
    }

    event.touches.insert(pair.second.touch);
  }

  for (const auto &eventEmitter : uniqueEventEmitters) {
    event.targetTouches.clear();

    for (const auto &pair : _activeTouches) {
      if (pair.second.eventEmitter == eventEmitter) {
        event.targetTouches.insert(pair.second.touch);
      }
    }

    switch (eventType) {
      case RCTTouchEventTypeTouchStart:
        eventEmitter->onTouchStart(event);
        break;
      case RCTTouchEventTypeTouchMove:
        eventEmitter->onTouchMove(event);
        break;
      case RCTTouchEventTypeTouchEnd:
        eventEmitter->onTouchEnd(event);
        break;
      case RCTTouchEventTypeTouchCancel:
        eventEmitter->onTouchCancel(event);
        break;
    }
  }
}

#pragma mark - `UIResponder`-ish touch-delivery methods

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];

  [self _registerTouches:touches withEvent:event];
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchStart];

  if (self.state == UIGestureRecognizerStatePossible) {
    self.state = UIGestureRecognizerStateBegan;
  } else if (self.state == UIGestureRecognizerStateBegan) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];

  [self _updateTouches:touches withEvent:event];
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchMove];

  self.state = UIGestureRecognizerStateChanged;
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];

  [self _updateTouches:touches withEvent:event];
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchEnd];
  [self _unregisterTouches:touches];

  if (AllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateEnded;
  } else if (AnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];

  [self _updateTouches:touches withEvent:event];
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchCancel];
  [self _unregisterTouches:touches];

  if (AllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateCancelled;
  } else if (AnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)reset
{
  [super reset];

  if (!_activeTouches.empty()) {
    std::vector<ActiveTouch> activeTouches;
    activeTouches.reserve(_activeTouches.size());

    for (auto const &pair : _activeTouches) {
      activeTouches.push_back(pair.second);
    }

    [self _dispatchActiveTouches:activeTouches eventType:RCTTouchEventTypeTouchCancel];

    // Force-unregistering all the touches.
    _activeTouches.clear();
    _identifierPool.reset();
  }
}

- (BOOL)canPreventGestureRecognizer:(__unused UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  // We fail in favour of other external gesture recognizers.
  // iOS will ask `delegate`'s opinion about this gesture recognizer little bit later.
  return ![preventingGestureRecognizer.view isDescendantOfView:self.view];
}

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(__unused UIGestureRecognizer *)gestureRecognizer
    shouldRequireFailureOfGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  // Same condition for `failure of` as for `be prevented by`.
  return [self canBePreventedByGestureRecognizer:otherGestureRecognizer];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  BOOL canBePrevented = [self canBePreventedByGestureRecognizer:otherGestureRecognizer];
  if (canBePrevented) {
    [self _cancelTouches];
  }
  return NO;
}

#pragma mark -

- (void)_cancelTouches
{
  [self setEnabled:NO];
  [self setEnabled:YES];
}

- (void)hovering:(UIHoverGestureRecognizer *)recognizer API_AVAILABLE(ios(13.0))
{
  UIView *listenerView = recognizer.view;
  CGPoint clientLocation = [recognizer locationInView:listenerView];

  UIView *targetView = [listenerView hitTest:clientLocation withEvent:nil];
  targetView = FindClosestFabricManagedTouchableView(targetView);
  UIView *prevTargetView = [_currentlyHoveredViews firstObject];

  NSOrderedSet *eventPathViews = GetTouchableViewsInPathToRoot(targetView);

  NSTimeInterval timestamp = CACurrentMediaTime();

  BOOL hasMoveListenerInEventPath = NO;

  // Over
  if (prevTargetView != targetView) {
    BOOL shouldEmitOverEvent = IsAnyViewInPathListeningToEvent(eventPathViews, ViewEvents::Offset::PointerOver);
    SharedTouchEventEmitter eventEmitter = GetTouchEmitterFromView(targetView, [recognizer locationInView:targetView]);
    if (shouldEmitOverEvent && eventEmitter != nil) {
      PointerEvent event = CreatePointerEventFromIncompleteHoverData(targetView, clientLocation, timestamp);
      eventEmitter->onPointerOver(event);
    }
  }

  // Entering

  // We only want to emit events to JS if there is a view that is currently listening to said event
  // so we only send those event to the JS side if the element which has been entered is itself listening,
  // or if one of its parents is listening in case those listeners care about the capturing phase. Adding the ability
  // for native to distingusih between capturing listeners and not could be an optimization to futher reduce the number
  // of events we send to JS
  BOOL hasParentEnterListener = NO;

  for (UIView *componentView in [eventPathViews reverseObjectEnumerator]) {
    BOOL shouldEmitEvent =
        hasParentEnterListener || IsViewListeningToEvent(componentView, ViewEvents::Offset::PointerEnter);

    if (shouldEmitEvent && ![_currentlyHoveredViews containsObject:componentView]) {
      SharedTouchEventEmitter eventEmitter =
          GetTouchEmitterFromView(componentView, [recognizer locationInView:componentView]);
      if (eventEmitter != nil) {
        PointerEvent event = CreatePointerEventFromIncompleteHoverData(componentView, clientLocation, timestamp);
        eventEmitter->onPointerEnter(event);
      }
    }

    if (shouldEmitEvent && !hasParentEnterListener) {
      hasParentEnterListener = YES;
    }

    if (!hasMoveListenerInEventPath && IsViewListeningToEvent(componentView, ViewEvents::Offset::PointerMove)) {
      hasMoveListenerInEventPath = YES;
    }
  }

  // Moving
  if (hasMoveListenerInEventPath) {
    SharedTouchEventEmitter eventEmitter = GetTouchEmitterFromView(targetView, [recognizer locationInView:targetView]);
    if (eventEmitter != nil) {
      PointerEvent event = CreatePointerEventFromIncompleteHoverData(targetView, clientLocation, timestamp);
      eventEmitter->onPointerMove(event);
    }
  }

  // Out
  if (prevTargetView != targetView) {
    BOOL shouldEmitOutEvent = IsAnyViewInPathListeningToEvent(_currentlyHoveredViews, ViewEvents::Offset::PointerOut);
    SharedTouchEventEmitter eventEmitter =
        GetTouchEmitterFromView(prevTargetView, [recognizer locationInView:prevTargetView]);
    if (shouldEmitOutEvent && eventEmitter != nil) {
      PointerEvent event = CreatePointerEventFromIncompleteHoverData(prevTargetView, clientLocation, timestamp);
      eventEmitter->onPointerOut(event);
    }
  }

  // Leaving

  // pointerleave events need to be emited from the deepest target to the root but
  // we also need to efficiently keep track of if a view has a parent which is listening to the leave events,
  // so we first iterate from the root to the target, collecting the views which need events fired for, of which
  // we reverse iterate (now from target to root), actually emitting the events.
  NSMutableOrderedSet *viewsToEmitLeaveEventsTo = [NSMutableOrderedSet orderedSet];

  BOOL hasParentLeaveListener = NO;
  for (UIView *componentView in [_currentlyHoveredViews reverseObjectEnumerator]) {
    BOOL shouldEmitEvent =
        hasParentLeaveListener || IsViewListeningToEvent(componentView, ViewEvents::Offset::PointerLeave);

    if (shouldEmitEvent && ![eventPathViews containsObject:componentView]) {
      [viewsToEmitLeaveEventsTo addObject:componentView];
    }

    if (shouldEmitEvent && !hasParentLeaveListener) {
      hasParentLeaveListener = YES;
    }
  }

  for (UIView *componentView in [viewsToEmitLeaveEventsTo reverseObjectEnumerator]) {
    SharedTouchEventEmitter eventEmitter =
        GetTouchEmitterFromView(componentView, [recognizer locationInView:componentView]);
    if (eventEmitter != nil) {
      PointerEvent event = CreatePointerEventFromIncompleteHoverData(componentView, clientLocation, timestamp);
      eventEmitter->onPointerLeave(event);
    }
  }

  _currentlyHoveredViews = eventPathViews;
}

@end
