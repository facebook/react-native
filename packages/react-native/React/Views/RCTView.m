/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS
#import "objc/runtime.h"
#import "RCTHandledKey.h"
// macOS]
#import "RCTView.h"

#import <QuartzCore/QuartzCore.h>
#import <React/RCTMockDef.h>

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderCurve.h"
#import "RCTBorderDrawing.h"
#import "RCTFocusChangeEvent.h" // [macOS]
#import "RCTI18nUtil.h"
#import "RCTLog.h"
#import "RCTRootContentView.h" // [macOS]
#import "RCTViewUtils.h"
#import "UIView+React.h"
#import "RCTViewKeyboardEvent.h"
#if TARGET_OS_OSX // [macOS
#import "RCTTextView.h"
#endif // macOS]

RCT_MOCK_DEF(RCTView, RCTContentInsets);
#define RCTContentInsets RCT_MOCK_USE(RCTView, RCTContentInsets)

#if !TARGET_OS_OSX // [macOS]
UIAccessibilityTraits const SwitchAccessibilityTrait = 0x20000000000001;
#endif // [macOS]

@implementation RCTPlatformView (RCTViewUnmounting) // [macOS]

- (void)react_remountAllSubviews
{
  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (RCTUIView *subview in self.subviews) { // [macOS]
    [subview react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView // [macOS]
{
  // Even though we don't support subview unmounting
  // we do support clipsToBounds, so if that's enabled
  // we'll update the clipping

  if (RCTUIViewSetClipsToBounds(self) && self.subviews.count > 0) { // [macOS]
    clipRect = [clipView convertRect:clipRect toView:self];
    clipRect = CGRectIntersection(clipRect, self.bounds);
    clipView = self;
  }

  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (RCTUIView *subview in self.subviews) { // [macOS]
    [subview react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }
}

- (RCTPlatformView *)react_findClipView // [macOS]
{
  RCTPlatformView *testView = self; // [macOS]
  RCTPlatformView *clipView = nil; // [macOS]
  CGRect clipRect = self.bounds;
  // We will only look for a clipping view up the view hierarchy until we hit the root view.
  while (testView) {
    if (RCTUIViewSetClipsToBounds(testView)) { // [macOS]
      if (clipView) {
        CGRect testRect = [clipView convertRect:clipRect toView:testView];
        if (!CGRectContainsRect(testView.bounds, testRect)) {
          clipView = testView;
          clipRect = CGRectIntersection(testView.bounds, testRect);
        }
      } else {
        clipView = testView;
        clipRect = [self convertRect:self.bounds toView:clipView];
      }
    }
    if ([testView isReactRootView]) {
      break;
    }
    testView = testView.superview;
  }
#if !TARGET_OS_OSX // [macOS]
  return clipView ?: self.window;
#else // [macOS
  return clipView ?: self.window.contentView;
#endif // macOS]
}

@end

static NSString *RCTRecursiveAccessibilityLabel(RCTUIView *view) // [macOS]
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (RCTUIView *subview in view.subviews) { // [macOS]
#if !TARGET_OS_OSX // [macOS]
    NSString *label = subview.accessibilityLabel;
#else // [macOS
    NSString *label;
    if ([subview isKindOfClass:[RCTTextView class]]) {
      // on macOS VoiceOver a text element will always have its accessibilityValue read, but will only read it's accessibilityLabel if it's value is set.
      // the macOS RCTTextView accessibilityValue will return its accessibilityLabel if set otherwise return its text.
      label = subview.accessibilityValue;
    } else {
      label = subview.accessibilityLabel;
    }
#endif // macOS]
    if (!label) {
      label = RCTRecursiveAccessibilityLabel(subview);
    }
    if (label && label.length > 0) {
      if (str.length > 0) {
        [str appendString:@" "];
      }
      [str appendString:label];
    }
  }
  return str.length == 0 ? nil : str;
}

@implementation RCTView {
  RCTUIColor *_backgroundColor; // [macOS]
  id<RCTEventDispatcherProtocol> _eventDispatcher; // [macOS]
#if TARGET_OS_OSX // [macOS
  NSTrackingArea *_trackingArea;
  BOOL _hasMouseOver;
  BOOL _mouseDownCanMoveWindow;
#endif // macOS]
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsNameMap;
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsLabelMap;
}

// [macOS
- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher
{
  if ((self = [self initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
  }
  return self;
}
// macOS]

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _borderWidth = -1;
    _borderTopWidth = -1;
    _borderRightWidth = -1;
    _borderBottomWidth = -1;
    _borderLeftWidth = -1;
    _borderStartWidth = -1;
    _borderEndWidth = -1;
    _borderTopLeftRadius = -1;
    _borderTopRightRadius = -1;
    _borderTopStartRadius = -1;
    _borderTopEndRadius = -1;
    _borderBottomLeftRadius = -1;
    _borderBottomRightRadius = -1;
    _borderBottomStartRadius = -1;
    _borderBottomEndRadius = -1;
    _borderEndEndRadius = -1;
    _borderEndStartRadius = -1;
    _borderStartEndRadius = -1;
    _borderStartStartRadius = -1;
    _borderCurve = RCTBorderCurveCircular;
    _borderStyle = RCTBorderStyleSolid;
    _hitTestEdgeInsets = UIEdgeInsetsZero;
#if TARGET_OS_OSX // [macOS
    _transform3D = CATransform3DIdentity;
    _shadowColor = nil;
    _mouseDownCanMoveWindow = YES;
#endif // macOS]

    _backgroundColor = super.backgroundColor;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : unused)

- (void)setReactLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if (_reactLayoutDirection != layoutDirection) {
    _reactLayoutDirection = layoutDirection;
    [self.layer setNeedsDisplay];
  }

#if !TARGET_OS_OSX // [macOS]
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
#pragma clang diagnostic push // [macOS]
#pragma clang diagnostic ignored "-Wunguarded-availability" // [macOS]
    self.semanticContentAttribute = layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight
        ? UISemanticContentAttributeForceLeftToRight
        : UISemanticContentAttributeForceRightToLeft;
#pragma clang diagnostic pop // [macOS]
  }
#else // [macOS
  self.userInterfaceLayoutDirection =
  layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
  NSUserInterfaceLayoutDirectionLeftToRight :
  NSUserInterfaceLayoutDirectionRightToLeft;
#endif // macOS]
}

#pragma mark - Hit Testing

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != RCTPointerEventsNone);
#if !TARGET_OS_OSX // [macOS]
  if (pointerEvents == RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO;
  }
#endif // [macOS]
}

