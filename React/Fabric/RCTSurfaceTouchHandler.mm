/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceTouchHandler.h"

#import <React/RCTReactTaggedView.h>
#import <React/RCTUtils.h>
#import <React/RCTViewComponentView.h>
#import <React/RCTUIKit.h>

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
   * The bit mask of modifier flags in the gesture represented by the receiver.
   */
  UIKeyModifierFlags modifierFlags;

  /*
   * Indicates if the active touch represents the primary pointer of this pointer type.
   */
  bool isPrimary;

  /*
   * The button number that was pressed (if applicable) when the event was fired.
   */
  int button;

  /*
   * Informs the event system that when the touch is released it should be treated as the
   * pointer leaving the screen entirely.
   */
  bool shouldLeaveWhenReleased;

  /*
   * A component view on which the touch was begun.
   */
  __strong RCTUIView<RCTComponentViewProtocol> *componentView = nil; // [macOS]

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

// Mouse and Pen pointers get reserved IDs so they stay consistent no matter the order
// at which events come in
static int const kMousePointerId = 0;
static int const kPencilPointerId = 1;

// If a new reserved ID is added above this should be incremented to ensure touch events
// do not conflict
static int const kTouchIdentifierPoolOffset = 2;

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
  int buttonsMaskResult = 0;
#if !TARGET_OS_OSX // [macOS]
    if (@available(iOS 13.4, *)) {
    if ((buttonMask & UIEventButtonMaskPrimary) != 0) {
      buttonsMaskResult |= 1;
    }
    if ((buttonMask & UIEventButtonMaskSecondary) != 0) {
      buttonsMaskResult |= 2;
    }
    // undocumented mask value which represents the "auxiliary button" (i.e. middle mouse button)
    if ((buttonMask & 0x4) != 0) {
      buttonsMaskResult |= 4;
    }
  }
#endif // [macOS]
  return buttonsMaskResult;
}

static int ButtonMaskDiffToButton(UIEventButtonMask prevButtonMask, UIEventButtonMask curButtonMask)
{
#if !TARGET_OS_OSX // [macOS]
  if (@available(iOS 13.4, *)) {
    if ((prevButtonMask & UIEventButtonMaskPrimary) != (curButtonMask & UIEventButtonMaskPrimary)) {
      return 0;
    }
    if ((prevButtonMask & 0x4) != (curButtonMask & 0x4)) {
      return 1;
    }
    if ((prevButtonMask & UIEventButtonMaskSecondary) != (curButtonMask & UIEventButtonMaskSecondary)) {
      return 2;
    }
  }
#endif // [macOS]
  return -1;
}

