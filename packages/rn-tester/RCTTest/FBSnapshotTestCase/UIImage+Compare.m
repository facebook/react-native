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

  CGImageRef imageRef = UIImageGetCGImageRef(image); // [macOS]

  // The images have the equal size, so we could use the smallest amount of bytes because of byte padding
  size_t minBytesPerRow = MIN(CGImageGetBytesPerRow(imageRef), CGImageGetBytesPerRow(imageRef)); // [macOS]
  size_t referenceImageSizeBytes = CGImageGetHeight(imageRef) * minBytesPerRow; // [macOS]
  void *referenceImagePixels = calloc(1, referenceImageSizeBytes);
  void *imagePixels = calloc(1, referenceImageSizeBytes);

  if (!referenceImagePixels || !imagePixels) {
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextRef referenceImageContext = CGBitmapContextCreate(
      referenceImagePixels,
      CGImageGetWidth(imageRef), // [macOS]
      CGImageGetHeight(imageRef), // [macOS]
      CGImageGetBitsPerComponent(imageRef), // [macOS]
      minBytesPerRow,
      CGImageGetColorSpace(imageRef), // [macOS]
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
  CGContextRef imageContext = CGBitmapContextCreate(
      imagePixels,
      CGImageGetWidth(imageRef), // [macOS]
      CGImageGetHeight(imageRef), // [macOS]
      CGImageGetBitsPerComponent(imageRef), // [macOS]
      minBytesPerRow,
      CGImageGetColorSpace(imageRef), // [macOS]
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);

#if !TARGET_OS_OSX // [macOS]
  CGFloat scaleFactor = [UITraitCollection currentTraitCollection].displayScale;
#else // [macOS
  // The compareWithImage: method is used for integration test snapshot image comparison.
  // The _snapshotView: method that creates snapshot images that are *not* scaled for the screen.
  // By not using the screen scale factor in this method the test results are machine independent.
  CGFloat scaleFactor = 1;
#endif // macOS]
  CGContextScaleCTM(referenceImageContext, scaleFactor, scaleFactor);
  CGContextScaleCTM(imageContext, scaleFactor, scaleFactor);

  if (!referenceImageContext || !imageContext) {
    CGContextRelease(referenceImageContext);
    CGContextRelease(imageContext);
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextDrawImage(
      referenceImageContext, CGRectMake(0.0f, 0.0f, self.size.width, self.size.height), imageRef); // [macOS]
  CGContextDrawImage(
      imageContext, CGRectMake(0.0f, 0.0f, image.size.width, image.size.height), imageRef); // [macOS]
  CGContextRelease(referenceImageContext);
  CGContextRelease(imageContext);

  BOOL imageEqual = (memcmp(referenceImagePixels, imagePixels, referenceImageSizeBytes) == 0);
  free(referenceImagePixels);
  free(imagePixels);
  return imageEqual;
}

@end