- (RCTPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event // [macOS]
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if (!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  RCTPlatformView *hitSubview = nil; // [macOS]
  BOOL isPointInside = [self pointInside:point withEvent:event];
  BOOL needsHitSubview = !(_pointerEvents == RCTPointerEventsNone || _pointerEvents == RCTPointerEventsBoxOnly);
  if (needsHitSubview && (![self clipsToBounds] || isPointInside)) {
    // Take z-index into account when calculating the touch target.
    NSArray<RCTPlatformView *> *sortedSubviews = [self reactZIndexSortedSubviews]; // [macOS]

    // The default behaviour of UIKit is that if a view does not contain a point,
    // then no subviews will be returned from hit testing, even if they contain
    // the hit point. By doing hit testing directly on the subviews, we bypass
    // the strict containment policy (i.e., UIKit guarantees that every ancestor
    // of the hit view will return YES from -pointInside:withEvent:). See:
    //  - https://developer.apple.com/library/ios/qa/qa2013/qa1812.html
    for (RCTUIView *subview in [sortedSubviews reverseObjectEnumerator]) { // [macOS]
      CGPoint pointForHitTest = CGPointZero; // [macOS
#if !TARGET_OS_OSX // [macOS]
      pointForHitTest = [subview convertPoint:point fromView:self];
#else // [macOS
      if ([subview isKindOfClass:[RCTView class]]) {
        pointForHitTest = [subview convertPoint:point fromView:self];
      } else {
        pointForHitTest = point;
      }
#endif // macOS]
      hitSubview = RCTUIViewHitTestWithEvent(subview, pointForHitTest, event); // macOS]
      if (hitSubview != nil) {
        break;
      }
    }
  }

  RCTPlatformView *hitView = (isPointInside ? self : nil); // [macOS]

  switch (_pointerEvents) {
    case RCTPointerEventsNone:
      return nil;
    case RCTPointerEventsUnspecified:
      return hitSubview ?: hitView;
    case RCTPointerEventsBoxOnly:
      return hitView;
    case RCTPointerEventsBoxNone:
      return hitSubview;
    default:
      RCTLogInfo(@"Invalid pointer-events specified %lld on %@", (long long)_pointerEvents, self);
      return hitSubview ?: hitView;
  }
}

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  if (UIEdgeInsetsEqualToEdgeInsets(self.hitTestEdgeInsets, UIEdgeInsetsZero)) {
    return [super pointInside:point withEvent:event];
  }
  CGRect hitFrame = UIEdgeInsetsInsetRect(self.bounds, self.hitTestEdgeInsets);
  return CGRectContainsPoint(hitFrame, point);
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if (label) {
    return label;
  }
#if TARGET_OS_OSX // [macOS
  // calling super.accessibilityLabel above on macOS causes the return value of this accessor to be ignored by VoiceOver.
  // Calling the super's setAccessibilityLabel with nil ensures that the return value of this accessor is used by VoiceOver.
  [super setAccessibilityLabel:nil];
#endif // macOS]
  return RCTRecursiveAccessibilityLabel(self);
}

- (NSArray<UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  if (!self.accessibilityActions.count) {
    return nil;
  }

  accessibilityActionsNameMap = [NSMutableDictionary new];
  accessibilityActionsLabelMap = [NSMutableDictionary new];
  NSMutableArray *actions = [NSMutableArray array];
  for (NSDictionary *action in self.accessibilityActions) {
    if (action[@"name"]) {
      accessibilityActionsNameMap[action[@"name"]] = action;
    }
    if (action[@"label"]) {
      accessibilityActionsLabelMap[action[@"label"]] = action;
      [actions addObject:[[UIAccessibilityCustomAction alloc]
                             initWithName:action[@"label"]
                                   target:self
                                 selector:@selector(didActivateAccessibilityCustomAction:)]];
    }
  }

  return [actions copy];
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  if (!_onAccessibilityAction || !accessibilityActionsLabelMap) {
    return NO;
  }
  // iOS defines the name as the localized label, so use our map to convert this back to the non-localized action name
  // when passing to JS. This allows for standard action names across platforms.
  NSDictionary *actionObject = accessibilityActionsLabelMap[action.name];
  if (actionObject) {
    _onAccessibilityAction(@{@"actionName" : actionObject[@"name"], @"actionTarget" : self.reactTag});
  }
  return YES;
}

