/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPickerManager.h"

#import "RCTBridge.h"
#import "RCTPicker.h"
#import "RCTFont.h"
#import <React/RCTUIManager.h>

@implementation RCTPickerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTPicker new];
}

RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, RCTPicker)
{
  view.font = [RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused RCTPicker)
{
  view.font = [RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused RCTPicker)
{
  view.font = [RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, RCTPicker)
{
  view.font = [RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

RCT_EXPORT_METHOD(setNativeSelectedIndex : (nonnull NSNumber *)viewTag toIndex : (nonnull NSNumber *)index)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    
    if ([view isKindOfClass:[RCTPicker class]]) {
      [(RCTPicker *)view setSelectedIndex:index.integerValue];
    } else {
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[RCTPicker class]]) {
        [(RCTPicker *)subview setSelectedIndex:index.integerValue];
      } else {
        RCTLogError(@"view type must be RCTPicker");
      }
    }
  }];
}

@end
