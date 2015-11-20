/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageUtils.h"

#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/UTCoreTypes.h>
#import <tgmath.h>

#import "RCTLog.h"
#import "RCTUtils.h"

static CGFloat RCTCeilValue(CGFloat value, CGFloat scale)
{
  return ceil(value * scale) / scale;
}

static CGFloat RCTFloorValue(CGFloat value, CGFloat scale)
{
  return floor(value * scale) / scale;
}

static CGSize RCTCeilSize(CGSize size, CGFloat scale)
{
  return (CGSize){
    RCTCeilValue(size.width, scale),
    RCTCeilValue(size.height, scale)
  };
}

CGRect RCTTargetRect(CGSize sourceSize, CGSize destSize,
                     CGFloat destScale, UIViewContentMode resizeMode)
{
  if (CGSizeEqualToSize(destSize, CGSizeZero)) {
    // Assume we require the largest size available
    return (CGRect){CGPointZero, sourceSize};
  }

  CGFloat aspect = sourceSize.width / sourceSize.height;
  // If only one dimension in destSize is non-zero (for example, an Image
  // with `flex: 1` whose height is indeterminate), calculate the unknown
  // dimension based on the aspect ratio of sourceSize
  if (destSize.width == 0) {
    destSize.width = destSize.height * aspect;
  }
  if (destSize.height == 0) {
    destSize.height = destSize.width / aspect;
  }

  // Calculate target aspect ratio if needed (don't bother if resizeMode == stretch)
  CGFloat targetAspect = 0.0;
  if (resizeMode != UIViewContentModeScaleToFill) {
    targetAspect = destSize.width / destSize.height;
    if (aspect == targetAspect) {
      resizeMode = UIViewContentModeScaleToFill;
    }
  }

  switch (resizeMode) {
    case UIViewContentModeScaleToFill: // stretch

      return (CGRect){CGPointZero, RCTCeilSize(destSize, destScale)};

    case UIViewContentModeScaleAspectFit: // contain

      if (targetAspect <= aspect) { // target is taller than content

        sourceSize.width = destSize.width = destSize.width;
        sourceSize.height = sourceSize.width / aspect;

      } else { // target is wider than content

        sourceSize.height = destSize.height = destSize.height;
        sourceSize.width = sourceSize.height * aspect;
      }
      return (CGRect){CGPointZero, RCTCeilSize(sourceSize, destScale)};

    case UIViewContentModeScaleAspectFill: // cover

      if (targetAspect <= aspect) { // target is taller than content

        sourceSize.height = destSize.height = destSize.height;
        sourceSize.width = sourceSize.height * aspect;
        destSize.width = destSize.height * targetAspect;
        return (CGRect){
          {RCTFloorValue((destSize.width - sourceSize.width) / 2, destScale), 0},
          RCTCeilSize(sourceSize, destScale)
        };

      } else { // target is wider than content

        sourceSize.width = destSize.width = destSize.width;
        sourceSize.height = sourceSize.width / aspect;
        destSize.height = destSize.width / targetAspect;
        return (CGRect){
          {0, RCTFloorValue((destSize.height - sourceSize.height) / 2, destScale)},
          RCTCeilSize(sourceSize, destScale)
        };
      }

    default:

      RCTLogError(@"A resizeMode value of %zd is not supported", resizeMode);
      return (CGRect){CGPointZero, RCTCeilSize(destSize, destScale)};
  }
}

CGSize RCTTargetSize(CGSize sourceSize, CGFloat sourceScale,
                     CGSize destSize, CGFloat destScale,
                     UIViewContentMode resizeMode,
                     BOOL allowUpscaling)
{
  switch (resizeMode) {
    case UIViewContentModeScaleToFill: // stretch

      if (!allowUpscaling) {
        CGFloat scale = sourceScale / destScale;
        destSize.width = MIN(sourceSize.width * scale, destSize.width);
        destSize.height = MIN(sourceSize.height * scale, destSize.height);
      }
      return RCTCeilSize(destSize, destScale);

    default: {

      // Get target size
      CGSize size = RCTTargetRect(sourceSize, destSize, destScale, resizeMode).size;
      if (!allowUpscaling) {
        // return sourceSize if target size is larger
        if (sourceSize.width * sourceScale < size.width * destScale) {
          return sourceSize;
        }
      }
      return size;
    }
  }
}

