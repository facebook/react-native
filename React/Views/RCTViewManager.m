/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTViewManager.h"

#import "RCTBridge.h"
#import "RCTBorderStyle.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTShadowView.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

@implementation RCTConvert(UIAccessibilityTraits)

RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"text": @(UIAccessibilityTraitStaticText),
  @"summary": @(UIAccessibilityTraitSummaryElement),
  @"disabled": @(UIAccessibilityTraitNotEnabled),
  @"frequentUpdates": @(UIAccessibilityTraitUpdatesFrequently),
  @"startsMedia": @(UIAccessibilityTraitStartsMediaSession),
  @"adjustable": @(UIAccessibilityTraitAdjustable),
  @"allowsDirectInteraction": @(UIAccessibilityTraitAllowsDirectInteraction),
  @"pageTurn": @(UIAccessibilityTraitCausesPageTurn),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation RCTViewManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return RCTGetUIManagerQueue();
}

- (UIView *)view
{
  return [RCTView new];
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

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused RCTShadowView *)shadowView
{
  return nil;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
RCT_CUSTOM_VIEW_PROPERTY(overflow, CSSOverflow, RCTView)
{
  if (json) {
    view.clipsToBounds = [RCTConvert CSSOverflow:json] != CSSOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, RCTView)
{
  view.layer.shouldRasterize = json ? [RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
// TODO: t11041683 Remove this duplicate property name.
RCT_CUSTOM_VIEW_PROPERTY(transformMatrix, CATransform3D, RCTView)
{
  view.layer.transform = json ? [RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, RCTView)
{
  view.layer.transform = json ? [RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
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
RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [RCTConvert CGColor:json] : defaultView.borderColor;
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
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMagicTap, RCTDirectEventBlock)

#define RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

RCT_VIEW_BORDER_PROPERTY(Top)
RCT_VIEW_BORDER_PROPERTY(Right)
RCT_VIEW_BORDER_PROPERTY(Bottom)
RCT_VIEW_BORDER_PROPERTY(Left)

#define RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

RCT_REMAP_VIEW_PROPERTY(zIndex, reactZIndex, NSInteger)

#pragma mark - ShadowView properties

RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

RCT_EXPORT_SHADOW_PROPERTY(top, float)
RCT_EXPORT_SHADOW_PROPERTY(right, float)
RCT_EXPORT_SHADOW_PROPERTY(bottom, float)
RCT_EXPORT_SHADOW_PROPERTY(left, float);

RCT_EXPORT_SHADOW_PROPERTY(width, float)
RCT_EXPORT_SHADOW_PROPERTY(height, float)

RCT_EXPORT_SHADOW_PROPERTY(minWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(maxWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(minHeight, float)
RCT_EXPORT_SHADOW_PROPERTY(maxHeight, float)

RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

RCT_EXPORT_SHADOW_PROPERTY(marginTop, float)
RCT_EXPORT_SHADOW_PROPERTY(marginRight, float)
RCT_EXPORT_SHADOW_PROPERTY(marginBottom, float)
RCT_EXPORT_SHADOW_PROPERTY(marginLeft, float)
RCT_EXPORT_SHADOW_PROPERTY(marginVertical, float)
RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, float)
RCT_EXPORT_SHADOW_PROPERTY(margin, float)

RCT_EXPORT_SHADOW_PROPERTY(paddingTop, float)
RCT_EXPORT_SHADOW_PROPERTY(paddingRight, float)
RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, float)
RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, float)
RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, float)
RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, float)
RCT_EXPORT_SHADOW_PROPERTY(padding, float)

RCT_EXPORT_SHADOW_PROPERTY(flex, float)
RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
RCT_EXPORT_SHADOW_PROPERTY(flexBasis, float)
RCT_EXPORT_SHADOW_PROPERTY(flexDirection, CSSFlexDirection)
RCT_EXPORT_SHADOW_PROPERTY(flexWrap, CSSWrapType)
RCT_EXPORT_SHADOW_PROPERTY(justifyContent, CSSJustify)
RCT_EXPORT_SHADOW_PROPERTY(alignItems, CSSAlign)
RCT_EXPORT_SHADOW_PROPERTY(alignSelf, CSSAlign)
RCT_EXPORT_SHADOW_PROPERTY(position, CSSPositionType)

RCT_EXPORT_SHADOW_PROPERTY(overflow, CSSOverflow)

RCT_EXPORT_SHADOW_PROPERTY(onLayout, RCTDirectEventBlock)

RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)

@end
