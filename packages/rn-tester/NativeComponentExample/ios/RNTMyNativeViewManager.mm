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

RCT_EXPORT_METHOD(callNativeMethodToChangeBackgroundColor : (nonnull NSNumber *)reactTag color : (NSString *)color)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[UIView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }

    unsigned rgbValue = 0;
    NSString *colorString = [NSString stringWithCString:std::string([color UTF8String]).c_str()
                                               encoding:[NSString defaultCStringEncoding]];
    NSScanner *scanner = [NSScanner scannerWithString:colorString];
    [scanner setScanLocation:1]; // bypass '#' character
    [scanner scanHexInt:&rgbValue];

    view.backgroundColor = [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0
                                           green:((rgbValue & 0xFF00) >> 8) / 255.0
                                            blue:(rgbValue & 0xFF) / 255.0
                                           alpha:1.0];
  }];
}

- (UIView *)view
{
  return [[UIView alloc] init];
}

@end