#if !TARGET_OS_OSX // [macOS]
- (NSString *)accessibilityValue
{
  static dispatch_once_t onceToken;
  static NSDictionary<NSString *, NSString *> *rolesAndStatesDescription = nil;

  dispatch_once(&onceToken, ^{
    NSString *bundlePath = [[NSBundle mainBundle] pathForResource:@"AccessibilityResources" ofType:@"bundle"];
    NSBundle *bundle = [NSBundle bundleWithPath:bundlePath];

    if (bundle) {
      NSURL *url = [bundle URLForResource:@"Localizable" withExtension:@"strings"];
      rolesAndStatesDescription = [NSDictionary dictionaryWithContentsOfURL:url error:nil];
    }
    if (rolesAndStatesDescription == nil) {
      // Falling back to hardcoded English list.
      NSLog(@"Cannot load localized accessibility strings.");
      rolesAndStatesDescription = @{
        @"alert" : @"alert",
        @"checkbox" : @"checkbox",
        @"combobox" : @"combo box",
        @"menu" : @"menu",
        @"menubar" : @"menu bar",
        @"menuitem" : @"menu item",
        @"progressbar" : @"progress bar",
        @"radio" : @"radio button",
        @"radiogroup" : @"radio group",
        @"scrollbar" : @"scroll bar",
        @"spinbutton" : @"spin button",
        @"switch" : @"switch",
        @"tab" : @"tab",
        @"tablist" : @"tab list",
        @"timer" : @"timer",
        @"toolbar" : @"tool bar",
        @"checked" : @"checked",
        @"unchecked" : @"not checked",
        @"busy" : @"busy",
        @"expanded" : @"expanded",
        @"collapsed" : @"collapsed",
        @"mixed" : @"mixed",
      };
    }
  });

  // Handle Switch.
  if ((self.accessibilityTraits & SwitchAccessibilityTrait) == SwitchAccessibilityTrait) {
    for (NSString *state in self.accessibilityState) {
      id val = self.accessibilityState[state];
      if (!val) {
        continue;
      }
      if ([state isEqualToString:@"checked"] && [val isKindOfClass:[NSNumber class]]) {
        return [val boolValue] ? @"1" : @"0";
      }
    }
  }
  NSMutableArray *valueComponents = [NSMutableArray new];
  NSString *roleDescription = self.accessibilityRoleInternal ? rolesAndStatesDescription[self.accessibilityRoleInternal] : nil; // [macOS] renamed prop so it doesn't conflict with -[NSAccessibility accessibilityRole].
  if (roleDescription) {
    [valueComponents addObject:roleDescription];
  }

  // Handle states which haven't already been handled in RCTViewManager.
  for (NSString *state in self.accessibilityState) {
    id val = self.accessibilityState[state];
    if (!val) {
      continue;
    }
    if ([state isEqualToString:@"checked"]) {
      if ([val isKindOfClass:[NSNumber class]]) {
        [valueComponents addObject:rolesAndStatesDescription[[val boolValue] ? @"checked" : @"unchecked"]];
      } else if ([val isKindOfClass:[NSString class]] && [val isEqualToString:@"mixed"]) {
        [valueComponents addObject:rolesAndStatesDescription[@"mixed"]];
      }
    }
    if ([state isEqualToString:@"expanded"] && [val isKindOfClass:[NSNumber class]]) {
      [valueComponents addObject:rolesAndStatesDescription[[val boolValue] ? @"expanded" : @"collapsed"]];
    }
    if ([state isEqualToString:@"busy"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      [valueComponents addObject:rolesAndStatesDescription[@"busy"]];
    }
  }

  // Handle accessibilityValue.
  if (self.accessibilityValueInternal) {
    id min = self.accessibilityValueInternal[@"min"];
    id now = self.accessibilityValueInternal[@"now"];
    id max = self.accessibilityValueInternal[@"max"];
    id text = self.accessibilityValueInternal[@"text"];
    if (text && [text isKindOfClass:[NSString class]]) {
      [valueComponents addObject:text];
    } else if (
        [min isKindOfClass:[NSNumber class]] && [now isKindOfClass:[NSNumber class]] &&
        [max isKindOfClass:[NSNumber class]] && ([min intValue] < [max intValue]) &&
        ([min intValue] <= [now intValue] && [now intValue] <= [max intValue])) {
      int val = ([now intValue] * 100) / ([max intValue] - [min intValue]);
      [valueComponents addObject:[NSString stringWithFormat:@"%d percent", val]];
    }
  }
  if (valueComponents.count > 0) {
    return [valueComponents componentsJoinedByString:@", "];
  }
  return nil;
}
#else // [macOS
- (id)accessibilityValue {
  id accessibilityValue = nil;
  NSAccessibilityRole role = [self accessibilityRole];
  if (role == NSAccessibilityCheckBoxRole ||
      role == NSAccessibilityRadioButtonRole ||
      role == NSAccessibilityDisclosureTriangleRole) {
    for (NSString *state in [self accessibilityState]) {
      id val = [self accessibilityState][state];
      if (val != nil) {
        if ([state isEqualToString:@"checked"] || [state isEqualToString:@"selected"]) {
          if ([val isKindOfClass:[NSNumber class]]) {
            accessibilityValue = @([val boolValue]);
          } else if ([val isKindOfClass:[NSString class]] && [val isEqualToString:@"mixed"]) {
            accessibilityValue = @(2); // undocumented by Apple: @(2) is the accessibilityValue an NSButton has when its state is NSMixedState (-1) and causes VoiceOver to announced "mixed".
          }
        }
      }
    }
  } else if ([self accessibilityRole] == NSAccessibilityStaticTextRole) {
    // On macOS if the role is static text, VoiceOver will only read the text returned by accessibilityValue.
    // So return accessibilityLabel which has the logic to return either either the ivar or a computed value of all the children's text.
    // If the accessibilityValueInternal "text" is present, it will override this value below.
    accessibilityValue = [self accessibilityLabel];
  }

  // handle accessibilityValue

  id accessibilityValueInternal = [self accessibilityValueInternal];
  if (accessibilityValueInternal != nil) {
    id now = accessibilityValueInternal[@"now"];
    id text = accessibilityValueInternal[@"text"];
    if (text != nil && [text isKindOfClass:[NSString class]]) {
      accessibilityValue = text;
    } else if (now != nil && [now isKindOfClass:[NSNumber class]]) {
      accessibilityValue = now;
    }
  }

  return accessibilityValue;
}

- (BOOL)isAccessibilitySelectorAllowed:(SEL)selector {
  BOOL isAllowed = NO;
  if (selector == @selector(isAccessibilityEnabled)) {
    if (self.accessibilityState != nil) {
      id disabled = self.accessibilityState[@"disabled"];
      if ([disabled isKindOfClass:[NSNumber class]]) {
        isAllowed = YES;
      }
    }
  } else if (selector == @selector(isAccessibilitySelected)) {
    if (self.accessibilityState != nil) {
      id selected = self.accessibilityState[@"selected"];
      if ([selected isKindOfClass:[NSNumber class]]) {
        isAllowed = YES;
      }
    }
  } else if (selector == @selector(isAccessibilityExpanded)) {
    if (self.accessibilityState != nil) {
      id expanded = self.accessibilityState[@"expanded"];
      if ([expanded isKindOfClass:[NSNumber class]]) {
        isAllowed = YES;
      }
    }
  } else if (selector == @selector(accessibilityPerformPress)) {
    if (_onAccessibilityTap != nil ||
        (_onAccessibilityAction != nil && accessibilityActionsNameMap[@"activate"])) {
      isAllowed = YES;
    }
  } else if (selector == @selector(accessibilityPerformIncrement)) {
    if (_onAccessibilityAction != nil && accessibilityActionsNameMap[@"increment"]) {
      isAllowed = YES;
    }
  } else if (selector == @selector(accessibilityPerformDecrement)) {
    if (_onAccessibilityAction != nil && accessibilityActionsNameMap[@"decrement"]) {
      isAllowed = YES;
    }
  } else if (selector == @selector(accessibilityPerformShowMenu)) {
    if (_onAccessibilityAction != nil && accessibilityActionsNameMap[@"showMenu"]) {
      isAllowed = YES;
    }
  } else {
    isAllowed = YES;
  }
  return isAllowed;
}

// This override currently serves as a workaround to avoid the generic "action 1"
// description for show menu
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
- (NSString *)accessibilityActionDescription:(NSString *)action {
	NSString *actionDescription = nil;
	if ([action isEqualToString:NSAccessibilityPressAction] || [action isEqualToString:NSAccessibilityShowMenuAction]) {
		actionDescription = NSAccessibilityActionDescription(action);
	} else {
		actionDescription = [super accessibilityActionDescription:action];
	}
	return actionDescription;
}
#pragma clang dianostic pop

- (BOOL)isAccessibilityEnabled {
  BOOL isAccessibilityEnabled = YES;
  if (self.accessibilityState != nil) {
    id disabled = self.accessibilityState[@"disabled"];
    if ([disabled isKindOfClass:[NSNumber class]]) {
      isAccessibilityEnabled = [disabled boolValue] ? NO : YES;
    }
  }
  return isAccessibilityEnabled;
}

- (BOOL)isAccessibilitySelected {
  BOOL isAccessibilitySelected = NO;
  if (self.accessibilityState != nil) {
    id selected = self.accessibilityState[@"selected"];
    if ([selected isKindOfClass:[NSNumber class]]) {
      isAccessibilitySelected = [selected boolValue];
    }
  }
  return isAccessibilitySelected;
}

- (BOOL)isAccessibilityExpanded {
  BOOL isAccessibilityExpanded = NO;
  if (self.accessibilityState != nil) {
    id expanded = self.accessibilityState[@"expanded"];
    if ([expanded isKindOfClass:[NSNumber class]]) {
      isAccessibilityExpanded = [expanded boolValue];
    }
  }
  return isAccessibilityExpanded;
}

- (id)accessibilityMinValue {
  id accessibilityMinValue = nil;
  if (self.accessibilityValueInternal != nil) {
    id min = self.accessibilityValueInternal[@"min"];
    if ([min isKindOfClass:[NSNumber class]]) {
      accessibilityMinValue = min;
    }
  }
  return accessibilityMinValue;
}

- (id)accessibilityMaxValue {
  id accessibilityMaxValue = nil;
  if (self.accessibilityValueInternal != nil) {
    id max = self.accessibilityValueInternal[@"max"];
    if ([max isKindOfClass:[NSNumber class]]) {
      accessibilityMaxValue = max;
    }
  }
  return accessibilityMaxValue;
}

#endif // macOS]

- (RCTPlatformView *)reactAccessibilityElement // [macOS]
{
  return self;
}

- (BOOL)isAccessibilityElement
{
  if (self.reactAccessibilityElement == self) {
    return [super isAccessibilityElement];
  }

  return NO;
}

- (BOOL)performAccessibilityAction:(NSString *)name
{
  if (_onAccessibilityAction && accessibilityActionsNameMap[name]) {
    _onAccessibilityAction(@{@"actionName" : name, @"actionTarget" : self.reactTag});
    return YES;
  }
  return NO;
}

#if !TARGET_OS_OSX // [macOS]
- (BOOL)accessibilityActivate
#else // [macOS
- (BOOL)accessibilityPerformPress
#endif // macOS]
{
#if TARGET_OS_OSX // [macOS
  if ([self isAccessibilityEnabled] == NO) {
    return NO;
  }
#endif // macOS]
  if ([self performAccessibilityAction:@"activate"]) {
    return YES;
  } else if (_onAccessibilityTap) {
    _onAccessibilityTap(nil);
    return YES;
  } else {
    return NO;
  }
}

#if !TARGET_OS_OSX // [macOS]
- (BOOL)accessibilityPerformMagicTap
{
  if ([self performAccessibilityAction:@"magicTap"]) {
    return YES;
  } else if (_onMagicTap) {
    _onMagicTap(nil);
    return YES;
  } else {
    return NO;
  }
}
#endif // [macOS]

- (BOOL)accessibilityPerformEscape
{
  if ([self performAccessibilityAction:@"escape"]) {
    return YES;
  } else if (_onAccessibilityEscape) {
    _onAccessibilityEscape(nil);
    return YES;
  } else {
    return NO;
  }
}

#if !TARGET_OS_OSX // [macOS]
- (void)accessibilityIncrement
{
  [self performAccessibilityAction:@"increment"];
}
#else // [macOS
- (BOOL)accessibilityPerformIncrement
{
  return [self performAccessibilityAction:@"increment"];
}
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
- (void)accessibilityDecrement
{
  [self performAccessibilityAction:@"decrement"];
}
#else // [macOS
- (BOOL)accessibilityPerformDecrement
{
  return [self performAccessibilityAction:@"decrement"];
}
#endif // macOS]

#if TARGET_OS_OSX // [macOS
- (BOOL)accessibilityPerformShowMenu
{
  return [self performAccessibilityAction:@"showMenu"];
}
#endif // macOS]

#if DEBUG // [macOS description is a debug-only feature
- (NSString *)description
{
  return [[super description] stringByAppendingFormat:@" reactTag: %@; frame = %@; layer = %@",
                                                      self.reactTag,
                                                      NSStringFromCGRect(self.frame),
                                                      self.layer];
}
#endif // macOS]

#if TARGET_OS_OSX // [macOS
- (void)setShadowColor:(NSColor *)shadowColor
{
    if (_shadowColor != shadowColor)
    {
        _shadowColor = shadowColor;
        [self didUpdateShadow];
    }
}

- (void)setShadowOffset:(CGSize)shadowOffset
{
    if (!CGSizeEqualToSize(_shadowOffset, shadowOffset))
    {
        _shadowOffset = shadowOffset;
        [self didUpdateShadow];
    }
}

- (void)setShadowOpacity:(CGFloat)shadowOpacity
{
    if (_shadowOpacity != shadowOpacity)
    {
        _shadowOpacity = shadowOpacity;
        [self didUpdateShadow];
    }
}

- (void)setShadowRadius:(CGFloat)shadowRadius
{
    if (_shadowRadius != shadowRadius)
    {
        _shadowRadius = shadowRadius;
        [self didUpdateShadow];
    }
}

-(void)didUpdateShadow
{
    NSShadow *shadow = [NSShadow new];
    shadow.shadowColor = [[self shadowColor] colorWithAlphaComponent:[self shadowOpacity]];
    shadow.shadowOffset = [self shadowOffset];
    shadow.shadowBlurRadius = [self shadowRadius];
    [self setShadow:shadow];
}

- (void)viewDidMoveToWindow
{
  // Subscribe to view bounds changed notification so that the view can be notified when a
  // scroll event occurs either due to trackpad/gesture based scrolling or a scrollwheel event
  // both of which would not cause the mouseExited to be invoked.

  if ([self window] == nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSViewBoundsDidChangeNotification
                                                  object:nil];
  }
  else if ([[self enclosingScrollView] contentView] != nil) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(viewBoundsChanged:)
                                                 name:NSViewBoundsDidChangeNotification
                                               object:[[self enclosingScrollView] contentView]];
  }

  [self reactViewDidMoveToWindow]; // [macOS] Github#1412

  [super viewDidMoveToWindow];
}

