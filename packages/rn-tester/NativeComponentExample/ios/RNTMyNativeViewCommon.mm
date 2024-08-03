/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIView+ColorOverlays.h"

@implementation RCTPlatformView (ColorOverlays) // [macOS]

- (void)setBackgroundColorWithColorString:(NSString *)colorString
{
  RCTUIColor *color = [RCTPlatformView RCTUIColorFromHexString:std::string([colorString UTF8String])]; // [macOS]
#if !TARGET_OS_OSX // [macOS]
  self.backgroundColor = color;
#else // [macOS
  // Not perfect (See the implementation in RCTUIView), but should serve well enough for RNTester
  self.layer.backgroundColor = color.CGColor;
#endif // macOS]
}

- (void)addColorOverlays:(const NSArray *)overlayColors
{
  CGRect viewBounds = self.bounds;
  CGFloat width = viewBounds.size.width / [overlayColors count];
  for (int i = 0; i < [overlayColors count]; i++) {
    id colorString = [overlayColors objectAtIndex:i];
    CGRect rect = CGRectMake(viewBounds.origin.x + width * i, viewBounds.origin.y, width, viewBounds.size.height);
    RCTUIView *overlayView = [[RCTUIView alloc] initWithFrame:rect]; // [macOS]
    RCTUIColor *color = [RCTPlatformView RCTUIColorFromHexString:std::string([colorString UTF8String])]; // [macOS]
    overlayView.backgroundColor = color;
    [self addSubview:overlayView];
  }
}

- (void)removeOverlays
{
  NSArray *viewsToRemove = [self subviews];
  for (RCTPlatformView *subview in viewsToRemove) { // [macOS]
    [subview removeFromSuperview];
  }
}

+ (RCTUIColor *)RCTUIColorFromHexString:(const std::string)hexString // [macOS]
{
  unsigned rgbValue = 0;
  NSString *colorString = [NSString stringWithCString:hexString.c_str() encoding:[NSString defaultCStringEncoding]];
  NSScanner *scanner = [NSScanner scannerWithString:colorString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [RCTUIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0   // [macOS]
                            green:((rgbValue & 0xFF00) >> 8) / 255.0
                             blue:(rgbValue & 0xFF) / 255.0
                            alpha:1.0];
}

@end
