/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIImage+Compare.h"

@implementation UIImage (Compare)

- (BOOL)compareWithImage:(UIImage *)image
{
  NSAssert(CGSizeEqualToSize(self.size, image.size), @"Images must be same size.");

  // The images have the equal size, so we could use the smallest amount of bytes because of byte padding
  size_t minBytesPerRow = MIN(CGImageGetBytesPerRow(self.CGImage), CGImageGetBytesPerRow(image.CGImage));
  size_t referenceImageSizeBytes = CGImageGetHeight(self.CGImage) * minBytesPerRow;
  void *referenceImagePixels = calloc(1, referenceImageSizeBytes);
  void *imagePixels = calloc(1, referenceImageSizeBytes);

  if (!referenceImagePixels || !imagePixels) {
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextRef referenceImageContext = CGBitmapContextCreate(
      referenceImagePixels,
      CGImageGetWidth(self.CGImage),
      CGImageGetHeight(self.CGImage),
      CGImageGetBitsPerComponent(self.CGImage),
      minBytesPerRow,
      CGImageGetColorSpace(self.CGImage),
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
  CGContextRef imageContext = CGBitmapContextCreate(
      imagePixels,
      CGImageGetWidth(image.CGImage),
      CGImageGetHeight(image.CGImage),
      CGImageGetBitsPerComponent(image.CGImage),
      minBytesPerRow,
      CGImageGetColorSpace(image.CGImage),
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);

  CGFloat scaleFactor = [UIScreen mainScreen].scale;
  CGContextScaleCTM(referenceImageContext, scaleFactor, scaleFactor);
  CGContextScaleCTM(imageContext, scaleFactor, scaleFactor);

  if (!referenceImageContext || !imageContext) {
    CGContextRelease(referenceImageContext);
    CGContextRelease(imageContext);
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextDrawImage(referenceImageContext, CGRectMake(0.0f, 0.0f, self.size.width, self.size.height), self.CGImage);
  CGContextDrawImage(imageContext, CGRectMake(0.0f, 0.0f, image.size.width, image.size.height), image.CGImage);
  CGContextRelease(referenceImageContext);
  CGContextRelease(imageContext);

  BOOL imageEqual = (memcmp(referenceImagePixels, imagePixels, referenceImageSizeBytes) == 0);
  free(referenceImagePixels);
  free(imagePixels);
  return imageEqual;
}

@end
