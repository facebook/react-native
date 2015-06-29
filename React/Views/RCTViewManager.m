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
  return [_bridge.uiManager methodQueue];
}

- (UIView *)view
{
  return [[RCTView alloc] init];
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowView alloc] init];
}

- (NSDictionary *)customBubblingEventTypes
{
  return nil;
}

- (NSDictionary *)customDirectEventTypes
{
  return nil;
}

- (NSDictionary *)constantsToExport
{
  return nil;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused RCTShadowView *)shadowView
{
  return nil;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused RCTSparseArray *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor);
RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize);
RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
RCT_REMAP_VIEW_PROPERTY(transformMatrix, layer.transform, CATransform3D)
RCT_REMAP_VIEW_PROPERTY(overflow, clipsToBounds, css_clip_t)
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
    if (json) {
      view.borderRadius = [RCTConvert CGFloat:json];
    } else if ([view respondsToSelector:@selector(borderRadius)]) {
      view.borderRadius = [defaultView borderRadius];
    } else {
      view.borderRadius = defaultView.layer.cornerRadius;
    }
  } else {
    if (json) {
      view.layer.cornerRadius = [RCTConvert CGFloat:json];
    } else {
      view.layer.cornerRadius = defaultView.layer.cornerRadius;
    }
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
RCT_CUSTOM_VIEW_PROPERTY(borderWidth, CGFloat, RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(onAccessibilityTap, BOOL, __unused RCTView)
{
  view.accessibilityTapHandler = [self eventHandlerWithName:@"topAccessibilityTap" json:json];
}
RCT_CUSTOM_VIEW_PROPERTY(onMagicTap, BOOL, __unused RCTView)
{
  view.magicTapHandler = [self eventHandlerWithName:@"topMagicTap" json:json];
}

- (RCTViewEventHandler)eventHandlerWithName:(NSString *)eventName json:(id)json
{
  RCTViewEventHandler handler = nil;
  if ([RCTConvert BOOL:json]) {
    __weak RCTViewManager *weakSelf = self;
    handler = ^(RCTView *tappedView) {
      NSDictionary *body = @{ @"target": tappedView.reactTag };
      [weakSelf.bridge.eventDispatcher sendInputEventWithName:eventName body:body];
    };
  }
  return handler;
}

#define RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, CGFloat, RCTView)         \
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

#pragma mark - ShadowView properties

RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

RCT_EXPORT_SHADOW_PROPERTY(top, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(right, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(bottom, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(left, CGFloat);

RCT_EXPORT_SHADOW_PROPERTY(width, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(height, CGFloat)

RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, CGFloat)
RCT_CUSTOM_SHADOW_PROPERTY(borderWidth, CGFloat, __unused RCTShadowView) {
  [view setBorderWidth:[RCTConvert CGFloat:json]];
}

RCT_EXPORT_SHADOW_PROPERTY(marginTop, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(marginRight, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(marginBottom, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(marginLeft, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(marginVertical, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(margin, CGFloat)

RCT_EXPORT_SHADOW_PROPERTY(paddingTop, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(paddingRight, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(padding, CGFloat)

RCT_EXPORT_SHADOW_PROPERTY(flex, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(flexDirection, css_flex_direction_t)
RCT_EXPORT_SHADOW_PROPERTY(flexWrap, css_wrap_type_t)
RCT_EXPORT_SHADOW_PROPERTY(justifyContent, css_justify_t)
RCT_EXPORT_SHADOW_PROPERTY(alignItems, css_align_t)
RCT_EXPORT_SHADOW_PROPERTY(alignSelf, css_align_t)
RCT_REMAP_SHADOW_PROPERTY(position, positionType, css_position_type_t)

RCT_REMAP_SHADOW_PROPERTY(onLayout, hasOnLayout, BOOL)

@end