BOOL RCTUpscalingRequired(CGSize sourceSize, CGFloat sourceScale,
                          CGSize destSize, CGFloat destScale,
                          UIViewContentMode resizeMode)
{
  if (CGSizeEqualToSize(destSize, CGSizeZero)) {
    // Assume we require the largest size available
    return YES;
  }

  // Precompensate for scale
  CGFloat scale = sourceScale / destScale;
  sourceSize.width *= scale;
  sourceSize.height *= scale;

  // Calculate aspect ratios if needed (don't bother if resizeMode == stretch)
  CGFloat aspect = 0.0, targetAspect = 0.0;
  if (resizeMode != UIViewContentModeScaleToFill) {
    aspect = sourceSize.width / sourceSize.height;
    targetAspect = destSize.width / destSize.height;
    if (aspect == targetAspect) {
      resizeMode = UIViewContentModeScaleToFill;
    }
  }

  switch (resizeMode) {
    case UIViewContentModeScaleToFill: // stretch

      return destSize.width > sourceSize.width || destSize.height > sourceSize.height;

    case UIViewContentModeScaleAspectFit: // contain

      if (targetAspect <= aspect) { // target is taller than content

        return destSize.width > sourceSize.width;

      } else { // target is wider than content

        return destSize.height > sourceSize.height;
      }

    case UIViewContentModeScaleAspectFill: // cover

      if (targetAspect <= aspect) { // target is taller than content

        return destSize.height > sourceSize.height;

      } else { // target is wider than content

        return destSize.width > sourceSize.width;
      }

    default:

      RCTLogError(@"A resizeMode value of %zd is not supported", resizeMode);
      return NO;
  }
}

CGSize RCTSizeInPixels(CGSize pointSize, CGFloat scale)
{
  return (CGSize){
    ceil(pointSize.width * scale),
    ceil(pointSize.height * scale),
  };
}

UIImage *RCTDecodeImageWithData(NSData *data,
                                CGSize destSize,
                                CGFloat destScale,
                                UIViewContentMode resizeMode)
{
  CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)data, NULL);
  if (!sourceRef) {
    return nil;
  }

  // get original image size
  CGSize sourceSize;
  CFDictionaryRef imageProperties = CGImageSourceCopyPropertiesAtIndex(sourceRef, 0, NULL);
  if (!imageProperties) {
    CFRelease(sourceRef);
    return nil;
  }
  NSNumber *width = CFDictionaryGetValue(imageProperties, kCGImagePropertyPixelWidth);
  NSNumber *height = CFDictionaryGetValue(imageProperties, kCGImagePropertyPixelHeight);
  sourceSize = (CGSize){width.doubleValue, height.doubleValue};
  CFRelease(imageProperties);

  if (CGSizeEqualToSize(destSize, CGSizeZero)) {
    destSize = sourceSize;
  }

  // calculate target size
  CGSize targetSize = RCTTargetSize(sourceSize, 1, destSize, destScale, resizeMode, YES);
  CGSize targetPixelSize = RCTSizeInPixels(targetSize, destScale);
  CGFloat maxPixelSize = fmax(fmin(sourceSize.width, targetPixelSize.width),
                              fmin(sourceSize.height, targetPixelSize.height));

  NSDictionary<NSString *, NSNumber *> *options = @{
    (id)kCGImageSourceShouldAllowFloat: @YES,
    (id)kCGImageSourceCreateThumbnailWithTransform: @YES,
    (id)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
    (id)kCGImageSourceThumbnailMaxPixelSize: @(maxPixelSize),
  };

  // get thumbnail
  CGImageRef imageRef = CGImageSourceCreateThumbnailAtIndex(sourceRef, 0, (__bridge CFDictionaryRef)options);
  CFRelease(sourceRef);
  if (!imageRef) {
    return nil;
  }

  // adjust scale
  size_t actualWidth = CGImageGetWidth(imageRef);
  CGFloat scale = actualWidth / targetSize.width * destScale;

  // return image
  UIImage *image = [UIImage imageWithCGImage:imageRef
                                       scale:scale
                                 orientation:UIImageOrientationUp];
  CGImageRelease(imageRef);
  return image;
}

NSData *RCTGetImageData(CGImageRef image, float quality)
{
  NSDictionary *properties;
  CGImageDestinationRef destination;
  CFMutableDataRef imageData = CFDataCreateMutable(NULL, 0);
  if (RCTImageHasAlpha(image)) {
    // get png data
    destination = CGImageDestinationCreateWithData(imageData, kUTTypePNG, 1, NULL);
  } else {
    // get jpeg data
    destination = CGImageDestinationCreateWithData(imageData, kUTTypeJPEG, 1, NULL);
    properties = @{(NSString *)kCGImageDestinationLossyCompressionQuality: @(quality)};
  }
  CGImageDestinationAddImage(destination, image, (__bridge CFDictionaryRef)properties);
  if (!CGImageDestinationFinalize(destination))
  {
    CFRelease(imageData);
    imageData = NULL;
  }
  CFRelease(destination);
  return (__bridge_transfer NSData *)imageData;
}
