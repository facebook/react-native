/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTGIFImage.h"

#import "RCTLog.h"

static CAKeyframeAnimation *RCTGIFImageWithImageSource(CGImageSourceRef imageSource)
{
  if (!UTTypeConformsTo(CGImageSourceGetType(imageSource), kUTTypeGIF)) {
    CFRelease(imageSource);
    return nil;
  }

  NSDictionary *properties = (__bridge_transfer NSDictionary *)CGImageSourceCopyProperties(imageSource, NULL);
  NSUInteger loopCount = [properties[(id)kCGImagePropertyGIFDictionary][(id)kCGImagePropertyGIFLoopCount] unsignedIntegerValue];

  size_t imageCount = CGImageSourceGetCount(imageSource);
  NSTimeInterval duration = 0;
  NSMutableArray *delays = [NSMutableArray arrayWithCapacity:imageCount];
  NSMutableArray *images = [NSMutableArray arrayWithCapacity:imageCount];
  for (size_t i = 0; i < imageCount; i++) {
    CGImageRef image = CGImageSourceCreateImageAtIndex(imageSource, i, NULL);
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
    images[i] = (__bridge_transfer id)image;
  }

  NSMutableArray *keyTimes = [NSMutableArray arrayWithCapacity:delays.count];
  NSTimeInterval runningDuration = 0;
  for (NSNumber *delayNumber in delays) {
    [keyTimes addObject:@(runningDuration / duration)];
    runningDuration += delayNumber.doubleValue;
  }

  [keyTimes addObject:@1.0];

  CAKeyframeAnimation *animation = [CAKeyframeAnimation animationWithKeyPath:@"contents"];
  animation.calculationMode = kCAAnimationDiscrete;
  animation.repeatCount = loopCount == 0 ? HUGE_VALF : loopCount;
  animation.keyTimes = keyTimes;
  animation.values = images;
  animation.duration = duration;
  return animation;
}

CAKeyframeAnimation *RCTGIFImageWithData(NSData *data)
{
  if (data.length == 0) {
    return nil;
  }

  CGImageSourceRef imageSource = CGImageSourceCreateWithData((CFDataRef)data, NULL);
  CAKeyframeAnimation *animation = RCTGIFImageWithImageSource(imageSource);
  CFRelease(imageSource);
  return animation;
}

CAKeyframeAnimation *RCTGIFImageWithFileURL(NSURL *URL)
{
  if (!URL) {
    return nil;
  }

  if (![URL isFileURL]) {
    RCTLogError(@"Loading remote image URLs synchronously is a really bad idea.");
    return nil;
  }

  CGImageSourceRef imageSource = CGImageSourceCreateWithURL((CFURLRef)URL, NULL);
  CAKeyframeAnimation *animation = RCTGIFImageWithImageSource(imageSource);
  CFRelease(imageSource);
  return animation;
}