static void UpdateActiveTouchWithUITouch(
    ActiveTouch &activeTouch,
    RCTUITouch *uiTouch, // [macOS]
    UIEvent *uiEvent,
    RCTUIView *rootComponentView,  // [macOS]
    CGPoint rootViewOriginOffset) // [macOS]
{
#if !TARGET_OS_OSX // [macOS]
  CGPoint offsetPoint = [uiTouch locationInView:activeTouch.componentView];
  CGPoint pagePoint = [uiTouch locationInView:rootComponentView];
  CGPoint screenPoint = [rootComponentView convertPoint:pagePoint
                                      toCoordinateSpace:rootComponentView.window.screen.coordinateSpace];

  pagePoint = CGPointMake(pagePoint.x + rootViewOriginOffset.x, pagePoint.y + rootViewOriginOffset.y);
#else // [macOS
  CGPoint offsetPoint = [activeTouch.componentView convertPoint:uiTouch.locationInWindow fromView:nil];
  CGPoint screenPoint = uiTouch.locationInWindow;
  CGPoint pagePoint = CGPointMake(screenPoint.x, CGRectGetHeight(rootComponentView.window.frame) - screenPoint.y);
#endif // macOS]

  activeTouch.touch.offsetPoint = RCTPointFromCGPoint(offsetPoint);
  activeTouch.touch.screenPoint = RCTPointFromCGPoint(screenPoint);
  activeTouch.touch.pagePoint = RCTPointFromCGPoint(pagePoint);

  activeTouch.touch.timestamp = uiTouch.timestamp;

#if !TARGET_OS_OSX // [macOS]
  if (RCTForceTouchAvailable()) {
    activeTouch.touch.force = RCTZeroIfNaN(uiTouch.force / uiTouch.maximumPossibleForce);
  }

  activeTouch.touchType = uiTouch.type;
  activeTouch.majorRadius = uiTouch.majorRadius;
  activeTouch.altitudeAngle = uiTouch.altitudeAngle;
  activeTouch.azimuthAngle = [uiTouch azimuthAngleInView:nil];
  if (@available(iOS 13.4, *)) {
    UIEventButtonMask nextButtonMask = 0;
    if (uiTouch.phase != UITouchPhaseEnded) {
      nextButtonMask = uiTouch.type == UITouchTypeIndirectPointer ? uiEvent.buttonMask : 1;
    }
    activeTouch.button = ButtonMaskDiffToButton(activeTouch.buttonMask, nextButtonMask);
    activeTouch.buttonMask = nextButtonMask;
    activeTouch.modifierFlags = uiEvent.modifierFlags;
  } else {
    activeTouch.button = 0;
    activeTouch.buttonMask = 0;
    activeTouch.modifierFlags = 0;
  }
#else // [macOS
  NSEventType type = uiTouch.type;
  if (type == NSEventTypeLeftMouseDown || type == NSEventTypeLeftMouseUp || type == NSEventTypeLeftMouseDragged) {
    activeTouch.touch.button = 0;
  } else if (type == NSEventTypeRightMouseDown || type == NSEventTypeRightMouseUp || type == NSEventTypeRightMouseDragged) {
    activeTouch.touch.button = 2;
  }

  NSEventModifierFlags modifierFlags = uiTouch.modifierFlags;
  if (modifierFlags & NSEventModifierFlagOption) {
    activeTouch.touch.altKey = true;
  }
  if (modifierFlags & NSEventModifierFlagCommand) {
    activeTouch.touch.ctrlKey = true;
  }
  if (modifierFlags & NSEventModifierFlagShift) {
    activeTouch.touch.shiftKey = true;
  }
  if (modifierFlags & NSEventModifierFlagCommand) {
    activeTouch.touch.metaKey = true;
  }
#endif // macOS]
}

static ActiveTouch
CreateTouchWithUITouch(RCTUITouch *uiTouch, UIEvent *uiEvent, RCTUIView *rootComponentView, CGPoint rootViewOriginOffset) // [macOS]
{
  ActiveTouch activeTouch = {};

  // Find closest Fabric-managed touchable view
#if !TARGET_OS_OSX // [macOS]
  RCTUIView *componentView = uiTouch.view; // [macOS]
#else // [macOS
  CGPoint touchLocation = [rootComponentView.superview convertPoint:uiTouch.locationInWindow fromView:nil];
  RCTUIView *componentView = (RCTUIView *) [rootComponentView hitTest:touchLocation]; // [macOS]
#endif // macOS]
  while (componentView) {
#if !TARGET_OS_OSX // [macOS]
    CGPoint offsetPoint = [uiTouch locationInView:componentView];
#else // [macOS
    CGPoint offsetPoint = [componentView convertPoint:uiTouch.locationInWindow fromView:nil];
#endif // macOS]
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      activeTouch.eventEmitter = [(id<RCTTouchableComponentViewProtocol>)componentView
          touchEventEmitterAtPoint:offsetPoint];
#if !TARGET_OS_OSX // [macOS]
      activeTouch.touch.target = (Tag)componentView.tag;
#else // [macOS
      activeTouch.touch.target = (Tag)(componentView.reactTag.intValue);
#endif // macOS]
      activeTouch.componentView = componentView;
      break;
    }
    componentView = componentView.superview;
  }
  UpdateActiveTouchWithUITouch(activeTouch, uiTouch, uiEvent, rootComponentView, rootViewOriginOffset);
  return activeTouch;
}

