/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIImage+Compare.h"

@implementation UIImage (Compare)

- (BOOL)compareWithImage:(UIImage *)image
{
  NSAssert(CGSizeEqualToSize(self.size, image.size), @"Images must be same size.");

  CGImageRef imageRef = UIImageGetCGImageRef(image); // TODO(macOS GH#774)

  // The images have the equal size, so we could use the smallest amount of bytes because of byte padding
  size_t minBytesPerRow = MIN(CGImageGetBytesPerRow(imageRef), CGImageGetBytesPerRow(imageRef)); // TODO(macOS GH#774)
  size_t referenceImageSizeBytes = CGImageGetHeight(imageRef) * minBytesPerRow; // TODO(macOS GH#774)
  void *referenceImagePixels = calloc(1, referenceImageSizeBytes);
  void *imagePixels = calloc(1, referenceImageSizeBytes);

  if (!referenceImagePixels || !imagePixels) {
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextRef referenceImageContext = CGBitmapContextCreate(
      referenceImagePixels,
      CGImageGetWidth(imageRef), // TODO(macOS GH#774)
      CGImageGetHeight(imageRef), // TODO(macOS GH#774)
      CGImageGetBitsPerComponent(imageRef), // TODO(macOS GH#774)
      minBytesPerRow,
      CGImageGetColorSpace(imageRef), // TODO(macOS GH#774)
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
  CGContextRef imageContext = CGBitmapContextCreate(
      imagePixels,
      CGImageGetWidth(imageRef), // TODO(macOS GH#774)
      CGImageGetHeight(imageRef), // TODO(macOS GH#774)
      CGImageGetBitsPerComponent(imageRef), // TODO(macOS GH#774)
      minBytesPerRow,
      CGImageGetColorSpace(imageRef), // TODO(macOS GH#774)
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  CGFloat scaleFactor = [UIScreen mainScreen].scale;
#else // [TODO(macOS GH#774)
  // The compareWithImage: method is used for integration test snapshot image comparison.
  // The _snapshotView: method that creates snapshot images that are *not* scaled for the screen.
  // By not using the screen scale factor in this method the test results are machine independent.
  CGFloat scaleFactor = 1;
#endif // ]TODO(macOS GH#774)

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
      referenceImageContext, CGRectMake(0.0f, 0.0f, self.size.width, self.size.height), imageRef); // TODO(macOS GH#774)
  CGContextDrawImage(
      imageContext, CGRectMake(0.0f, 0.0f, image.size.width, image.size.height), imageRef); // TODO(macOS GH#774)
  CGContextRelease(referenceImageContext);
  CGContextRelease(imageContext);

  BOOL imageEqual = (memcmp(referenceImagePixels, imagePixels, referenceImageSizeBytes) == 0);
  free(referenceImagePixels);
  free(imagePixels);
  return imageEqual;
}

@end
