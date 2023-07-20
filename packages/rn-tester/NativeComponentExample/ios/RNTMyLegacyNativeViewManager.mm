/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import "RNTLegacyView.h"
#import "RNTMyNativeViewComponentView.h"

@interface RNTMyLegacyNativeViewManager : RCTViewManager

@end

@implementation RNTMyLegacyNativeViewManager

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_MODULE()

RCT_REMAP_VIEW_PROPERTY(color, backgroundColor, UIColor)

RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)

RCT_EXPORT_VIEW_PROPERTY(onColorChanged, RCTBubblingEventBlock)

RCT_CUSTOM_VIEW_PROPERTY(cornerRadius, CGFloat, RNTLegacyView)
{
  view.clipsToBounds = true;
  NSNumber *cornerRadius = (NSNumber *)json;
  view.layer.cornerRadius = [cornerRadius floatValue];
}

RCT_EXPORT_METHOD(changeBackgroundColor : (nonnull NSNumber *)reactTag color : (NSString *)color)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RNTLegacyView class]]) {
      RCTLogError(@"Cannot find RNTLegacyView with tag #%@", reactTag);
      return;
    }

    unsigned rgbValue = 0;
    NSString *colorString = [NSString stringWithCString:std::string([color UTF8String]).c_str()
                                               encoding:[NSString defaultCStringEncoding]];
    NSScanner *scanner = [NSScanner scannerWithString:colorString];
    [scanner setScanLocation:1]; // bypass '#' character
    [scanner scanHexInt:&rgbValue];

    UIColor *newColor = [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0
                                        green:((rgbValue & 0xFF00) >> 8) / 255.0
                                         blue:(rgbValue & 0xFF) / 255.0
                                        alpha:1.0];
    view.backgroundColor = newColor;
  }];
}

- (UIView *)view
{
  RNTLegacyView *view = [[RNTLegacyView alloc] init];
  view.backgroundColor = UIColor.redColor;
  return view;
}

- (NSDictionary *)constantsToExport
{
  return @{@"PI" : @3.14};
}
@end
