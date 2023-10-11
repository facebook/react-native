/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@interface RNTMyNativeViewManager : RCTViewManager
@end

@implementation RNTMyNativeViewManager

RCT_EXPORT_MODULE(RNTMyNativeView)

RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)

RCT_EXPORT_VIEW_PROPERTY(onIntArrayChanged, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(values, NSArray *)

RCT_EXPORT_METHOD(callNativeMethodToChangeBackgroundColor : (nonnull NSNumber *)reactTag color : (NSString *)color)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTPlatformView *> *viewRegistry) { // [macOS]
	RCTUIView *view = (RCTUIView *)viewRegistry[reactTag]; // [macOS]
    if (!view || ![view isKindOfClass:[RCTUIView class]]) { // [macOS]
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }

    unsigned rgbValue = 0;
    NSString *colorString = [NSString stringWithCString:std::string([color UTF8String]).c_str()
                                               encoding:[NSString defaultCStringEncoding]];
    NSScanner *scanner = [NSScanner scannerWithString:colorString];
    [scanner setScanLocation:1]; // bypass '#' character
    [scanner scanHexInt:&rgbValue];
    view.backgroundColor = [RCTUIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0 // [macOS
                                              green:((rgbValue & 0xFF00) >> 8) / 255.0
                                               blue:(rgbValue & 0xFF) / 255.0
                                              alpha:1.0];
  }];
}

- (RCTUIView *)view // [macOS]
{
  return [[RCTUIView alloc] init]; // [macOS]
}

@end
