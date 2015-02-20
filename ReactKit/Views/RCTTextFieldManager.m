// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTextFieldManager.h"

#import "RCTConvert.h"
#import "RCTShadowView.h"
#import "RCTTextField.h"

@implementation RCTTextFieldManager

- (UIView *)view
{
  return [[RCTTextField alloc] initWithEventDispatcher:self.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(caretHidden)
RCT_EXPORT_VIEW_PROPERTY(autoCorrect)
RCT_EXPORT_VIEW_PROPERTY(enabled)
RCT_EXPORT_VIEW_PROPERTY(placeholder)
RCT_EXPORT_VIEW_PROPERTY(text)
RCT_EXPORT_VIEW_PROPERTY(font)
RCT_REMAP_VIEW_PROPERTY(autoCapitalize, autocapitalizationType)
RCT_EXPORT_VIEW_PROPERTY(keyboardType)
RCT_REMAP_VIEW_PROPERTY(color, textColor)

- (void)set_fontSize:(id)json
             forView:(RCTTextField *)view
     withDefaultView:(RCTTextField *)defaultView
{
  view.font = [RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}

- (void)set_FontWeight:(id)json
               forView:(RCTTextField *)view
       withDefaultView:(RCTTextField *)defaultView
{
  view.font = [RCTConvert UIFont:view.font withWeight:json]; // TODO
}

- (void)set_fontFamily:(id)json
               forView:(RCTTextField *)view
       withDefaultView:(RCTTextField *)defaultView
{
  view.font = [RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}

// TODO: original code set view.paddingEdgeInsets from shadowView.paddingAsInsets
// could it be that this property is calculated asynchrously on shadow thread?

@end