- (void)viewBoundsChanged:(NSNotification*)__unused inNotif
{
  // When an enclosing scrollview is scrolled using the scrollWheel or trackpad,
  // the mouseExited: event does not get called on the view where mouseEntered: was previously called.
  // This creates an unnatural pairing of mouse enter and exit events and can cause problems.
  // We therefore explicitly check for this here and handle them by calling the appropriate callbacks.

  if (!_hasMouseOver && self.onMouseEnter)
  {
    NSPoint locationInWindow = [[self window] mouseLocationOutsideOfEventStream];
    NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];

    if (NSPointInRect(locationInView, [self bounds]))
    {
      _hasMouseOver = YES;

      [self sendMouseEventWithBlock:self.onMouseEnter
                       locationInfo:[self locationInfoFromDraggingLocation:locationInWindow]
                      modifierFlags:0
                     additionalData:nil];
    }
  }
  else if (_hasMouseOver && self.onMouseLeave)
  {
    NSPoint locationInWindow = [[self window] mouseLocationOutsideOfEventStream];
    NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];

    if (!NSPointInRect(locationInView, [self bounds]))
    {
      _hasMouseOver = NO;

      [self sendMouseEventWithBlock:self.onMouseLeave
                       locationInfo:[self locationInfoFromDraggingLocation:locationInWindow]
                      modifierFlags:0
                     additionalData:nil];
    }
  }
}
#endif // macOS]

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(RCTUIView<RCTAutoInsetsProtocol> *)parentView // [macOS]
                 withScrollView:(RCTUIScrollView *)scrollView // [macOS]
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

#if !TARGET_OS_OSX // [macOS]
  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = RCTContentInsets(parentView);
    baseInset.top += autoInset.top;
    baseInset.bottom += autoInset.bottom;
    baseInset.left += autoInset.left;
    baseInset.right += autoInset.right;
  }
#endif // [macOS]
  scrollView.contentInset = baseInset;
  scrollView.scrollIndicatorInsets = baseInset;

  if (updateOffset) {
    // If we're adjusting the top inset, then let's also adjust the contentOffset so that the view
    // elements above the top guide do not cover the content.
    // This is generally only needed when your views are initially laid out, for
    // manual changes to contentOffset, you can optionally disable this step
    CGFloat currentInsetTop = scrollView.contentInset.top;
    if (currentInsetTop != previousInsetTop) {
      contentOffset.y -= (currentInsetTop - previousInsetTop);
      scrollView.contentOffset = contentOffset;
    }
  }
}

#pragma mark - View Unmounting

