/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewManager.h"

#import "RCTAssert.h"
#import "RCTBorderStyle.h"
#import "RCTBridge.h"
#import "RCTConvert+Transform.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTShadowView.h"
#import "RCTSinglelineTextInputView.h" // TODO(macOS GH#768)
#import "RCTUIManager.h"
#import "RCTUIManagerUtils.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@implementation RCTConvert (UIAccessibilityTraits)

RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"togglebutton" : @(UIAccessibilityTraitButton),
      @"link" : @(UIAccessibilityTraitLink),
      @"header" : @(UIAccessibilityTraitHeader),
      @"search" : @(UIAccessibilityTraitSearchField),
      @"image" : @(UIAccessibilityTraitImage),
      @"imagebutton" : @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
      @"selected" : @(UIAccessibilityTraitSelected),
      @"plays" : @(UIAccessibilityTraitPlaysSound),
      @"key" : @(UIAccessibilityTraitKeyboardKey),
      @"keyboardkey" : @(UIAccessibilityTraitKeyboardKey),
      @"text" : @(UIAccessibilityTraitStaticText),
      @"summary" : @(UIAccessibilityTraitSummaryElement),
      @"disabled" : @(UIAccessibilityTraitNotEnabled),
      @"frequentUpdates" : @(UIAccessibilityTraitUpdatesFrequently),
      @"startsMedia" : @(UIAccessibilityTraitStartsMediaSession),
      @"adjustable" : @(UIAccessibilityTraitAdjustable),
      @"allowsDirectInteraction" : @(UIAccessibilityTraitAllowsDirectInteraction),
      @"pageTurn" : @(UIAccessibilityTraitCausesPageTurn),
      // [TODO(macOS GH#774):
      // a set of RN accessibilityTraits are macOS specific accessiblity roles and map to nothing on iOS:
      @"disclosure" : @(UIAccessibilityTraitNone),
      @"group" : @(UIAccessibilityTraitNone),
      @"table": @(UIAccessibilityTraitNone),
      // ]TODO(macOS GH#774)
      @"alert" : @(UIAccessibilityTraitNone),
      @"checkbox" : @(UIAccessibilityTraitNone),
      @"combobox" : @(UIAccessibilityTraitNone),
      @"menu" : @(UIAccessibilityTraitNone),
      @"menubar" : @(UIAccessibilityTraitNone),
      @"menuitem" : @(UIAccessibilityTraitNone),
      @"progressbar" : @(UIAccessibilityTraitUpdatesFrequently),
      @"radio" : @(UIAccessibilityTraitNone),
      @"radiogroup" : @(UIAccessibilityTraitNone),
      @"scrollbar" : @(UIAccessibilityTraitNone),
      @"spinbutton" : @(UIAccessibilityTraitNone),
      @"switch" : @(SwitchAccessibilityTrait),
      @"tab" : @(UIAccessibilityTraitNone),
      @"tabbar" : @(UIAccessibilityTraitTabBar),
      @"tablist" : @(UIAccessibilityTraitNone),
      @"timer" : @(UIAccessibilityTraitNone),
      @"toolbar" : @(UIAccessibilityTraitNone),
      @"list" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end
#endif // TODO(macOS GH#774)

@implementation RCTViewManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return RCTGetUIManagerQueue();
}

- (void)setBridge:(RCTBridge *)bridge
{
  RCTWarnNotAllowedForNewArchitecture(self, @"RCTViewManager must not be initialized for the new architecture");
  _bridge = bridge;
}

- (RCTPlatformView *)view // TODO(macOS GH#774)
{
  return [[RCTView alloc] initWithEventDispatcher:self.bridge.eventDispatcher]; // TODO(OSS Candidate ISS#2710739)
}

- (RCTShadowView *)shadowView
{
  return [RCTShadowView new];
}