#if !TARGET_OS_OSX // [macOS]
static RCTUIView *FindClosestFabricManagedTouchableView(RCTUIView *componentView) // [macOS]
{
  while (componentView) {
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      return componentView;
    }
    componentView = componentView.superview;
  }
  return nil;
}

static NSOrderedSet<RCTReactTaggedView *> *GetTouchableViewsInPathToRoot(RCTUIView *componentView) // [macOS]
{
  NSMutableOrderedSet *results = [NSMutableOrderedSet orderedSet];
  do {
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      [results addObject:[RCTReactTaggedView wrap:componentView]];
    }
    componentView = componentView.superview;
  } while (componentView);
  return results;
}

static SharedTouchEventEmitter GetTouchEmitterFromView(RCTUIView *componentView, CGPoint point) // [macOS]
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

static void UpdatePointerEventModifierFlags(PointerEvent &event, UIKeyModifierFlags flags)
{
  if (@available(iOS 13.4, *)) {
    event.ctrlKey = (flags & UIKeyModifierControl) != 0;
    event.shiftKey = (flags & UIKeyModifierShift) != 0;
    event.altKey = (flags & UIKeyModifierAlternate) != 0;
    event.metaKey = (flags & UIKeyModifierCommand) != 0;
  } else {
    event.ctrlKey = false;
    event.shiftKey = false;
    event.altKey = false;
    event.metaKey = false;
  }
}

static PointerEvent CreatePointerEventFromActiveTouch(ActiveTouch activeTouch, RCTTouchEventType eventType)
{
  Touch touch = activeTouch.touch;

  PointerEvent event = {};
  event.pointerId = touch.identifier;
  event.pointerType = PointerTypeCStringFromUITouchType(activeTouch.touchType);
  event.clientPoint = touch.pagePoint;
  event.screenPoint = touch.screenPoint;
  event.offsetPoint = touch.offsetPoint;

  event.pressure = touch.force;
  if (@available(iOS 13.4, *)) {
    if (activeTouch.touchType == UITouchTypeIndirectPointer) {
      // pointer events with a mouse button pressed should report a pressure of 0.5
      // when the touch is down and 0.0 when it is lifted regardless of how it is reported by the OS
      event.pressure = eventType != RCTTouchEventTypeTouchEnd ? 0.5 : 0.0;
    }
  }

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

  event.button = activeTouch.button;
  event.buttons = ButtonMaskToButtons(activeTouch.buttonMask);

  UpdatePointerEventModifierFlags(event, activeTouch.modifierFlags);

  event.tangentialPressure = 0.0;
  event.twist = 0;
  event.isPrimary = activeTouch.isPrimary;

  return event;
}

static PointerEvent CreatePointerEventFromIncompleteHoverData(
    CGPoint clientLocation,
    CGPoint screenLocation,
    CGPoint offsetLocation,
    UIKeyModifierFlags modifierFlags)
{
  PointerEvent event = {};
  // "touch" events produced from a mouse cursor on iOS always have the ID 0 so
  // we can just assume that here since these sort of hover events only ever come
  // from the mouse
  event.pointerId = kMousePointerId;
  event.pressure = 0.0;
  event.pointerType = "mouse";
  event.clientPoint = RCTPointFromCGPoint(clientLocation);
  event.screenPoint = RCTPointFromCGPoint(screenLocation);
  event.offsetPoint = RCTPointFromCGPoint(offsetLocation);
  event.width = 1.0;
  event.height = 1.0;
  event.tiltX = 0;
  event.tiltY = 0;
  event.detail = 0;
  event.button = -1;
  event.buttons = 0;
  UpdatePointerEventModifierFlags(event, modifierFlags);
  event.tangentialPressure = 0.0;
  event.twist = 0;
  event.isPrimary = true;

  return event;
}