- (void)react_remountAllSubviews
{
  if (_removeClippedSubviews) {
    for (RCTUIView *view in self.reactSubviews) { // [macOS]
      if (view.superview != self) {
        [self addSubview:view];
        [view react_remountAllSubviews];
      }
    }
  } else {
    // If _removeClippedSubviews is false, we must already be showing all subviews
    [super react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView // [macOS]
{
  // TODO (#5906496): for scrollviews (the primary use-case) we could
  // optimize this by only doing a range check along the scroll axis,
  // instead of comparing the whole frame

  if (!_removeClippedSubviews) {
    // Use default behavior if unmounting is disabled
    return [super react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }

  if (self.reactSubviews.count == 0) {
    // Do nothing if we have no subviews
    return;
  }

  if (CGSizeEqualToSize(self.bounds.size, CGSizeZero)) {
    // Do nothing if layout hasn't happened yet
    return;
  }

  // Convert clipping rect to local coordinates
  clipRect = [clipView convertRect:clipRect toView:self];
  clipRect = CGRectIntersection(clipRect, self.bounds);
  clipView = self;

  // Mount / unmount views
  for (RCTUIView *view in self.reactSubviews) { // [macOS]
    if (!CGSizeEqualToSize(CGRectIntersection(clipRect, view.frame).size, CGSizeZero)) {
      // View is at least partially visible, so remount it if unmounted
      [self addSubview:view];

      // Then test its subviews
      if (CGRectContainsRect(clipRect, view.frame)) {
        // View is fully visible, so remount all subviews
        [view react_remountAllSubviews];
      } else {
        // View is partially visible, so update clipped subviews
        [view react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
      }

    } else if (view.superview) {
      // View is completely outside the clipRect, so unmount it
      [view removeFromSuperview];
    }
  }
}

- (void)setRemoveClippedSubviews:(BOOL)removeClippedSubviews
{
  if (!removeClippedSubviews && _removeClippedSubviews) {
    [self react_remountAllSubviews];
  }
  _removeClippedSubviews = removeClippedSubviews;
}

- (void)didUpdateReactSubviews
{
  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  } else {
    [super didUpdateReactSubviews];
  }
}

- (void)updateClippedSubviews
{
  // Find a suitable view to use for clipping
  RCTPlatformView *clipView = [self react_findClipView]; // [macOS]
  if (clipView) {
    [self react_updateClippedSubviewsWithClipRect:clipView.bounds relativeToView:clipView];
  }
}

- (void)layoutSubviews
{
  // TODO (#5906496): this a nasty performance drain, but necessary
  // to prevent gaps appearing when the loading spinner disappears.
  // We might be able to fix this another way by triggering a call
  // to updateClippedSubviews manually after loading

  [super layoutSubviews];

  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  }
}

// [macOS
- (BOOL)becomeFirstResponder
{
  if (![super becomeFirstResponder]) {
    return NO;
  }

  // If we've gained focus, notify listeners
  [_eventDispatcher sendEvent:[RCTFocusChangeEvent focusEventWithReactTag:self.reactTag]];

  return YES;
}

- (BOOL)resignFirstResponder
{
  if (![super resignFirstResponder]) {
    return NO;
  }

  // If we've lost focus, notify listeners
  [_eventDispatcher sendEvent:[RCTFocusChangeEvent blurEventWithReactTag:self.reactTag]];

  return YES;
}

#if !TARGET_OS_OSX // [macOS]
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    if ([self.traitCollection hasDifferentColorAppearanceComparedToTraitCollection:previousTraitCollection]) {
      [self.layer setNeedsDisplay];
    }
  }
#endif
}
#endif // [macOS]

#pragma mark - Borders

- (RCTUIColor *)backgroundColor // [macOS] RCTUIColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(RCTUIColor *)backgroundColor // macOS RCTUIColor
{
  if ([_backgroundColor isEqual:backgroundColor]) {
    return;
  }

  _backgroundColor = backgroundColor;
  [self.layer setNeedsDisplay];
}

static CGFloat RCTDefaultIfNegativeTo(CGFloat defaultValue, CGFloat x)
{
  return x >= 0 ? x : defaultValue;
};

- (UIEdgeInsets)bordersAsInsets
{
  const CGFloat borderWidth = MAX(0, _borderWidth);
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat borderStartWidth = RCTDefaultIfNegativeTo(_borderLeftWidth, _borderStartWidth);
    const CGFloat borderEndWidth = RCTDefaultIfNegativeTo(_borderRightWidth, _borderEndWidth);

    const CGFloat directionAwareBorderLeftWidth = isRTL ? borderEndWidth : borderStartWidth;
    const CGFloat directionAwareBorderRightWidth = isRTL ? borderStartWidth : borderEndWidth;

    return (UIEdgeInsets){
        RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
        RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderLeftWidth),
        RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
        RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderRightWidth),
    };
  }

  const CGFloat directionAwareBorderLeftWidth = isRTL ? _borderEndWidth : _borderStartWidth;
  const CGFloat directionAwareBorderRightWidth = isRTL ? _borderStartWidth : _borderEndWidth;

  return (UIEdgeInsets){
      RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
      RCTDefaultIfNegativeTo(borderWidth, RCTDefaultIfNegativeTo(_borderLeftWidth, directionAwareBorderLeftWidth)),
      RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
      RCTDefaultIfNegativeTo(borderWidth, RCTDefaultIfNegativeTo(_borderRightWidth, directionAwareBorderRightWidth)),
  };
}

- (RCTCornerRadii)cornerRadii
{
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  const CGFloat radius = MAX(0, _borderRadius);

  CGFloat topLeftRadius;
  CGFloat topRightRadius;
  CGFloat bottomLeftRadius;
  CGFloat bottomRightRadius;

  const CGFloat logicalTopStartRadius = RCTDefaultIfNegativeTo(_borderStartStartRadius, _borderTopStartRadius);
  const CGFloat logicalTopEndRadius = RCTDefaultIfNegativeTo(_borderStartEndRadius, _borderTopEndRadius);
  const CGFloat logicalBottomStartRadius = RCTDefaultIfNegativeTo(_borderEndStartRadius, _borderBottomStartRadius);
  const CGFloat logicalBottomEndRadius = RCTDefaultIfNegativeTo(_borderEndEndRadius, _borderBottomEndRadius);

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat topStartRadius = RCTDefaultIfNegativeTo(_borderTopLeftRadius, logicalTopStartRadius);
    const CGFloat topEndRadius = RCTDefaultIfNegativeTo(_borderTopRightRadius, logicalTopEndRadius);
    const CGFloat bottomStartRadius = RCTDefaultIfNegativeTo(_borderBottomLeftRadius, logicalBottomStartRadius);
    const CGFloat bottomEndRadius = RCTDefaultIfNegativeTo(_borderBottomRightRadius, logicalBottomEndRadius);

    const CGFloat directionAwareTopLeftRadius = isRTL ? topEndRadius : topStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? topStartRadius : topEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? bottomEndRadius : bottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? bottomStartRadius : bottomEndRadius;

    topLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopLeftRadius);
    topRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopRightRadius);
    bottomLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomLeftRadius);
    bottomRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomRightRadius);
  } else {
    const CGFloat directionAwareTopLeftRadius = isRTL ? logicalTopEndRadius : logicalTopStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? logicalTopStartRadius : logicalTopEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? logicalBottomEndRadius : logicalBottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? logicalBottomStartRadius : logicalBottomEndRadius;

    topLeftRadius =
        RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderTopLeftRadius, directionAwareTopLeftRadius));
    topRightRadius =
        RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderTopRightRadius, directionAwareTopRightRadius));
    bottomLeftRadius =
        RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderBottomLeftRadius, directionAwareBottomLeftRadius));
    bottomRightRadius = RCTDefaultIfNegativeTo(
        radius, RCTDefaultIfNegativeTo(_borderBottomRightRadius, directionAwareBottomRightRadius));
  }

  // Get scale factors required to prevent radii from overlapping
  const CGSize size = self.bounds.size;
  const CGFloat topScaleFactor = RCTZeroIfNaN(MIN(1, size.width / (topLeftRadius + topRightRadius)));
  const CGFloat bottomScaleFactor = RCTZeroIfNaN(MIN(1, size.width / (bottomLeftRadius + bottomRightRadius)));
  const CGFloat rightScaleFactor = RCTZeroIfNaN(MIN(1, size.height / (topRightRadius + bottomRightRadius)));
  const CGFloat leftScaleFactor = RCTZeroIfNaN(MIN(1, size.height / (topLeftRadius + bottomLeftRadius)));

  // Return scaled radii
  return (RCTCornerRadii){
      topLeftRadius * MIN(topScaleFactor, leftScaleFactor),
      topRightRadius * MIN(topScaleFactor, rightScaleFactor),
      bottomLeftRadius * MIN(bottomScaleFactor, leftScaleFactor),
      bottomRightRadius * MIN(bottomScaleFactor, rightScaleFactor),
  };
}

#if !TARGET_OS_OSX // [macOS]
- (RCTBorderColors)borderColorsWithTraitCollection:(UITraitCollection *)traitCollection
#else // [macOS
- (RCTBorderColors)borderColors
#endif // macOS]
{
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  RCTUIColor *directionAwareBorderLeftColor = nil;
  RCTUIColor *directionAwareBorderRightColor = nil;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    RCTUIColor *borderStartColor = _borderStartColor ?: _borderLeftColor; // macOS RCTUIColor
    RCTUIColor *borderEndColor = _borderEndColor ?: _borderRightColor; // macOS RCTUIColor

    directionAwareBorderLeftColor = isRTL ? borderEndColor : borderStartColor;
    directionAwareBorderRightColor = isRTL ? borderStartColor : borderEndColor;
  } else {
    directionAwareBorderLeftColor = (isRTL ? _borderEndColor : _borderStartColor) ?: _borderLeftColor;
    directionAwareBorderRightColor = (isRTL ? _borderStartColor : _borderEndColor) ?: _borderRightColor;
  }

  RCTUIColor *borderColor = _borderColor;
  RCTUIColor *borderTopColor = _borderTopColor;
  RCTUIColor *borderBottomColor = _borderBottomColor;

  if (_borderBlockColor) {
    borderTopColor = _borderBlockColor;
    borderBottomColor = _borderBlockColor;
  }
  if (_borderBlockEndColor) {
    borderBottomColor = _borderBlockEndColor;
  }
  if (_borderBlockStartColor) {
    borderTopColor = _borderBlockStartColor;
  }

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    borderColor = [borderColor resolvedColorWithTraitCollection:self.traitCollection];
    borderTopColor = [borderTopColor resolvedColorWithTraitCollection:self.traitCollection];
    directionAwareBorderLeftColor =
        [directionAwareBorderLeftColor resolvedColorWithTraitCollection:self.traitCollection];
    borderBottomColor = [borderBottomColor resolvedColorWithTraitCollection:self.traitCollection];
    directionAwareBorderRightColor =
        [directionAwareBorderRightColor resolvedColorWithTraitCollection:self.traitCollection];
  }
