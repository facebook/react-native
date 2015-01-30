// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTUIViewManager.h"

#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTShadowView.h"
#import "RCTView.h"

@implementation RCTUIViewManager

- (UIView *)viewWithEventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher
{
  return [[UIView alloc] init];
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
RCT_REMAP_VIEW_PROPERTY(transformMatrix, view.layer.transform)

- (void)set_overflow:(id)json
             forView:(UIView *)view
     withDefaultView:(UIView *)defaultView
{
  view.clipsToBounds = json ? ![RCTConvert css_overflow:json] : defaultView.clipsToBounds;
}

- (void)set_pointerEvents:(id)json
                  forView:(UIView *)view
          withDefaultView:(UIView *)defaultView
{
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

- (void)set_backgroundColor:(id)json
              forShadowView:(RCTShadowView *)shadowView
            withDefaultView:(RCTShadowView *)defaultView
{
  shadowView.backgroundColor = json ? [RCTConvert UIColor:json] : defaultView.backgroundColor;
  shadowView.isBGColorExplicitlySet = json ? YES : defaultView.isBGColorExplicitlySet;
}

- (void)set_flexDirection:(id)json
            forShadowView:(RCTShadowView *)shadowView
          withDefaultView:(RCTShadowView *)defaultView
{
  shadowView.flexDirection = json? [RCTConvert css_flex_direction_t:json] : defaultView.flexDirection;
}

- (void)set_flexWrap:(id)json
       forShadowView:(RCTShadowView *)shadowView
     withDefaultView:(RCTShadowView *)defaultView
{
  shadowView.flexWrap = json ? [RCTConvert css_wrap_type_t:json] : defaultView.flexWrap;
}

- (void)set_justifyContent:(id)json
             forShadowView:(RCTShadowView *)shadowView
           withDefaultView:(RCTShadowView *)defaultView
{
  shadowView.justifyContent = json ? [RCTConvert css_justify_t:json] : defaultView.justifyContent;
}

- (void)set_alignItems:(id)json
         forShadowView:(RCTShadowView *)shadowView
       withDefaultView:(RCTShadowView *)defaultView
{
  shadowView.alignItems = json ? [RCTConvert css_align_t:json] : defaultView.alignItems;
}

- (void)set_alignSelf:(id)json
        forShadowView:(RCTShadowView *)shadowView
      withDefaultView:(RCTShadowView *)defaultView
{
  shadowView.alignSelf = json ? [RCTConvert css_align_t:json] : defaultView.alignSelf;
}

- (void)set_position:(id)json
       forShadowView:(RCTShadowView *)shadowView
     withDefaultView:(RCTShadowView *)defaultView
{
  shadowView.positionType = json ? [RCTConvert css_position_type_t:json] : defaultView.positionType;
}

@end
