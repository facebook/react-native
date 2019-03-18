/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  UIGraphicsBeginImageContextWithOptions(imageSize, YES, 0.0);
  CGContextRef context = UIGraphicsGetCurrentContext();
  [self drawInRect:CGRectMake(0, 0, self.size.width, self.size.height)];
  CGContextSetAlpha(context, 0.5f);
  CGContextBeginTransparencyLayer(context, NULL);
  [image drawInRect:CGRectMake(0, 0, image.size.width, image.size.height)];
  CGContextSetBlendMode(context, kCGBlendModeDifference);
  CGContextSetFillColorWithColor(context,[UIColor whiteColor].CGColor);
  CGContextFillRect(context, CGRectMake(0, 0, self.size.width, self.size.height));
  CGContextEndTransparencyLayer(context);
  UIImage *returnImage = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return returnImage;
}

@end