#endif

  return (RCTBorderColors){
      (borderTopColor ?: borderColor).CGColor,
      (directionAwareBorderLeftColor ?: borderColor).CGColor,
      (borderBottomColor ?: borderColor).CGColor,
      (directionAwareBorderRightColor ?: borderColor).CGColor,
  };
}

- (void)reactSetFrame:(CGRect)frame
{
  // If frame is zero, or below the threshold where the border radii can
  // be rendered as a stretchable image, we'll need to re-render.
  // TODO: detect up-front if re-rendering is necessary
  CGSize oldSize = self.bounds.size;
  [super reactSetFrame:frame];
  if (!CGSizeEqualToSize(self.bounds.size, oldSize)) {
    [self.layer setNeedsDisplay];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  RCTUpdateShadowPathForView(self);
  
#if TARGET_OS_OSX // [macOS
  // clipsToBounds is stubbed out on macOS because it's not part of NSView
  layer.masksToBounds = self.clipsToBounds;
#endif // macOS]

  const RCTCornerRadii cornerRadii = [self cornerRadii];
  const UIEdgeInsets borderInsets = [self bordersAsInsets];
#if !TARGET_OS_OSX // [macOS]
  const RCTBorderColors borderColors = [self borderColorsWithTraitCollection:self.traitCollection];
#else // [macOS
  const RCTBorderColors borderColors = [self borderColors];
#endif // macOS]
  BOOL useIOSBorderRendering = RCTCornerRadiiAreEqual(cornerRadii) && RCTBorderInsetsAreEqual(borderInsets) &&
      RCTBorderColorsAreEqual(borderColors) && _borderStyle == RCTBorderStyleSolid &&

      // iOS draws borders in front of the content whereas CSS draws them behind
      // the content. For this reason, only use iOS border drawing when clipping
      // or when the border is hidden.

      (borderInsets.top == 0 || (borderColors.top && CGColorGetAlpha(borderColors.top) == 0) || self.clipsToBounds);

  // iOS clips to the outside of the border, but CSS clips to the inside. To
  // solve this, we'll need to add a container view inside the main view to
  // correctly clip the subviews.

  CGColorRef backgroundColor;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    backgroundColor = [_backgroundColor resolvedColorWithTraitCollection:self.traitCollection].CGColor;
  } else {
    backgroundColor = _backgroundColor.CGColor;
  }
#else
  backgroundColor = _backgroundColor.CGColor;
#endif

#if TARGET_OS_OSX // [macOS
  CATransform3D transform = [self transform3D];
  CGPoint anchorPoint = [layer anchorPoint];
  if (CGPointEqualToPoint(anchorPoint, CGPointZero) && !CATransform3DEqualToTransform(transform, CATransform3DIdentity)) {
    // https://developer.apple.com/documentation/quartzcore/calayer/1410817-anchorpoint
    // This compensates for the fact that layer.anchorPoint is {0, 0} instead of {0.5, 0.5} on macOS for some reason.
    CATransform3D originAdjust = CATransform3DTranslate(CATransform3DIdentity, self.frame.size.width / 2, self.frame.size.height / 2, 0);
    transform = CATransform3DConcat(CATransform3DConcat(CATransform3DInvert(originAdjust), transform), originAdjust);
    // Enable edge antialiasing in perspective transforms
    [layer setAllowsEdgeAntialiasing:!(transform.m34 == 0.0f)];
  }
  [layer setTransform:transform];
#endif // macOS]
  if (useIOSBorderRendering) {
    layer.cornerRadius = cornerRadii.topLeft;
    layer.borderColor = borderColors.left;
    layer.borderWidth = borderInsets.left;
    layer.backgroundColor = backgroundColor;
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    layer.mask = nil;
    return;
  }

#if TARGET_OS_OSX // [macOS
  CGFloat scaleFactor = self.window.backingScaleFactor;
  if (scaleFactor == 0.0 && RCTRunningInTestEnvironment()) {
    // When running in the test environment the view is not on screen.
    // Use a scaleFactor of 1 so that the test results are machine independent.
    scaleFactor = 1;
  }
  RCTAssert(scaleFactor != 0.0, @"displayLayer occurs before the view is in a window?");
#else
  // On iOS setting the scaleFactor to 0.0 will default to the device's native scale factor.
  CGFloat scaleFactor = 0.0;
#endif // macOS]

  UIImage *image = RCTGetBorderImage(
      _borderStyle, layer.bounds.size, cornerRadii, borderInsets, borderColors, backgroundColor, self.clipsToBounds, scaleFactor); // [macOS]

  layer.backgroundColor = NULL;

  if (image == nil) {
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    return;
  }

  CGRect contentsCenter = ({
    CGSize size = image.size;
    UIEdgeInsets insets = image.capInsets;
    CGRectMake(
        insets.left / size.width, insets.top / size.height, (CGFloat)1.0 / size.width, (CGFloat)1.0 / size.height);
  });

#if !TARGET_OS_OSX // [macOS]
  layer.contents = (id)image.CGImage;
  layer.contentsScale = image.scale;
#else // [macOS
  layer.contents = [image layerContentsForContentsScale:scaleFactor];
  layer.contentsScale = scaleFactor;
#endif // macOS]
  layer.needsDisplayOnBoundsChange = YES;
  layer.magnificationFilter = kCAFilterNearest;

  const BOOL isResizable = !UIEdgeInsetsEqualToEdgeInsets(image.capInsets, UIEdgeInsetsZero);
  if (isResizable) {
    layer.contentsCenter = contentsCenter;
  } else {
    layer.contentsCenter = CGRectMake(0.0, 0.0, 1.0, 1.0);
  }

  [self updateClippingForLayer:layer];
}

static BOOL RCTLayerHasShadow(CALayer *layer)
{
  return layer.shadowOpacity * CGColorGetAlpha(layer.shadowColor) > 0;
}

static void RCTUpdateShadowPathForView(RCTView *view)
{
  if (RCTLayerHasShadow(view.layer)) {
    if (CGColorGetAlpha(view.backgroundColor.CGColor) > 0.999) {
      // If view has a solid background color, calculate shadow path from border
      const RCTCornerRadii cornerRadii = [view cornerRadii];
      const RCTCornerInsets cornerInsets = RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero);
      CGPathRef shadowPath = RCTPathCreateWithRoundedRect(view.bounds, cornerInsets, NULL);
      view.layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);

    } else {
      // Can't accurately calculate box shadow, so fall back to pixel-based shadow
      view.layer.shadowPath = nil;

      RCTLogAdvice(
          @"View #%@ of type %@ has a shadow set but cannot calculate "
           "shadow efficiently. Consider setting a background color to "
           "fix this, or apply the shadow to a more specific component.",
          view.reactTag,
          [view class]);
    }
  }
}

