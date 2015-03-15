// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTViewManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTShadowView.h"
#import "RCTUtils.h"
#import "RCTView.h"

@implementation RCTViewManager

@synthesize bridge = _bridge;

+ (NSString *)moduleName
{
  // Default implementation, works in most cases
  NSString *name = NSStringFromClass(self);
  if ([name hasPrefix:@"RK"]) {
    name = [name stringByReplacingCharactersInRange:(NSRange){0,@"RK".length} withString:@"RCT"];
  }
  if ([name hasPrefix:@"RCTUI"]) {
    name = [name substringFromIndex:@"RCT".length];
  }
  return name;
}

- (UIView *)view
{
  return [[RCTView alloc] init];
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowView alloc] init];
}

+ (NSDictionary *)customBubblingEventTypes
{
  return nil;
}

+ (NSDictionary *)customDirectEventTypes
{
  return nil;
}

- (NSDictionary *)constantsToExport
{
  return nil;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowView *)shadowView
{
  return nil;
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry
{
  return nil;
}

// View properties

RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel)
RCT_EXPORT_VIEW_PROPERTY(hidden)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor)
RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement)
RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier)
RCT_REMAP_VIEW_PROPERTY(opacity, alpha)
RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor);
RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset);
RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity)
RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius)
RCT_REMAP_VIEW_PROPERTY(borderColor, layer.borderColor);
RCT_REMAP_VIEW_PROPERTY(borderRadius, layer.cornerRadius)
RCT_REMAP_VIEW_PROPERTY(borderWidth, layer.borderWidth)
RCT_REMAP_VIEW_PROPERTY(transformMatrix, layer.transform)
RCT_CUSTOM_VIEW_PROPERTY(overflow, UIView)
{
  view.clipsToBounds = json ? ![RCTConvert css_overflow:json] : defaultView.clipsToBounds;
}
RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [RCTConvert RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([RCTConvert NSInteger:json]) {
    case RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactKit`. "auto" may override a parent's "none".
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

// ShadowView properties

RCT_CUSTOM_SHADOW_PROPERTY(backgroundColor, RCTShadowView)
{
  view.backgroundColor = json ? [RCTConvert UIColor:json] : defaultView.backgroundColor;
  view.isBGColorExplicitlySet = json ? YES : defaultView.isBGColorExplicitlySet;
}
RCT_CUSTOM_SHADOW_PROPERTY(flexDirection, RCTShadowView)
{
  view.flexDirection = json? [RCTConvert css_flex_direction_t:json] : defaultView.flexDirection;
}
RCT_CUSTOM_SHADOW_PROPERTY(flexWrap, RCTShadowView)
{
  view.flexWrap = json ? [RCTConvert css_wrap_type_t:json] : defaultView.flexWrap;
}
RCT_CUSTOM_SHADOW_PROPERTY(justifyContent, RCTShadowView)
{
  view.justifyContent = json ? [RCTConvert css_justify_t:json] : defaultView.justifyContent;
}
RCT_CUSTOM_SHADOW_PROPERTY(alignItems, RCTShadowView)
{
  view.alignItems = json ? [RCTConvert css_align_t:json] : defaultView.alignItems;
}
RCT_CUSTOM_SHADOW_PROPERTY(alignSelf, RCTShadowView)
{
  view.alignSelf = json ? [RCTConvert css_align_t:json] : defaultView.alignSelf;
}
RCT_CUSTOM_SHADOW_PROPERTY(position, RCTShadowView)
{
  view.positionType = json ? [RCTConvert css_position_type_t:json] : defaultView.positionType;
}

@end
