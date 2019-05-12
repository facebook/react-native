/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTGIFImageDecoder.h"

#import <ImageIO/ImageIO.h>
#import <QuartzCore/QuartzCore.h>

#import <React/RCTUtils.h>
#import "RCTAnimatedImage.h"

@implementation RCTGIFImageDecoder

RCT_EXPORT_MODULE()

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  char header[7] = {};
  [imageData getBytes:header length:6];

  return !strcmp(header, "GIF87a") || !strcmp(header, "GIF89a");
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  CGImageSourceRef imageSource = CGImageSourceCreateWithData((CFDataRef)imageData, NULL);
  if (!imageSource) {
    completionHandler(nil, nil);
    return ^{};
  }
  UIImage *image = nil;
  size_t imageCount = CGImageSourceGetCount(imageSource);
  if (imageCount > 1) {
    image = [[RCTAnimatedImage alloc] initWithData:imageData scale:scale];
  } else {

    // Don't bother creating an animation
    CGImageRef imageRef = CGImageSourceCreateImageAtIndex(imageSource, 0, NULL);
    if (imageRef) {
      image = [UIImage imageWithCGImage:imageRef scale:scale orientation:UIImageOrientationUp];
      CFRelease(imageRef);
    }
    CFRelease(imageSource);
  }

  completionHandler(nil, image);
  return ^{};
}

@end
