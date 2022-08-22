/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTView.h"

#import <QuartzCore/QuartzCore.h> // TODO(macOS GH#774) - import needed on macOS to prevent compiler error on invocation of CAShapeLayer further down

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderDrawing.h"
#import "RCTFocusChangeEvent.h" // TODO(OSS Candidate ISS#2710739)
#import "RCTI18nUtil.h"
#import "RCTLog.h"
#import "RCTRootContentView.h" // TODO(macOS GH#774)
#import "RCTViewUtils.h"
#import "UIView+React.h"
#import "RCTViewKeyboardEvent.h"
#if TARGET_OS_OSX // [TODO(macOS GH#774)
#import "RCTTextView.h"
#endif // ]TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
UIAccessibilityTraits const SwitchAccessibilityTrait = 0x20000000000001;
#endif // TODO(macOS GH#774)

@implementation RCTPlatformView (RCTViewUnmounting) // TODO(macOS GH#774)

- (void)react_remountAllSubviews
{
  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (RCTUIView *subview in self.subviews) { // TODO(macOS ISS#3536887)
    [subview react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView // TODO(macOS GH#774)
{
  // Even though we don't support subview unmounting
  // we do support clipsToBounds, so if that's enabled
  // we'll update the clipping

  if (RCTUIViewSetClipsToBounds(self) && self.subviews.count > 0) { // TODO(macOS GH#774) and TODO(macOS ISS#3536887)
    clipRect = [clipView convertRect:clipRect toView:self];
    clipRect = CGRectIntersection(clipRect, self.bounds);
    clipView = self;
  }

  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (RCTUIView *subview in self.subviews) { // TODO(macOS ISS#3536887)
    [subview react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }
}

- (RCTPlatformView *)react_findClipView // TODO(macOS GH#774)
{
  RCTPlatformView *testView = self; // TODO(macOS GH#774)
  RCTPlatformView *clipView = nil; // TODO(macOS GH#774)
  CGRect clipRect = self.bounds;
  // We will only look for a clipping view up the view hierarchy until we hit the root view.
  while (testView) {
    if (RCTUIViewSetClipsToBounds(testView)) { // TODO(macOS GH#774) and TODO(macOS ISS#3536887)
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
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  return clipView ?: self.window;
#else // [TODO(macOS GH#774)
  return clipView ?: self.window.contentView;
#endif // ]TODO(macOS GH#774)
}

@end

static NSString *RCTRecursiveAccessibilityLabel(RCTUIView *view) // TODO(macOS ISS#3536887)
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (RCTUIView *subview in view.subviews) { // TODO(macOS ISS#3536887)
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    NSString *label = subview.accessibilityLabel;
#else // [TODO(macOS GH#774)
    NSString *label;
    if ([subview isKindOfClass:[RCTTextView class]]) {
      // on macOS VoiceOver a text element will always have its accessibilityValue read, but will only read it's accessibilityLabel if it's value is set.
      // the macOS RCTTextView accessibilityValue will return its accessibilityLabel if set otherwise return its text.
      label = subview.accessibilityValue;
    } else {
      label = subview.accessibilityLabel;
    }
#endif // ]TODO(macOS GH#774)
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
  RCTUIColor *_backgroundColor; // TODO(OSS Candidate ISS#2710739)
  id<RCTEventDispatcherProtocol> _eventDispatcher; // TODO(OSS Candidate ISS#2710739)
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  NSTrackingArea *_trackingArea;
  BOOL _hasMouseOver;
#endif // ]TODO(macOS GH#774)
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsNameMap;
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsLabelMap;
}

// [TODO(OSS Candidate ISS#2710739)
- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher
{
  if ((self = [self initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
  }
  return self;
}
// ]TODO(OSS Candidate ISS#2710739)

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
    _borderStyle = RCTBorderStyleSolid;
    _hitTestEdgeInsets = UIEdgeInsetsZero;
#if TARGET_OS_OSX // TODO(macOS GH#774)
    _transform3D = CATransform3DIdentity;
    _shadowColor = nil;
#endif // TODO(macOS GH#774)

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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
#pragma clang diagnostic push // TODO(OSS Candidate ISS#2710739)
#pragma clang diagnostic ignored "-Wunguarded-availability" // TODO(OSS Candidate ISS#2710739)
    self.semanticContentAttribute = layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight
        ? UISemanticContentAttributeForceLeftToRight
        : UISemanticContentAttributeForceRightToLeft;
#pragma clang diagnostic pop // TODO(OSS Candidate ISS#2710739)
  }
#else // [TODO(macOS GH#774)
  self.userInterfaceLayoutDirection =
  layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
  NSUserInterfaceLayoutDirectionLeftToRight :
  NSUserInterfaceLayoutDirectionRightToLeft;
#endif // ]TODO(macOS GH#774)
}

#pragma mark - Hit Testing

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != RCTPointerEventsNone);
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (pointerEvents == RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO;
  }
#endif // TODO(macOS GH#774)
}

- (RCTPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event // TODO(macOS GH#774)
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if (!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  RCTPlatformView *hitSubview = nil; // TODO(macOS GH#774)
  BOOL isPointInside = [self pointInside:point withEvent:event];
  BOOL needsHitSubview = !(_pointerEvents == RCTPointerEventsNone || _pointerEvents == RCTPointerEventsBoxOnly);
  if (needsHitSubview && (![self clipsToBounds] || isPointInside)) {
    // Take z-index into account when calculating the touch target.
    NSArray<RCTUIView *> *sortedSubviews = [self reactZIndexSortedSubviews]; // TODO(macOS ISS#3536887)

    // The default behaviour of UIKit is that if a view does not contain a point,
    // then no subviews will be returned from hit testing, even if they contain
    // the hit point. By doing hit testing directly on the subviews, we bypass
    // the strict containment policy (i.e., UIKit guarantees that every ancestor
    // of the hit view will return YES from -pointInside:withEvent:). See:
    //  - https://developer.apple.com/library/ios/qa/qa2013/qa1812.html
    for (RCTUIView *subview in [sortedSubviews reverseObjectEnumerator]) { // TODO(macOS ISS#3536887)
      CGPoint pointForHitTest = CGPointZero; // [TODO(macOS GH#774)
#if TARGET_OS_OSX
      if ([subview isKindOfClass:[RCTView class]]) {
        pointForHitTest = [subview convertPoint:point fromView:self];
      } else {
        pointForHitTest = point;
      }
#else
      pointForHitTest = [subview convertPoint:point fromView:self];
#endif
      hitSubview = RCTUIViewHitTestWithEvent(subview, pointForHitTest, event); // ]TODO(macOS GH#774) and TODO(macOS ISS#3536887)
      if (hitSubview != nil) {
        break;
      }
    }
  }

  RCTPlatformView *hitView = (isPointInside ? self : nil); // TODO(macOS GH#774)

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
      RCTLogError(@"Invalid pointer-events specified %lld on %@", (long long)_pointerEvents, self);
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
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  // calling super.accessibilityLabel above on macOS causes the return value of this accessor to be ignored by VoiceOver.
  // Calling the super's setAccessibilityLabel with nil ensures that the return value of this accessor is used by VoiceOver.
  [super setAccessibilityLabel:nil];
#endif // ]TODO(macOS GH#774)
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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
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
  NSString *roleDescription = self.accessibilityRoleInternal ? rolesAndStatesDescription[self.accessibilityRoleInternal] : nil; // TODO(OSS Candidate ISS#2710739): renamed prop so it doesn't conflict with -[NSAccessibility accessibilityRole].
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
#else // [TODO(macOS GH#774)
- (id)accessibilityValue {
  id accessibilityValue = nil;
  NSAccessibilityRole role = [self accessibilityRole];
  if (role == NSAccessibilityCheckBoxRole ||
      role == NSAccessibilityRadioButtonRole ||
      role == NSAccessibilityDisclosureTriangleRole) {
    for (NSString *state in [self accessibilityState]) {
      id val = [self accessibilityState][state];
      if (val != nil) {
        if ([state isEqualToString:@"checked"]) {
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
        (_onAccessibilityAction != nil && accessibilityActionsNameMap[@"activate"]) ||
        _onClick != nil) {
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
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  } else if (selector == @selector(accessibilityPerformShowMenu)) {
    if (_onAccessibilityAction != nil && accessibilityActionsNameMap[@"showMenu"]) {
      isAllowed = YES;
    }
#endif // ]TODO(macOS GH#774)
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

#endif // ]TODO(macOS GH#774)

- (RCTPlatformView *)reactAccessibilityElement // TODO(macOS GH#774)
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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (BOOL)accessibilityActivate
#else // [TODO(macOS GH#774)
- (BOOL)accessibilityPerformPress
#endif // ]TODO(macOS GH#774)
{
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  if ([self isAccessibilityEnabled] == NO) {
    return NO;
  }
#endif // ]TODO(macOS GH#774)
  if ([self performAccessibilityAction:@"activate"]) {
    return YES;
  } else if (_onAccessibilityTap) {
    _onAccessibilityTap(nil);
    return YES;
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  } else if (_onClick != nil) {
    // macOS is not simulating a click if there is no onAccessibilityAction like it does on iOS, so we simulate it here.
    _onClick(nil);
    return YES;
#endif // ]TODO(macOS GH#774)
  } else {
    return NO;
  }
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
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
#endif // TODO(macOS GH#774)

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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)accessibilityIncrement
{
  [self performAccessibilityAction:@"increment"];
}
#else // [TODO(macOS GH#774)
- (BOOL)accessibilityPerformIncrement
{
  return [self performAccessibilityAction:@"increment"];
}
#endif // ]TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)accessibilityDecrement
{
  [self performAccessibilityAction:@"decrement"];
}
#else // [TODO(macOS GH#774)
- (BOOL)accessibilityPerformDecrement
{
  return [self performAccessibilityAction:@"decrement"];
}
#endif // ]TODO(macOS GH#774)

#if TARGET_OS_OSX // TODO(macOS GH#774)
- (BOOL)accessibilityPerformShowMenu
{
  return [self performAccessibilityAction:@"showMenu"];
}
#endif // ]TODO(macOS GH#774)

#if DEBUG // TODO(macOS GH#774) description is a debug-only feature
- (NSString *)description
{
  // TODO(macOS GH#774): we shouldn't make assumptions on what super's description is. Just append additional content.
  return [[super description] stringByAppendingFormat:@" reactTag: %@; frame = %@; layer = %@", self.reactTag, NSStringFromCGRect(self.frame), self.layer];
}
#endif // TODO(macOS GH#774)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
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
#endif // ]TODO(macOS GH#774)

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(RCTUIView<RCTAutoInsetsProtocol> *)parentView // TODO(macOS ISS#3536887)
                 withScrollView:(RCTUIScrollView *)scrollView // TODO(macOS ISS#3536887)
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = RCTContentInsets(parentView);
    baseInset.top += autoInset.top;
    baseInset.bottom += autoInset.bottom;
    baseInset.left += autoInset.left;
    baseInset.right += autoInset.right;
  }
#endif // TODO(macOS GH#774)
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
    for (RCTUIView *view in self.reactSubviews) { // TODO(macOS ISS#3536887)
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

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView // TODO(macOS GH#774)
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
  for (RCTUIView *view in self.reactSubviews) { // TODO(macOS ISS#3536887)
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
  RCTPlatformView *clipView = [self react_findClipView]; // TODO(macOS GH#774)
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

// [TODO(OSS Candidate ISS#2710739)
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

#if !TARGET_OS_OSX
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
#endif // !TARGET_OS_OSX

// ]TODO(OSS Candidate ISS#2710739)

#pragma mark - Borders

- (RCTUIColor *)backgroundColor // TODO(OSS Candidate ISS#2710739) RCTUIColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(RCTUIColor *)backgroundColor // TODO(OSS Candidate ISS#2710739) RCTUIColor
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

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat topStartRadius = RCTDefaultIfNegativeTo(_borderTopLeftRadius, _borderTopStartRadius);
    const CGFloat topEndRadius = RCTDefaultIfNegativeTo(_borderTopRightRadius, _borderTopEndRadius);
    const CGFloat bottomStartRadius = RCTDefaultIfNegativeTo(_borderBottomLeftRadius, _borderBottomStartRadius);
    const CGFloat bottomEndRadius = RCTDefaultIfNegativeTo(_borderBottomRightRadius, _borderBottomEndRadius);

    const CGFloat directionAwareTopLeftRadius = isRTL ? topEndRadius : topStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? topStartRadius : topEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? bottomEndRadius : bottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? bottomStartRadius : bottomEndRadius;

    topLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopLeftRadius);
    topRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopRightRadius);
    bottomLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomLeftRadius);
    bottomRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomRightRadius);
  } else {
    const CGFloat directionAwareTopLeftRadius = isRTL ? _borderTopEndRadius : _borderTopStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? _borderTopStartRadius : _borderTopEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? _borderBottomEndRadius : _borderBottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? _borderBottomStartRadius : _borderBottomEndRadius;

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

- (RCTBorderColors)borderColors
{
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    RCTUIColor *borderStartColor = _borderStartColor ?: _borderLeftColor; // TODO(OSS Candidate ISS#2710739) RCTUIColor
    RCTUIColor *borderEndColor = _borderEndColor ?: _borderRightColor; // TODO(OSS Candidate ISS#2710739) RCTUIColor

    RCTUIColor *directionAwareBorderLeftColor = isRTL ? borderEndColor : borderStartColor; // TODO(OSS Candidate ISS#2710739) RCTUIColor
    RCTUIColor *directionAwareBorderRightColor = isRTL ? borderStartColor : borderEndColor; // TODO(OSS Candidate ISS#2710739) RCTUIColor

    return (RCTBorderColors){
        (_borderTopColor ?: _borderColor).CGColor,
        (directionAwareBorderLeftColor ?: _borderColor).CGColor,
        (_borderBottomColor ?: _borderColor).CGColor,
        (directionAwareBorderRightColor ?: _borderColor).CGColor,
    };
  }

  RCTUIColor *directionAwareBorderLeftColor = isRTL ? _borderEndColor : _borderStartColor; // TODO(OSS Candidate ISS#2710739) RCTUIColor
  RCTUIColor *directionAwareBorderRightColor = isRTL ? _borderStartColor : _borderEndColor; // TODO(OSS Candidate ISS#2710739) RCTUIColor

  return (RCTBorderColors){
    (_borderTopColor ?: _borderColor).CGColor,
    (directionAwareBorderLeftColor ?: _borderLeftColor ?: _borderColor).CGColor,
    (_borderBottomColor ?: _borderColor).CGColor,
    (directionAwareBorderRightColor ?: _borderRightColor ?: _borderColor).CGColor,
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
  
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  // clipsToBounds is stubbed out on macOS because it's not part of NSView
  layer.masksToBounds = self.clipsToBounds;
#endif // ]TODO(macOS GH#774)

  const RCTCornerRadii cornerRadii = [self cornerRadii];
  const UIEdgeInsets borderInsets = [self bordersAsInsets];
  const RCTBorderColors borderColors = [self borderColors];

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

#if TARGET_OS_OSX // [TODO(macOS GH#1035)
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
#endif // ]TODO(macOS GH#1035)
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

#if TARGET_OS_OSX // [TODO(macOS GH#774)
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
#endif // ]TODO(macOS GH#774)

  UIImage *image = RCTGetBorderImage(
      _borderStyle, layer.bounds.size, cornerRadii, borderInsets, borderColors, backgroundColor, self.clipsToBounds, scaleFactor); // TODO(OSS Candidate ISS#2710739)

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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  layer.contents = (id)image.CGImage;
  layer.contentsScale = image.scale;
#else // [TODO(macOS GH#774)
  layer.contents = [image layerContentsForContentsScale:scaleFactor];
  layer.contentsScale = scaleFactor;
#endif // ]TODO(macOS GH#774)
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

// TODO(OSS Candidate ISS#2710739) RCTUIColor
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
    setBorderColor(Start) setBorderColor(End)

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
                        setBorderRadius(BottomStart) setBorderRadius(BottomEnd)

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

#pragma mark Focus ring // [TODO(macOS GH#774)

#if TARGET_OS_OSX
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
#endif

#pragma mark - macOS Event Handler

#if TARGET_OS_OSX
- (void)setOnDoubleClick:(RCTDirectEventBlock)block
{
  if (_onDoubleClick != block) {
    _onDoubleClick = [block copy];
  }
}

- (void)mouseUp:(NSEvent *)event
{
  if (_onDoubleClick && event.clickCount == 2) {
    _onDoubleClick(nil);
  }
  else {
    [super mouseUp:event];
  }
}

- (BOOL)acceptsFirstResponder
{
  return ([self focusable] && [NSApp isFullKeyboardAccessEnabled]) || [super acceptsFirstResponder];
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

- (NSDictionary*)dataTransferInfoFromPastboard:(NSPasteboard*)pastboard
{
  if (![pastboard.types containsObject:NSFilenamesPboardType]) {
    return @{};
  }
  
  NSArray *fileNames = [pastboard propertyListForType:NSFilenamesPboardType];
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
      
      [files addObject:@{@"name": RCTNullIfNil(fileURL.lastPathComponent),
                         @"type": RCTNullIfNil(MIMETypeString),
                         @"uri": RCTNullIfNil(fileURL.absoluteString),
                         @"size": success ? fileSizeValue : (id)kCFNull
                         }];
      
      [items addObject:@{@"kind": @"file",
                         @"type": RCTNullIfNil(MIMETypeString),
                         }];
      
      [types addObject:RCTNullIfNil(MIMETypeString)];
    }
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
                 additionalData:[self dataTransferInfoFromPastboard:pboard]];
  
  if ([pboard.types containsObject:NSFilenamesPboardType]) {
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
                 additionalData:[self dataTransferInfoFromPastboard:sender.draggingPasteboard]];
}

- (BOOL)performDragOperation:(id <NSDraggingInfo>)sender
{
  [self sendMouseEventWithBlock:self.onDrop
                   locationInfo:[self locationInfoFromDraggingLocation:sender.draggingLocation]
                  modifierFlags:0
                 additionalData:[self dataTransferInfoFromPastboard:[sender draggingPasteboard]]];
  return YES;
}
#endif // ]TODO(macOS GH#774)

#pragma mark - Keyboard Events

#if TARGET_OS_OSX
- (RCTViewKeyboardEvent*)keyboardEvent:(NSEvent*)event {
  BOOL keyDown = event.type == NSEventTypeKeyDown;
  NSArray<NSString *> *validKeys = keyDown ? self.validKeysDown : self.validKeysUp;
  NSString *key = [RCTViewKeyboardEvent keyFromEvent:event];

  // Only post events for keys we care about
  if (![validKeys containsObject:key]) {
    return nil;
  }

  return [RCTViewKeyboardEvent keyEventFromEvent:event reactTag:self.reactTag];
}

- (BOOL)handleKeyboardEvent:(NSEvent *)event {
  if (event.type == NSEventTypeKeyDown ? self.onKeyDown : self.onKeyUp) {
    RCTViewKeyboardEvent *keyboardEvent = [self keyboardEvent:event];
    if (keyboardEvent) {
      [_eventDispatcher sendEvent:keyboardEvent];
      return YES;
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
#endif // TARGET_OS_OSX

@end