- (NSArray<NSString *> *)customBubblingEventTypes
{
  return @[

    // Generic events
    @"press",
    @"change",
    @"focus",
    @"blur",
    @"submitEditing",
    @"endEditing",
    @"keyPress",

    // Touch events
    @"touchStart",
    @"touchMove",
    @"touchCancel",
    @"touchEnd",
  ];
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
RCT_EXPORT_METHOD(focus : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTUIView *> *viewRegistry) {
    RCTUIView *view = viewRegistry[viewTag];
    [view reactFocus];
  }];
}

RCT_EXPORT_METHOD(blur : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTUIView *> *viewRegistry) {
    RCTUIView *view = viewRegistry[viewTag];
    [view reactBlur];
  }];
}
#endif // ]TODO(macOS GH#774)

#pragma mark - View properties

// Accessibility related properties
#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(accessible, reactAccessibilityElement.isAccessibilityElement, BOOL)
#else // [TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(accessible, reactAccessibilityElement.accessibilityElement, BOOL)
#endif // ]TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(accessibilityActions, reactAccessibilityElement.accessibilityActions, NSDictionaryArray)
RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, reactAccessibilityElement.accessibilityLabel, NSString)
#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(accessibilityHint, reactAccessibilityElement.accessibilityHint, NSString)
#else // [TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(accessibilityHint, reactAccessibilityElement.accessibilityHelp, NSString)
#endif // TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(accessibilityValue, reactAccessibilityElement.accessibilityValueInternal, NSDictionary)
#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, reactAccessibilityElement.accessibilityViewIsModal, BOOL)
RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, reactAccessibilityElement.accessibilityElementsHidden, BOOL)
RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    reactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
#endif // ]TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, reactAccessibilityElement.onAccessibilityAction, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, reactAccessibilityElement.onAccessibilityTap, RCTDirectEventBlock)
#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(onMagicTap, reactAccessibilityElement.onMagicTap, RCTDirectEventBlock)
#else // [TODO(macOS GH#774): accessibilityTraits is gone in react-native and deprecated in react-native-macos, use accessibilityRole instead
RCT_CUSTOM_VIEW_PROPERTY(accessibilityTraits, NSString, RCTView)
{
  if (json) {
    view.accessibilityRole = [RCTConvert accessibilityRoleFromTraits:json];
  } else {
    view.accessibilityRole = defaultView.accessibilityRole;
  }
}
#endif // ]TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, reactAccessibilityElement.onAccessibilityEscape, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(testID, reactAccessibilityElement.accessibilityIdentifier, NSString)

RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
#else // [TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(opacity, alphaValue, CGFloat)
#endif // ]TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
RCT_CUSTOM_VIEW_PROPERTY(overflow, YGOverflow, RCTView)
{
  if (json) {
    view.clipsToBounds = [RCTConvert YGOverflow:json] != YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, RCTView)
{
  view.layer.shouldRasterize = json ? [RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
#endif // TODO(macOS GH#774)

RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, RCTView)
{
#if TARGET_OS_OSX // [TODO(macOS GH#460)
  CATransform3D transform = json ? [RCTConvert CATransform3D:json] : defaultView.layer.transform;
  [view setTransform3D:transform];
  [view setNeedsDisplay];
#else  // ]TODO(macOS GH#460)]
  view.layer.transform = json ? [RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in rotation, skew, or perspective transforms
  view.layer.allowsEdgeAntialiasing =
      view.layer.transform.m12 != 0.0f || view.layer.transform.m21 != 0.0f || view.layer.transform.m34 != 0.0f;
#endif // [TODO(macOS GH#460)]
}

RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, RCTView)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | UIAccessibilityTraitTabBar |
      UIAccessibilityTraitUpdatesFrequently | SwitchAccessibilityTrait;
  view.reactAccessibilityElement.accessibilityTraits =
      view.reactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.reactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [RCTConvert NSString:json] : @"";
    view.reactAccessibilityElement.accessibilityRoleInternal = role; // TODO(OSS Candidate ISS#2710739): renamed prop so it doesn't conflict with -[NSAccessibility accessibilityRole].
  }
#else // [TODO(macOS GH#774)
  if (json) {
    view.reactAccessibilityElement.accessibilityRole = [RCTConvert accessibilityRoleFromTraits:json];
  } else {
    view.reactAccessibilityElement.accessibilityRole = defaultView.accessibilityRole;
  }
#endif // ]TODO(macOS GH#774)
}

RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [NSMutableDictionary<NSString *, id> new];

  if (!state) {
    return;
  }

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.reactAccessibilityElement.accessibilityTraits =
      view.reactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.reactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.reactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
#else // [TODO(macOS GH#774)
  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (val == nil) {
      continue;
    }
    newState[s] = val;
  }
#endif // ]TODO(macOS GH#774)
  if (newState.count > 0) {
    view.reactAccessibilityElement.accessibilityState = newState;
  } else {
    view.reactAccessibilityElement.accessibilityState = nil;
  }
}

RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, RCTView)
{
  view.nativeID = json ? [RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, RCTPointerEvents, RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [RCTConvert RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([RCTConvert RCTPointerEvents:json]) {
    case RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [RCTConvert UIColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(borderStyle, RCTBorderStyle, RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [RCTConvert RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
// macOS properties
RCT_CUSTOM_VIEW_PROPERTY(acceptsFirstMouse, BOOL, RCTView)
{
  if ([view respondsToSelector:@selector(setAcceptsFirstMouse:)]) {
    view.acceptsFirstMouse = json ? [RCTConvert BOOL:json] : defaultView.acceptsFirstMouse;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(focusable, BOOL, RCTView)
{
  if ([view respondsToSelector:@selector(setFocusable:)]) {
    view.focusable = json ? [RCTConvert BOOL:json] : defaultView.focusable;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(enableFocusRing, BOOL, RCTView)
{
  if ([view respondsToSelector:@selector(setEnableFocusRing:)]) {
    view.enableFocusRing = json ? [RCTConvert BOOL:json] : defaultView.enableFocusRing;
  }
}

RCT_REMAP_VIEW_PROPERTY(tooltip, toolTip, NSString)

RCT_CUSTOM_VIEW_PROPERTY(draggedTypes, NSArray<NSPasteboardType>*, RCTView)
{
  NSArray<NSPasteboardType> *currentTypes = view.registeredDraggedTypes;
  NSArray<NSPasteboardType> *types = json ? [RCTConvert NSPasteboardTypeArray:json] : defaultView.registeredDraggedTypes;
  if (![currentTypes isEqualToArray:types]) {
    [view unregisterDraggedTypes];
  }
  [view registerForDraggedTypes:types];
}

#endif // ]TODO(macOS GH#774)

RCT_CUSTOM_VIEW_PROPERTY(collapsable, BOOL, RCTView)
{
  // Property is only to be used in the new renderer.
  // It is necessary to add it here, otherwise it gets
  // filtered by view configs.
}

#define RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [RCTConvert UIColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

RCT_VIEW_BORDER_PROPERTY(Top)
RCT_VIEW_BORDER_PROPERTY(Right)
RCT_VIEW_BORDER_PROPERTY(Bottom)
RCT_VIEW_BORDER_PROPERTY(Left)
RCT_VIEW_BORDER_PROPERTY(Start)
RCT_VIEW_BORDER_PROPERTY(End)

#define RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

RCT_REMAP_VIEW_PROPERTY(display, reactDisplay, YGDisplay)
RCT_REMAP_VIEW_PROPERTY(zIndex, reactZIndex, NSInteger)

// [TODO(OSS Candidate ISS#2710739)
RCT_EXPORT_VIEW_PROPERTY(onFocus, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onBlur, RCTBubblingEventBlock)
// ]TODO(OSS Candidate ISS#2710739)


#if TARGET_OS_OSX // [TODO(macOS GH#774)
#pragma mark - macOS properties

RCT_EXPORT_VIEW_PROPERTY(onDoubleClick, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onClick, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMouseEnter, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMouseLeave, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDragEnter, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDragLeave, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDrop, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onKeyDown, RCTDirectEventBlock) // macOS keyboard events
RCT_EXPORT_VIEW_PROPERTY(onKeyUp, RCTDirectEventBlock) // macOS keyboard events
RCT_CUSTOM_VIEW_PROPERTY(validKeysDown, NSArray<NSString*>, RCTView)
{
  if ([view respondsToSelector:@selector(setValidKeysDown:)]) {
    view.validKeysDown = [RCTConvert NSArray:json];
  }
}
RCT_CUSTOM_VIEW_PROPERTY(validKeysUp, NSArray<NSString*>, RCTView)
{
  if ([view respondsToSelector:@selector(setValidKeysUp:)]) {
    view.validKeysUp = [RCTConvert NSArray:json];
  }
}
#endif // ]TODO(macOS GH#774)
#if TARGET_OS_OSX // [TODO(macOS GH#768)
RCT_CUSTOM_VIEW_PROPERTY(nextKeyViewTag, NSNumber, RCTView)
{
  NSNumber *nextKeyViewTag = [RCTConvert NSNumber:json];

  RCTUIManager *uiManager = [[self bridge] uiManager];
  NSView *nextKeyView = [uiManager viewForReactTag:nextKeyViewTag];
    if (nextKeyView) {
      NSView *targetView = view;
      // The TextInput component is implemented as a RCTUITextField wrapped by a RCTSinglelineTextInputView,
      // so we need to get the first subview to properly transfer focus
      if ([targetView isKindOfClass:[RCTSinglelineTextInputView class]]) {
        targetView = [[view subviews] firstObject];
      }
      if ([nextKeyView isKindOfClass:[RCTSinglelineTextInputView class]]) {
        nextKeyView = [[nextKeyView subviews] firstObject];
      }
      [targetView setNextKeyView:nextKeyView];
    }
}

RCT_EXPORT_METHOD(recalculateKeyViewLoop: (nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTUIView *> *viewRegistry) {
    RCTUIView *view = viewRegistry[reactTag];
    if (!view) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
    }
    [[view window] recalculateKeyViewLoop];
  }];
}
#endif // ]TODO(macOS GH#768)

#pragma mark - ShadowView properties

RCT_EXPORT_SHADOW_PROPERTY(top, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(right, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(start, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(end, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(bottom, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(left, YGValue)

RCT_EXPORT_SHADOW_PROPERTY(width, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(height, YGValue)

RCT_EXPORT_SHADOW_PROPERTY(minWidth, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(maxWidth, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(minHeight, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(maxHeight, YGValue)

RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

RCT_EXPORT_SHADOW_PROPERTY(marginTop, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(marginRight, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(marginBottom, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(marginLeft, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(marginStart, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(marginEnd, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(marginVertical, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(margin, YGValue)

RCT_EXPORT_SHADOW_PROPERTY(paddingTop, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(paddingRight, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(paddingStart, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(padding, YGValue)

RCT_EXPORT_SHADOW_PROPERTY(flex, float)
RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
RCT_EXPORT_SHADOW_PROPERTY(flexBasis, YGValue)
RCT_EXPORT_SHADOW_PROPERTY(flexDirection, YGFlexDirection)
RCT_EXPORT_SHADOW_PROPERTY(flexWrap, YGWrap)
RCT_EXPORT_SHADOW_PROPERTY(justifyContent, YGJustify)
RCT_EXPORT_SHADOW_PROPERTY(alignItems, YGAlign)
RCT_EXPORT_SHADOW_PROPERTY(alignSelf, YGAlign)
RCT_EXPORT_SHADOW_PROPERTY(alignContent, YGAlign)
RCT_EXPORT_SHADOW_PROPERTY(position, YGPositionType)
RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

RCT_EXPORT_SHADOW_PROPERTY(overflow, YGOverflow)
RCT_EXPORT_SHADOW_PROPERTY(display, YGDisplay)

RCT_EXPORT_SHADOW_PROPERTY(onLayout, RCTDirectEventBlock)

RCT_EXPORT_SHADOW_PROPERTY(direction, YGDirection)

@end
