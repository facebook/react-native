/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTGIFImageDecoder.h"

#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/MobileCoreServices.h>
#import <QuartzCore/QuartzCore.h>

#import "RCTUtils.h"

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
                                        resizeMode:(UIViewContentMode)resizeMode
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  CGImageSourceRef imageSource = CGImageSourceCreateWithData((CFDataRef)imageData, NULL);
  NSDictionary *properties = (__bridge_transfer NSDictionary *)CGImageSourceCopyProperties(imageSource, NULL);
  NSUInteger loopCount = [properties[(id)kCGImagePropertyGIFDictionary][(id)kCGImagePropertyGIFLoopCount] unsignedIntegerValue];

  UIImage *image = nil;
  size_t imageCount = CGImageSourceGetCount(imageSource);
  if (imageCount > 1) {

    NSTimeInterval duration = 0;
    NSMutableArray<NSNumber *> *delays = [NSMutableArray arrayWithCapacity:imageCount];
    NSMutableArray<id /* CGIMageRef */> *images = [NSMutableArray arrayWithCapacity:imageCount];
    for (size_t i = 0; i < imageCount; i++) {

      CGImageRef imageRef = CGImageSourceCreateImageAtIndex(imageSource, i, NULL);
      if (!image) {
        image = [UIImage imageWithCGImage:imageRef scale:scale orientation:UIImageOrientationUp];
      }

      NSDictionary *frameProperties = (__bridge_transfer NSDictionary *)CGImageSourceCopyPropertiesAtIndex(imageSource, i, NULL);
      NSDictionary *frameGIFProperties = frameProperties[(id)kCGImagePropertyGIFDictionary];

      const NSTimeInterval kDelayTimeIntervalDefault = 0.1;
      NSNumber *delayTime = frameGIFProperties[(id)kCGImagePropertyGIFUnclampedDelayTime] ?: frameGIFProperties[(id)kCGImagePropertyGIFDelayTime];
      if (delayTime == nil) {
        if (i == 0) {
          delayTime = @(kDelayTimeIntervalDefault);
        } else {
          delayTime = delays[i - 1];
        }
      }

      const NSTimeInterval kDelayTimeIntervalMinimum = 0.02;
      if (delayTime.floatValue < (float)kDelayTimeIntervalMinimum - FLT_EPSILON) {
        delayTime = @(kDelayTimeIntervalDefault);
      }

      duration += delayTime.doubleValue;
      delays[i] = delayTime;
      images[i] = (__bridge_transfer id)imageRef;
    }
    CFRelease(imageSource);

    NSMutableArray<NSNumber *> *keyTimes = [NSMutableArray arrayWithCapacity:delays.count];
    NSTimeInterval runningDuration = 0;
    for (NSNumber *delayNumber in delays) {
      [keyTimes addObject:@(runningDuration / duration)];
      runningDuration += delayNumber.doubleValue;
    }

    [keyTimes addObject:@1.0];

    // Create animation
    CAKeyframeAnimation *animation = [CAKeyframeAnimation animationWithKeyPath:@"contents"];
    animation.calculationMode = kCAAnimationDiscrete;
    animation.repeatCount = loopCount == 0 ? HUGE_VALF : loopCount;
    animation.keyTimes = keyTimes;
    animation.values = images;
    animation.duration = duration;
    image.reactKeyframeAnimation = animation;

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