- (void)updateClippingForLayer:(CALayer *)layer
{
  CALayer *mask = nil;
  CGFloat cornerRadius = 0;

  if (self.clipsToBounds) {
    const RCTCornerRadii cornerRadii = [self cornerRadii];
    if (RCTCornerRadiiAreEqual(cornerRadii)) {
      cornerRadius = cornerRadii.topLeft;

    } else {
      CAShapeLayer *shapeLayer = [CAShapeLayer layer];
      CGPathRef path =
          RCTPathCreateWithRoundedRect(self.bounds, RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL);
      shapeLayer.path = path;
      CGPathRelease(path);
      mask = shapeLayer;
    }
  }

  layer.cornerRadius = cornerRadius;
  layer.mask = mask;
}

#pragma mark Border Color

// macOS RCTUIColor
#define setBorderColor(side)                       \
  -(void)setBorder##side##Color : (RCTUIColor *)color \
  {                                                \
    if ([_border##side##Color isEqual:color]) {    \
      return;                                      \
    }                                              \
    _border##side##Color = color;                  \
    [self.layer setNeedsDisplay];                  \
  }

setBorderColor() setBorderColor(Top) setBorderColor(Right) setBorderColor(Bottom) setBorderColor(Left)
    setBorderColor(Start) setBorderColor(End) setBorderColor(Block) setBorderColor(BlockEnd) setBorderColor(BlockStart)

#pragma mark - Border Width

#define setBorderWidth(side)                     \
  -(void)setBorder##side##Width : (CGFloat)width \
  {                                              \
    if (_border##side##Width == width) {         \
      return;                                    \
    }                                            \
    _border##side##Width = width;                \
    [self.layer setNeedsDisplay];                \
  }

        setBorderWidth() setBorderWidth(Top) setBorderWidth(Right) setBorderWidth(Bottom) setBorderWidth(Left)
            setBorderWidth(Start) setBorderWidth(End)

#pragma mark - Border Radius

#define setBorderRadius(side)                      \
  -(void)setBorder##side##Radius : (CGFloat)radius \
  {                                                \
    if (_border##side##Radius == radius) {         \
      return;                                      \
    }                                              \
    _border##side##Radius = radius;                \
    [self.layer setNeedsDisplay];                  \
  }

                setBorderRadius() setBorderRadius(TopLeft) setBorderRadius(TopRight) setBorderRadius(TopStart)
                    setBorderRadius(TopEnd) setBorderRadius(BottomLeft) setBorderRadius(BottomRight)
                        setBorderRadius(BottomStart) setBorderRadius(BottomEnd) setBorderRadius(EndEnd)
                            setBorderRadius(EndStart) setBorderRadius(StartEnd) setBorderRadius(StartStart)

#pragma mark - Border Curve

#define setBorderCurve(side)                            \
  -(void)setBorder##side##Curve : (RCTBorderCurve)curve \
  {                                                     \
    if (_border##side##Curve == curve) {                \
      return;                                           \
    }                                                   \
    _border##side##Curve = curve;                       \
    [self.layer setNeedsDisplay];                       \
  }

                                setBorderCurve()

#pragma mark - Border Style

#define setBorderStyle(side)                            \
  -(void)setBorder##side##Style : (RCTBorderStyle)style \
  {                                                     \
    if (_border##side##Style == style) {                \
      return;                                           \
    }                                                   \
    _border##side##Style = style;                       \
    [self.layer setNeedsDisplay];                       \
  }

                                    setBorderStyle()

#if TARGET_OS_OSX  // [macOS

#pragma mark Focus ring

- (CGRect)focusRingMaskBounds
{
  return self.bounds;
}

- (void)drawFocusRingMask
{
  if ([self enableFocusRing]) {
    CGContextRef context = NSGraphicsContext.currentContext.CGContext;
    RCTCornerInsets cornerInsets = RCTGetCornerInsets(self.cornerRadii, NSEdgeInsetsZero);
    CGPathRef path = RCTPathCreateWithRoundedRect(self.bounds, cornerInsets, NULL);

    CGContextAddPath(context, path);
    CGContextFillPath(context);
    CGPathRelease(path);
  }
}

#pragma mark - macOS Event Handler

- (void)resetCursorRects
{
  [self discardCursorRects];
  NSCursor *cursor = [RCTConvert NSCursor:self.cursor];
  if (cursor) {
    [self addCursorRect:self.bounds cursor:cursor];
  }
}

- (BOOL)needsPanelToBecomeKey {
	// We need to override this so that mouse clicks don't move keyboard focus on focusable views by default. 
	return false;
}

- (BOOL)acceptsFirstResponder
{
	return [self focusable] || [super acceptsFirstResponder];
}

- (void)updateTrackingAreas
{
  if (_trackingArea) {
    [self removeTrackingArea:_trackingArea];
  }

  if (self.onMouseEnter || self.onMouseLeave) {
    _trackingArea = [[NSTrackingArea alloc] initWithRect:self.bounds
                                                 options:NSTrackingActiveAlways|NSTrackingMouseEnteredAndExited
                                                   owner:self
                                                userInfo:nil];
    [self addTrackingArea:_trackingArea];
  }

  [super updateTrackingAreas];
}

- (void)mouseEntered:(NSEvent *)event
{
  _hasMouseOver = YES;
  [self sendMouseEventWithBlock:self.onMouseEnter
                   locationInfo:[self locationInfoFromEvent:event]
                  modifierFlags:event.modifierFlags
                 additionalData:nil];
}

- (void)mouseExited:(NSEvent *)event
{
  _hasMouseOver = NO;
  [self sendMouseEventWithBlock:self.onMouseLeave
                   locationInfo:[self locationInfoFromEvent:event]
                  modifierFlags:event.modifierFlags
                 additionalData:nil];
}

- (BOOL)mouseDownCanMoveWindow{
	return _mouseDownCanMoveWindow;
}

- (void)setMouseDownCanMoveWindow:(BOOL)mouseDownCanMoveWindow{
	_mouseDownCanMoveWindow = mouseDownCanMoveWindow;
}

- (BOOL)allowsVibrancy {
  return _allowsVibrancyInternal;
}

- (NSDictionary*)locationInfoFromEvent:(NSEvent*)event
{
  NSPoint locationInWindow = event.locationInWindow;
  NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];

  return @{@"screenX": @(locationInWindow.x),
           @"screenY": @(locationInWindow.y),
           @"clientX": @(locationInView.x),
           @"clientY": @(locationInView.y)
           };
}

