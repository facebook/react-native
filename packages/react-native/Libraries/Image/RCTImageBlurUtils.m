/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageBlurUtils.h>

UIImage *RCTBlurredImageWithRadius(UIImage *inputImage, CGFloat radius)
{
  CGImageRef imageRef = inputImage.CGImage;
  CGFloat imageScale = inputImage.scale;
  UIImageOrientation imageOrientation = inputImage.imageOrientation;

  // Image must be nonzero size
  if (CGImageGetWidth(imageRef) * CGImageGetHeight(imageRef) == 0) {
    return inputImage;
  }

  // convert to ARGB if it isn't
  if (CGImageGetBitsPerPixel(imageRef) != 32 || !((CGImageGetBitmapInfo(imageRef) & kCGBitmapAlphaInfoMask))) {
    UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
    rendererFormat.scale = inputImage.scale;
    UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:inputImage.size
                                                                                     format:rendererFormat];

    imageRef = [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull context) {
                 [inputImage drawAtPoint:CGPointZero];
               }].CGImage;
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
  if (tempBufferSize <= 0) {
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
  UIImage *outputImage = [UIImage imageWithCGImage:imageRef scale:imageScale orientation:imageOrientation];
  CGImageRelease(imageRef);
  CGContextRelease(ctx);
  free(buffer1.data);
  return outputImage;
}
