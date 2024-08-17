/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

static RCTUIColor *UIColorFromHexString(const std::string hexString) // [macOS]
{
  unsigned rgbValue = 0;
  NSString *colorString = [NSString stringWithCString:hexString.c_str() encoding:[NSString defaultCStringEncoding]];
  NSScanner *scanner = [NSScanner scannerWithString:colorString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [RCTUIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0 // [macOS]
                            green:((rgbValue & 0xFF00) >> 8) / 255.0
                             blue:(rgbValue & 0xFF) / 255.0
                            alpha:1.0];
}

@interface RCTSampleNativeComponentViewManager : RCTViewManager
@end

@implementation RCTSampleNativeComponentViewManager

RCT_EXPORT_MODULE(SampleNativeComponent)

RCT_REMAP_VIEW_PROPERTY(color, backgroundColor, UIColor)

RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)

RCT_EXPORT_VIEW_PROPERTY(onColorChanged, RCTBubblingEventBlock)

RCT_CUSTOM_VIEW_PROPERTY(cornerRadius, CGFloat, RCTPlatformView) // [macOS]
{
  view.clipsToBounds = true;
  NSNumber *cornerRadius = (NSNumber *)json;
  view.layer.cornerRadius = [cornerRadius floatValue];
}

RCT_EXPORT_METHOD(changeBackgroundColor : (nonnull NSNumber *)reactTag color : (NSString *)color)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTPlatformView *> *viewRegistry) { // [macOS]
    if (RCTPlatformView *view = [RCTSampleNativeComponentViewManager getViewByTag:viewRegistry reactTag:reactTag]) {
#if !TARGET_OS_OSX // [macOS
      view.backgroundColor = UIColorFromHexString(std::string(color.UTF8String));
#else // [macOS
      view.layer.backgroundColor = UIColorFromHexString(std::string(color.UTF8String)).CGColor;
#endif // macOS]
    }
  }];
}

+ (RCTPlatformView *)getViewByTag:(NSDictionary<NSNumber *, RCTPlatformView *> *)viewRegistry reactTag:(nonnull NSNumber *)reactTag // [macOS]
{
  RCTPlatformView *view = viewRegistry[reactTag]; // [macOS]
  if (view == nil) {
    RCTLogError(@"Cannot find view with tag #%@", reactTag);
  }
  return view;
}

- (RCTPlatformView *)view // [macOS]
{
  RCTPlatformView *view = [RCTPlatformView new]; // [macOS]
#if !TARGET_OS_OSX // [macOS]
  view.backgroundColor = UIColor.redColor;
#else // [macOS
  view.wantsLayer = true;
  view.layer.backgroundColor = NSColor.redColor.CGColor;
#endif // macOS]
  return view;
}

@end
