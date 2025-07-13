/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

#import <string>

static UIColor *UIColorFromHexString(const std::string hexString)
{
  unsigned rgbValue = 0;
  NSString *colorString = [NSString stringWithCString:hexString.c_str() encoding:[NSString defaultCStringEncoding]];
  NSScanner *scanner = [NSScanner scannerWithString:colorString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0
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

RCT_CUSTOM_VIEW_PROPERTY(cornerRadius, CGFloat, UIView)
{
  view.clipsToBounds = true;
  NSNumber *cornerRadius = (NSNumber *)json;
  view.layer.cornerRadius = [cornerRadius floatValue];
}

RCT_EXPORT_METHOD(changeBackgroundColor : (nonnull NSNumber *)reactTag color : (NSString *)color)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if (UIView *view = [RCTSampleNativeComponentViewManager getViewByTag:viewRegistry reactTag:reactTag]) {
      view.backgroundColor = UIColorFromHexString(std::string(color.UTF8String));
    }
  }];
}

+ (UIView *)getViewByTag:(NSDictionary<NSNumber *, UIView *> *)viewRegistry reactTag:(nonnull NSNumber *)reactTag
{
  UIView *view = viewRegistry[reactTag];
  if (view == nil) {
    RCTLogError(@"Cannot find view with tag #%@", reactTag);
  }
  return view;
}

- (UIView *)view
{
  UIView *view = [UIView new];
  view.backgroundColor = UIColor.redColor;
  return view;
}

@end
