/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageBlurUtils.h>

#import <React/RCTUIKit.h> // [macOS]
#import <React/RCTUtils.h> // [macOS]

UIImage *RCTBlurredImageWithRadius(UIImage *inputImage, CGFloat radius)
{
  CGImageRef imageRef = UIImageGetCGImageRef(inputImage); // [macOS]
  CGFloat imageScale = UIImageGetScale(inputImage); // [macOS]
#if !TARGET_OS_OSX // [macOS]
  UIImageOrientation imageOrientation = inputImage.imageOrientation;
#endif // [macOS]

  // Image must be nonzero size
  if (CGImageGetWidth(imageRef) * CGImageGetHeight(imageRef) == 0) {
    return inputImage;
  }

  // convert to ARGB if it isn't
  if (CGImageGetBitsPerPixel(imageRef) != 32 || CGImageGetBitsPerComponent(imageRef) != 8 ||
      !((CGImageGetBitmapInfo(imageRef) & kCGBitmapAlphaInfoMask))) {
#if !TARGET_OS_OSX // [macOS]
    UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
    rendererFormat.scale = inputImage.scale;
    UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:inputImage.size
                                                                                     format:rendererFormat];

    imageRef = [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull context) {
                 [inputImage drawAtPoint:CGPointZero];
               }].CGImage;
#else // [macOS
    UIGraphicsBeginImageContextWithOptions(inputImage.size, NO, imageScale);
    [inputImage drawAtPoint:CGPointZero fromRect:NSZeroRect operation:NSCompositingOperationSourceOver fraction:1.0];
    imageRef = (CGImageRef)CFAutorelease(CGBitmapContextCreateImage(UIGraphicsGetCurrentContext()));
    UIGraphicsEndImageContext();
#endif // macOS]
  }

  vImage_Buffer buffer1, buffer2;
  buffer1.width = buffer2.width = CGImageGetWidth(imageRef);
  buffer1.height = buffer2.height = CGImageGetHeight(imageRef);
  buffer1.rowBytes = buffer2.rowBytes = CGImageGetBytesPerRow(imageRef);
  size_t bytes = buffer1.rowBytes * buffer1.height;
  buffer1.data = malloc(bytes);
  if (!buffer1.data) {
    return inputImage;
  }
  buffer2.data = malloc(bytes);
  if (!buffer2.data) {
    free(buffer1.data);
    return inputImage;
  }

  // A description of how to compute the box kernel width from the Gaussian
  // radius (aka standard deviation) appears in the SVG spec:
  // http://www.w3.org/TR/SVG/filters.html#feGaussianBlurElement
  uint32_t boxSize = floor((radius * imageScale * 3 * sqrt(2 * M_PI) / 4 + 0.5) / 2);
  boxSize |= 1; // Ensure boxSize is odd

  // create temp buffer
  vImage_Error tempBufferSize = vImageBoxConvolve_ARGB8888(
      &buffer1, &buffer2, NULL, 0, 0, boxSize, boxSize, NULL, kvImageGetTempBufferSize | kvImageEdgeExtend);
  if (tempBufferSize < 0) {
    free(buffer1.data);
    free(buffer2.data);
    return inputImage;
  }
  void *tempBuffer = malloc(tempBufferSize);
  if (!tempBuffer) {
    free(buffer1.data);
    free(buffer2.data);
    return inputImage;
  }

  // copy image data
  CFDataRef dataSource = CGDataProviderCopyData(CGImageGetDataProvider(imageRef));
  memcpy(buffer1.data, CFDataGetBytePtr(dataSource), bytes);
  CFRelease(dataSource);

  // perform blur
  vImageBoxConvolve_ARGB8888(&buffer1, &buffer2, tempBuffer, 0, 0, boxSize, boxSize, NULL, kvImageEdgeExtend);
  vImageBoxConvolve_ARGB8888(&buffer2, &buffer1, tempBuffer, 0, 0, boxSize, boxSize, NULL, kvImageEdgeExtend);
  vImageBoxConvolve_ARGB8888(&buffer1, &buffer2, tempBuffer, 0, 0, boxSize, boxSize, NULL, kvImageEdgeExtend);

  // free buffers
  free(buffer2.data);
  free(tempBuffer);

  // create image context from buffer
  CGContextRef ctx = CGBitmapContextCreate(
      buffer1.data,
      buffer1.width,
      buffer1.height,
      8,
      buffer1.rowBytes,
      CGImageGetColorSpace(imageRef),
      CGImageGetBitmapInfo(imageRef));

  // create image from context
  imageRef = CGBitmapContextCreateImage(ctx);
#if !TARGET_OS_OSX // [macOS]
  UIImage *outputImage = [UIImage imageWithCGImage:imageRef scale:imageScale orientation:imageOrientation];
#else // [macOS
  NSImage *outputImage = [[NSImage alloc] initWithCGImage:imageRef size:inputImage.size];
#endif // macOS]
  CGImageRelease(imageRef);
  CGContextRelease(ctx);
  free(buffer1.data);
  return outputImage;
}