static BOOL AllTouchesAreCancelledOrEnded(NSSet<UITouch *> *touches)
{
  for (RCTUITouch *touch in touches) { // [macOS]
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved || touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

static BOOL AnyTouchesChanged(NSSet<RCTUITouch *> *touches) // [macOS]
{
  for (RCTUITouch *touch in touches) { // [macOS]
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}
#endif // [macOS]

static BOOL IsViewListeningToEvent(RCTReactTaggedView *taggedView, ViewEvents::Offset eventType)
{
  RCTUIView *view = taggedView.view; // [macOS]
  if (view && [view.class conformsToProtocol:@protocol(RCTComponentViewProtocol)]) {
    auto props = ((id<RCTComponentViewProtocol>)view).props;
    if (SharedViewProps viewProps = std::dynamic_pointer_cast<ViewProps const>(props)) {
      return viewProps->events[eventType];
    }
  }
  return NO;
}

static BOOL IsAnyViewInPathListeningToEvent(NSOrderedSet<RCTReactTaggedView *> *viewPath, ViewEvents::Offset eventType)
{
  for (RCTReactTaggedView *taggedView in viewPath) {
    if (IsViewListeningToEvent(taggedView, eventType)) {
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
#if !TARGET_OS_OSX // [macOS]
  std::unordered_map<__unsafe_unretained RCTUITouch *, ActiveTouch, PointerHasher<__unsafe_unretained RCTUITouch *>>
      _activeTouches;
#else // [macOS
  std::unordered_map<NSInteger, ActiveTouch> _activeTouches;
#endif // macOS]

  /*
   * We hold the view weakly to prevent a retain cycle.
   */
  __weak RCTUIView *_rootComponentView; // [macOS]
  IdentifierPool<11> _identifierPool;

#if !TARGET_OS_OSX // [macOS]
    UIHoverGestureRecognizer *_hoverRecognizer API_AVAILABLE(ios(13.0));
#endif // [macOS]
  NSMutableDictionary<NSNumber *, NSOrderedSet<RCTReactTaggedView *> *> *_currentlyHoveredViewsPerPointer;

  int _primaryTouchPointerId;
}

- (instancetype)init
{
  if (self = [super initWithTarget:nil action:nil]) {
    // `cancelsTouchesInView` and `delaysTouches*` are needed in order
    // to be used as a top level event delegated recognizer.
    // Otherwise, lower-level components not built using React Native,
    // will fail to recognize gestures.
#if !TARGET_OS_OSX // [macOS]
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO; // This is default value.
    self.delaysTouchesEnded = NO;
#endif // [macOS]

    self.delegate = self;

#if !TARGET_OS_OSX // [macOS]
    _hoverRecognizer = nil;
#endif // [macOS]
    _currentlyHoveredViewsPerPointer = [[NSMutableDictionary alloc] init];
    _primaryTouchPointerId = -1;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)

- (void)attachToView:(RCTUIView *)view // [macOS]
{
  RCTAssert(self.view == nil, @"RCTTouchHandler already has attached view.");

  [view addGestureRecognizer:self];
  _rootComponentView = view;

  if (RCTGetDispatchW3CPointerEvents()) {
#if !TARGET_OS_OSX // [macOS]
      if (@available(iOS 13.0, *)) {
      _hoverRecognizer = [[UIHoverGestureRecognizer alloc] initWithTarget:self action:@selector(hovering:)];
      [view addGestureRecognizer:_hoverRecognizer];
    }
#endif // [macOS]
  }
}

- (void)detachFromView:(RCTUIView *)view // [macOS]
{
  RCTAssertParam(view);
  RCTAssert(self.view == view, @"RCTTouchHandler attached to another view.");

  [view removeGestureRecognizer:self];
  _rootComponentView = nil;

#if !TARGET_OS_OSX // [macOS]
  if (_hoverRecognizer != nil) {
    [view removeGestureRecognizer:_hoverRecognizer];
    _hoverRecognizer = nil;
  }
#endif // [macOS]
}

- (void)_registerTouches:(NSSet<RCTUITouch *> *)touches withEvent:(UIEvent *)event // [macOS]
{
  for (RCTUITouch *touch in touches) { // [macOS]
		auto activeTouch = CreateTouchWithUITouch(touch, event, _rootComponentView, _viewOriginOffset);
    activeTouch.touch.identifier = _identifierPool.dequeue();
#if !TARGET_OS_OSX // [macOS]
    _activeTouches.emplace(touch, activeTouch);
#else // [macOS
    _activeTouches.emplace(touch.eventNumber, activeTouch);
#endif // macOS]
  }
}

- (void)_updateTouches:(NSSet<RCTUITouch *> *)touches withEvent:(UIEvent *)event // [macOS]
{
  for (RCTUITouch *touch in touches) { // [macOS]
#if !TARGET_OS_OSX // [macOS]
    auto iterator = _activeTouches.find(touch);
#else // [macOS
    auto iterator = _activeTouches.find(touch.eventNumber);
#endif // macOS]
    assert(iterator != _activeTouches.end() && "Inconsistency between local and UIKit touch registries");
    if (iterator == _activeTouches.end()) {
      continue;
    }

    UpdateActiveTouchWithUITouch(iterator->second, touch, event, _rootComponentView, _viewOriginOffset);
  }
}

- (void)_unregisterTouches:(NSSet<RCTUITouch *> *)touches // [macOS]
{
  for (RCTUITouch *touch in touches) { // [macOS]
#if !TARGET_OS_OSX // [macOS]
    auto iterator = _activeTouches.find(touch);
#else // [macOS
    auto iterator = _activeTouches.find(touch.eventNumber);
#endif // macOS]
    assert(iterator != _activeTouches.end() && "Inconsistency between local and UIKit touch registries");
    if (iterator == _activeTouches.end()) {
      continue;
    }
    auto &activeTouch = iterator->second;

    if (activeTouch.touch.identifier == _primaryTouchPointerId) {
      _primaryTouchPointerId = -1;
    }

#if !TARGET_OS_OSX // [macOS]
    if (@available(iOS 13.4, *)) {
      // only need to enqueue if the touch type isn't one with a reserved identifier
      switch (touch.type) {
        case UITouchTypeIndirectPointer:
        case UITouchTypePencil:
          break;
        default:
          // since the touch's identifier has been offset we need to re-normalize it to 0-based
          // which is what the identifier pool expects
          _identifierPool.enqueue(activeTouch.touch.identifier - kTouchIdentifierPoolOffset);
      }
    } else {
      _identifierPool.enqueue(activeTouch.touch.identifier);
    }
    _activeTouches.erase(touch);
#else // [macOS
    _activeTouches.erase(touch.eventNumber);
#endif // macOS]
  }
}

- (std::vector<ActiveTouch>)_activeTouchesFromTouches:(NSSet<RCTUITouch *> *)touches // [macOS]
{
  std::vector<ActiveTouch> activeTouches;
  activeTouches.reserve(touches.count);

  for (RCTUITouch *touch in touches) {
#if !TARGET_OS_OSX // [macOS]
    auto iterator = _activeTouches.find(touch);
#else // [macOS
    auto iterator = _activeTouches.find(touch.eventNumber);
#endif // macOS]
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

#if !TARGET_OS_OSX // [macOS]
      // emit w3c pointer events
    if (RCTGetDispatchW3CPointerEvents()) {
      PointerEvent pointerEvent = CreatePointerEventFromActiveTouch(activeTouch, eventType);

      if ((eventType == RCTTouchEventTypeTouchEnd && activeTouch.shouldLeaveWhenReleased)) {
        activeTouch.eventEmitter->onPointerUp(pointerEvent);
        [self handleIncomingPointerEvent:pointerEvent onView:nil];
      } else {
        CGPoint clientLocation = CGPointMake(pointerEvent.clientPoint.x, pointerEvent.clientPoint.y);
        RCTUIView *targetView = FindClosestFabricManagedTouchableView([_rootComponentView hitTest:clientLocation
                                                                                     withEvent:nil]); // [macOS]

        NSOrderedSet<RCTReactTaggedView *> *eventPathViews = [self handleIncomingPointerEvent:pointerEvent
                                                                                       onView:targetView];

        switch (eventType) {
          case RCTTouchEventTypeTouchStart:
            activeTouch.eventEmitter->onPointerDown(pointerEvent);
            break;
          case RCTTouchEventTypeTouchMove: {
            bool hasMoveEventListeners =
                IsAnyViewInPathListeningToEvent(eventPathViews, ViewEvents::Offset::PointerMove) ||
                IsAnyViewInPathListeningToEvent(eventPathViews, ViewEvents::Offset::PointerMoveCapture);
            if (hasMoveEventListeners) {
              activeTouch.eventEmitter->onPointerMove(pointerEvent);
            }
            break;
          }
          case RCTTouchEventTypeTouchEnd:
            activeTouch.eventEmitter->onPointerUp(pointerEvent);
            break;
          case RCTTouchEventTypeTouchCancel:
            activeTouch.eventEmitter->onPointerCancel(pointerEvent);
            break;
        }
      }
    }
#endif // [macOS]
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

#if !TARGET_OS_OSX // [macOS]

- (void)touchesBegan:(NSSet<RCTUITouch *> *)touches withEvent:(UIEvent *)event // [macOS]
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

- (void)touchesMoved:(NSSet<RCTUITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];

  [self _updateTouches:touches withEvent:event];
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchMove];

  self.state = UIGestureRecognizerStateChanged;
}

- (void)touchesEnded:(NSSet<RCTUITouch *> *)touches withEvent:(UIEvent *)event
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

- (void)touchesCancelled:(NSSet<RCTUITouch *> *)touches withEvent:(UIEvent *)event
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

  {
    NSSet* touches = [NSSet setWithObject:event];
    [self _registerTouches:touches withEvent:event]; // [macOS]
    [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchStart];

    if (self.state == NSGestureRecognizerStatePossible) {
      self.state = NSGestureRecognizerStateBegan;
    } else if (self.state == NSGestureRecognizerStateBegan) {
      self.state = NSGestureRecognizerStateChanged;
    }
  }
}

- (void)rightMouseDown:(NSEvent *)event
{
  [super rightMouseDown:event];

  {
    NSSet* touches = [NSSet setWithObject:event];
		[self _registerTouches:touches withEvent:event]; // [macOS]
    [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchStart];

    if (self.state == NSGestureRecognizerStatePossible) {
      self.state = NSGestureRecognizerStateBegan;
    } else if (self.state == NSGestureRecognizerStateBegan) {
      self.state = NSGestureRecognizerStateChanged;
    }
  }
}

- (void)mouseDragged:(NSEvent *)event
{
  [super mouseDragged:event];

  NSSet* touches = [NSSet setWithObject:event];
  [self _updateTouches:touches withEvent:event]; // [macOS]
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchMove];

  self.state = NSGestureRecognizerStateChanged;
}

- (void)rightMouseDragged:(NSEvent *)event
{
  [super rightMouseDragged:event];

  NSSet* touches = [NSSet setWithObject:event];
  [self _updateTouches:touches withEvent:event]; // [macOS]
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchMove];

  self.state = NSGestureRecognizerStateChanged;
}

- (void)mouseUp:(NSEvent *)event
{
  [super mouseUp:event];

  NSSet* touches = [NSSet setWithObject:event];
  [self _updateTouches:touches withEvent:event]; // [macOS]
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchEnd];
  [self _unregisterTouches:touches];

  self.state = NSGestureRecognizerStateEnded;
}

- (void)rightMouseUp:(NSEvent *)event
{
  [super rightMouseUp:event];

  NSSet* touches = [NSSet setWithObject:event];
  [self _updateTouches:touches withEvent:event]; // [macOS]
  [self _dispatchActiveTouches:[self _activeTouchesFromTouches:touches] eventType:RCTTouchEventTypeTouchEnd];
  [self _unregisterTouches:touches];

  self.state = NSGestureRecognizerStateEnded;
}

#endif // macOS]

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
#if !TARGET_OS_OSX // [macOS]
  // We fail in favour of other external gesture recognizers.
  // iOS will ask `delegate`'s opinion about this gesture recognizer little bit later.
  return ![preventingGestureRecognizer.view isDescendantOfView:self.view];
#else  // [macOS
  return NO;
#endif // macOS]
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

#if !TARGET_OS_OSX
- (void)hovering:(UIHoverGestureRecognizer *)recognizer API_AVAILABLE(ios(13.0))
{
  RCTUIView *listenerView = recognizer.view; // [macOS]
  CGPoint clientLocation = [recognizer locationInView:listenerView];
  CGPoint screenLocation = [listenerView convertPoint:clientLocation
                                    toCoordinateSpace:listenerView.window.screen.coordinateSpace];

  RCTUIView *targetView = [listenerView hitTest:clientLocation withEvent:nil]; // [macOS]
  targetView = FindClosestFabricManagedTouchableView(targetView);

  CGPoint offsetLocation = [recognizer locationInView:targetView];

  UIKeyModifierFlags modifierFlags;
  if (@available(iOS 13.4, *)) {
    modifierFlags = recognizer.modifierFlags;
  } else {
    modifierFlags = 0;
  }

  PointerEvent event =
      CreatePointerEventFromIncompleteHoverData(clientLocation, screenLocation, offsetLocation, modifierFlags);

  NSOrderedSet<RCTReactTaggedView *> *eventPathViews = [self handleIncomingPointerEvent:event onView:targetView];
  SharedTouchEventEmitter eventEmitter = GetTouchEmitterFromView(targetView, offsetLocation);
  bool hasMoveEventListeners = IsAnyViewInPathListeningToEvent(eventPathViews, ViewEvents::Offset::PointerMove) ||
      IsAnyViewInPathListeningToEvent(eventPathViews, ViewEvents::Offset::PointerMoveCapture);
  if (eventEmitter != nil && hasMoveEventListeners) {
    eventEmitter->onPointerMove(event);
  }
}
#endif

/**
 * Private method which is used for tracking the location of pointer events to manage the entering/leaving events.
 * The primary idea is that a pointer's presence & movement is dicated by a variety of underlying events such as down,
 * move, and up — and they should all be treated the same when it comes to tracking the entering & leaving of pointers
 * to views. This method accomplishes that by recieving the pointer event, the target view (can be null in cases when
 * the event indicates that the pointer has left the screen entirely), and a block/callback where the underlying event
 * should be fired.
 */
#if !TARGET_OS_OSX
- (NSOrderedSet<RCTReactTaggedView *> *)handleIncomingPointerEvent:(PointerEvent)event
                                                            onView:(nullable RCTUIView *)targetView // [macOS]
{
  int pointerId = event.pointerId;
  CGPoint clientLocation = CGPointMake(event.clientPoint.x, event.clientPoint.y);

  NSOrderedSet<RCTReactTaggedView *> *currentlyHoveredViews =
      [_currentlyHoveredViewsPerPointer objectForKey:@(pointerId)];
  if (currentlyHoveredViews == nil) {
    currentlyHoveredViews = [NSOrderedSet orderedSet];
  }

  RCTReactTaggedView *targetTaggedView = [RCTReactTaggedView wrap:targetView];
  RCTReactTaggedView *prevTargetTaggedView = [currentlyHoveredViews firstObject];
  RCTUIView *prevTargetView = prevTargetTaggedView.view; // [macOS]

  NSOrderedSet<RCTReactTaggedView *> *eventPathViews = GetTouchableViewsInPathToRoot(targetView);

  // Out
  if (prevTargetView != nil && prevTargetTaggedView.tag != targetTaggedView.tag) {
    BOOL shouldEmitOutEvent = IsAnyViewInPathListeningToEvent(currentlyHoveredViews, ViewEvents::Offset::PointerOut);
    SharedTouchEventEmitter eventEmitter =
        GetTouchEmitterFromView(prevTargetView, [_rootComponentView convertPoint:clientLocation toView:prevTargetView]);
    if (shouldEmitOutEvent && eventEmitter != nil) {
      eventEmitter->onPointerOut(event);
    }
  }

  // Leaving

  // pointerleave events need to be emited from the deepest target to the root but
  // we also need to efficiently keep track of if a view has a parent which is listening to the leave events,
  // so we first iterate from the root to the target, collecting the views which need events fired for, of which
  // we reverse iterate (now from target to root), actually emitting the events.
  NSMutableOrderedSet<RCTUIView *> *viewsToEmitLeaveEventsTo = [NSMutableOrderedSet orderedSet]; // [macOS]

  BOOL hasParentLeaveListener = NO;
  for (RCTReactTaggedView *taggedView in [currentlyHoveredViews reverseObjectEnumerator]) {
    RCTUIView *componentView = taggedView.view; // [macOS]

    BOOL shouldEmitEvent = componentView != nil &&
        (hasParentLeaveListener || IsViewListeningToEvent(taggedView, ViewEvents::Offset::PointerLeave));

    if (shouldEmitEvent && ![eventPathViews containsObject:taggedView]) {
      [viewsToEmitLeaveEventsTo addObject:componentView];
    }

    if (shouldEmitEvent && !hasParentLeaveListener) {
      hasParentLeaveListener = YES;
    }
  }

  for (RCTUIView *componentView in [viewsToEmitLeaveEventsTo reverseObjectEnumerator]) { // [macOS]
    SharedTouchEventEmitter eventEmitter =
        GetTouchEmitterFromView(componentView, [_rootComponentView convertPoint:clientLocation toView:componentView]);
    if (eventEmitter != nil) {
      eventEmitter->onPointerLeave(event);
    }
  }

  // Over
  if (targetView != nil && prevTargetTaggedView.tag != targetTaggedView.tag) {
    BOOL shouldEmitOverEvent = IsAnyViewInPathListeningToEvent(eventPathViews, ViewEvents::Offset::PointerOver);
    SharedTouchEventEmitter eventEmitter =
        GetTouchEmitterFromView(targetView, [_rootComponentView convertPoint:clientLocation toView:targetView]);
    if (shouldEmitOverEvent && eventEmitter != nil) {
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
  for (RCTReactTaggedView *taggedView in [eventPathViews reverseObjectEnumerator]) {
    RCTUIView *componentView = taggedView.view; // [macOS]

    BOOL shouldEmitEvent = componentView != nil &&
        (hasParentEnterListener || IsViewListeningToEvent(taggedView, ViewEvents::Offset::PointerEnter));

    if (shouldEmitEvent && ![currentlyHoveredViews containsObject:taggedView]) {
      SharedTouchEventEmitter eventEmitter =
          GetTouchEmitterFromView(componentView, [_rootComponentView convertPoint:clientLocation toView:componentView]);
      if (eventEmitter != nil) {
        eventEmitter->onPointerEnter(event);
      }
    }

    if (shouldEmitEvent && !hasParentEnterListener) {
      hasParentEnterListener = YES;
    }
  }

  [_currentlyHoveredViewsPerPointer setObject:eventPathViews forKey:@(pointerId)];

  return eventPathViews;
}
#endif

@end
