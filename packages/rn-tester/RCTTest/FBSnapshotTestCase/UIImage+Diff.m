/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIImage+Diff.h"

@implementation UIImage (Diff)

- (UIImage *)diffWithImage:(UIImage *)image
{
  if (!image) {
    return nil;
  }
  CGSize imageSize = CGSizeMake(MAX(self.size.width, image.size.width), MAX(self.size.height, image.size.height));

#if !TARGET_OS_OSX // [macOS]
  UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
  rendererFormat.opaque = YES;
  UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:imageSize
                                                                                   format:rendererFormat];

  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull rendererContext) {
		const CGContextRef context = rendererContext.CGContext;
#else // [macOS
  UIGraphicsBeginImageContextWithOptions(imageSize, YES, 0.0);
  CGContextRef context = UIGraphicsGetCurrentContext();
  // Add extra braces for scope to match the indentation level of the iOS block
  {
#endif // macOS]
    [self drawInRect:CGRectMake(0, 0, self.size.width, self.size.height)];
    CGContextSetAlpha(context, 0.5f);
    CGContextBeginTransparencyLayer(context, NULL);
    [image drawInRect:CGRectMake(0, 0, image.size.width, image.size.height)];
    CGContextSetBlendMode(context, kCGBlendModeDifference);
    CGContextSetFillColorWithColor(context, [RCTUIColor whiteColor].CGColor);
    CGContextFillRect(context, CGRectMake(0, 0, self.size.width, self.size.height));
    CGContextEndTransparencyLayer(context);
#if !TARGET_OS_OSX // [macOS]
  }];
#else // [macOS
  }
  UIImage *returnImage = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return returnImage;
#endif // macOS]
}

@end