- (void)sendMouseEventWithBlock:(RCTDirectEventBlock)block
                   locationInfo:(NSDictionary*)locationInfo
                  modifierFlags:(NSEventModifierFlags)modifierFlags
                 additionalData:(NSDictionary*)additionalData
{
  if (block == nil) {
    return;
  }
  
  NSMutableDictionary *body = [NSMutableDictionary new];
  
  if (modifierFlags & NSEventModifierFlagShift) {
    body[@"shiftKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagControl) {
    body[@"ctrlKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagOption) {
    body[@"altKey"] = @YES;
  }
  if (modifierFlags & NSEventModifierFlagCommand) {
    body[@"metaKey"] = @YES;
  }

  if (locationInfo) {
    [body addEntriesFromDictionary:locationInfo];
  }

  if (additionalData) {
    [body addEntriesFromDictionary:additionalData];
  }

  block(body);
}

- (NSDictionary*)dataTransferInfoFromPasteboard:(NSPasteboard*)pasteboard
{
  NSArray *fileNames = [pasteboard propertyListForType:NSFilenamesPboardType] ?: @[];
  NSMutableArray *files = [[NSMutableArray alloc] initWithCapacity:fileNames.count];
  NSMutableArray *items = [[NSMutableArray alloc] initWithCapacity:fileNames.count];
  NSMutableArray *types = [[NSMutableArray alloc] initWithCapacity:fileNames.count];
  for (NSString *file in fileNames) {
    NSURL *fileURL = [NSURL fileURLWithPath:file];
    BOOL isDir = NO;
    BOOL isValid = (![[NSFileManager defaultManager] fileExistsAtPath:fileURL.path isDirectory:&isDir] || isDir) ? NO : YES;
    if (isValid) {
      
      NSString *MIMETypeString = nil;
      if (fileURL.pathExtension) {
        CFStringRef fileExtension = (__bridge CFStringRef)fileURL.pathExtension;
        CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension, NULL);
        if (UTI != NULL) {
          CFStringRef MIMEType = UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType);
          CFRelease(UTI);
          MIMETypeString = (__bridge_transfer NSString *)MIMEType;
        }
      }

      NSNumber *fileSizeValue = nil;
      NSError *fileSizeError = nil;
      BOOL success = [fileURL getResourceValue:&fileSizeValue
                                        forKey:NSURLFileSizeKey
                                         error:&fileSizeError];

      NSNumber *width = nil;
      NSNumber *height = nil;
      if ([MIMETypeString hasPrefix:@"image/"]) {
        NSImage *image = [[NSImage alloc] initWithContentsOfURL:fileURL];
        width = @(image.size.width);
        height = @(image.size.height);
      }

      [files addObject:@{@"name": RCTNullIfNil(fileURL.lastPathComponent),
                         @"type": RCTNullIfNil(MIMETypeString),
                         @"uri": RCTNullIfNil(fileURL.path),
                         @"size": success ? fileSizeValue : (id)kCFNull,
                         @"width": RCTNullIfNil(width),
                         @"height": RCTNullIfNil(height)
                         }];

      [items addObject:@{@"kind": @"file",
                         @"type": RCTNullIfNil(MIMETypeString),
                         }];

      [types addObject:RCTNullIfNil(MIMETypeString)];
    }
  }

  NSPasteboardType imageType = [pasteboard availableTypeFromArray:@[NSPasteboardTypePNG, NSPasteboardTypeTIFF]];
  if (imageType && fileNames.count == 0) {
    NSString *MIMETypeString = imageType == NSPasteboardTypePNG ? @"image/png" : @"image/tiff";
    NSData *imageData = [pasteboard dataForType:imageType];
    NSImage *image = [[NSImage alloc] initWithData:imageData];

    [files addObject:@{@"type": RCTNullIfNil(MIMETypeString),
                       @"uri": RCTDataURL(MIMETypeString, imageData).absoluteString,
                       @"size": @(imageData.length),
                       @"width": @(image.size.width),
                       @"height": @(image.size.height),
                      }];

    [items addObject:@{@"kind": @"image",
                       @"type": RCTNullIfNil(MIMETypeString),
                      }];

    [types addObject:RCTNullIfNil(MIMETypeString)];
  }

  return @{@"dataTransfer": @{@"files": files,
                              @"items": items,
                              @"types": types}};
}

- (NSDictionary*)locationInfoFromDraggingLocation:(NSPoint)locationInWindow
{
  NSPoint locationInView = [self convertPoint:locationInWindow fromView:nil];

  return @{@"screenX": @(locationInWindow.x),
           @"screenY": @(locationInWindow.y),
           @"clientX": @(locationInView.x),
           @"clientY": @(locationInView.y)
           };
}

- (NSDragOperation)draggingEntered:(id <NSDraggingInfo>)sender
{
  NSPasteboard *pboard = sender.draggingPasteboard;
  NSDragOperation sourceDragMask = sender.draggingSourceOperationMask;

  [self sendMouseEventWithBlock:self.onDragEnter
                   locationInfo:[self locationInfoFromDraggingLocation:sender.draggingLocation]
                  modifierFlags:0
                 additionalData:[self dataTransferInfoFromPasteboard:pboard]];

  if ([pboard availableTypeFromArray:self.registeredDraggedTypes]) {
    if (sourceDragMask & NSDragOperationLink) {
      return NSDragOperationLink;
    } else if (sourceDragMask & NSDragOperationCopy) {
      return NSDragOperationCopy;
    }
  }
  return NSDragOperationNone;
}

- (void)draggingExited:(id<NSDraggingInfo>)sender
{
  [self sendMouseEventWithBlock:self.onDragLeave
                   locationInfo:[self locationInfoFromDraggingLocation:sender.draggingLocation]
                  modifierFlags:0
                 additionalData:[self dataTransferInfoFromPasteboard:sender.draggingPasteboard]];
}

- (BOOL)performDragOperation:(id <NSDraggingInfo>)sender
{
  [self sendMouseEventWithBlock:self.onDrop
                   locationInfo:[self locationInfoFromDraggingLocation:sender.draggingLocation]
                  modifierFlags:0
                 additionalData:[self dataTransferInfoFromPasteboard:sender.draggingPasteboard]];
  return YES;
}

#pragma mark - Keyboard Events

// This dictionary is attached to the NSEvent being handled so we can ensure we only dispatch it
// once per RCTView\nativeTag. The reason we need to track this state is that certain React native
// views such as RCTUITextView inherit from views (such as NSTextView) which may or may not
// decide to bubble the event to the next responder, and we don't want to dispatch the same
// event more than once (e.g. first from RCTUITextView, and then from it's parent RCTView).
NSMutableDictionary<NSNumber *, NSNumber *> *GetEventDispatchStateDictionary(NSEvent *event) {
	static const char *key = "RCTEventDispatchStateDictionary";
	NSMutableDictionary<NSNumber *, NSNumber *> *dict = objc_getAssociatedObject(event, key);
	if (dict == nil) {
		dict = [NSMutableDictionary new];
		objc_setAssociatedObject(event, key, dict, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	}
	return dict;
}

- (RCTViewKeyboardEvent*)keyboardEvent:(NSEvent*)event shouldBlock:(BOOL *)shouldBlock {
  BOOL keyDown = event.type == NSEventTypeKeyDown;
  NSArray<RCTHandledKey *> *validKeys = keyDown ? self.validKeysDown : self.validKeysUp;

  // If the view is focusable and the component didn't explicity set the validKeysDown or validKeysUp,
  // allow enter/return and spacebar key events to mimic the behavior of native controls.
  if (self.focusable && validKeys == nil) {
    validKeys = @[
      [[RCTHandledKey alloc] initWithKey:@"Enter"],
      [[RCTHandledKey alloc] initWithKey:@" "]
    ];
  }

  // If a view specifies a key, it will always be removed from the responder chain (i.e. "handled")
  *shouldBlock = [RCTHandledKey event:event matchesFilter:validKeys];

  // If an event isn't being removed from the queue, but was requested to "passthrough" by a view,
  // we want to be sure we dispatch it only once for that view. See note for GetEventDispatchStateDictionary.
  if ([self passthroughAllKeyEvents] && !*shouldBlock) {
    NSNumber *tag = [self reactTag];
    NSMutableDictionary<NSNumber *, NSNumber *> *dict = GetEventDispatchStateDictionary(event);

    if ([dict[tag] boolValue]) {
		return nil;
	}

	dict[tag] = @YES;
  }

  // Don't pass events we don't care about
  if (![self passthroughAllKeyEvents] && !*shouldBlock) {
    return nil;
  }

  return [RCTViewKeyboardEvent keyEventFromEvent:event reactTag:self.reactTag];
}

- (BOOL)handleKeyboardEvent:(NSEvent *)event {
  if (event.type == NSEventTypeKeyDown ? self.onKeyDown : self.onKeyUp) {
	BOOL shouldBlock = YES;
    RCTViewKeyboardEvent *keyboardEvent = [self keyboardEvent:event shouldBlock:&shouldBlock];
    if (keyboardEvent) {
      [_eventDispatcher sendEvent:keyboardEvent];
      return shouldBlock;
    }
  }
  return NO;
}

- (void)keyDown:(NSEvent *)event {
  if (![self handleKeyboardEvent:event]) {
    [super keyDown:event];
  }
}

- (void)keyUp:(NSEvent *)event {
  if (![self handleKeyboardEvent:event]) {
    [super keyUp:event];
  }
}
#endif // macOS]

@end
