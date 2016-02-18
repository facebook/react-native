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

static const CGFloat RCTThresholdValue = 0.0001;

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
                     CGFloat destScale, RCTResizeMode resizeMode)
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
      resizeMode = RCTResizeModeStretch;
    }
  }

  switch (resizeMode) {
    case RCTResizeModeStretch:

      return (CGRect){CGPointZero, RCTCeilSize(destSize, destScale)};

    case RCTResizeModeContain:

      if (targetAspect <= aspect) { // target is taller than content

        sourceSize.width = destSize.width = destSize.width;
        sourceSize.height = sourceSize.width / aspect;

      } else { // target is wider than content

        sourceSize.height = destSize.height = destSize.height;
        sourceSize.width = sourceSize.height * aspect;
      }
      return (CGRect){
        {
          RCTFloorValue((destSize.width - sourceSize.width) / 2, destScale),
          RCTFloorValue((destSize.height - sourceSize.height) / 2, destScale),
        },
        RCTCeilSize(sourceSize, destScale)
      };

    case RCTResizeModeCover:

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
  }
}

CGAffineTransform RCTTransformFromTargetRect(CGSize sourceSize, CGRect targetRect)
{
  CGAffineTransform transform = CGAffineTransformIdentity;
  transform = CGAffineTransformTranslate(transform,
                                         targetRect.origin.x,
                                         targetRect.origin.y);
  transform = CGAffineTransformScale(transform,
                                     targetRect.size.width / sourceSize.width,
                                     targetRect.size.height / sourceSize.height);
  return transform;
}

CGSize RCTTargetSize(CGSize sourceSize, CGFloat sourceScale,
                     CGSize destSize, CGFloat destScale,
                     RCTResizeMode resizeMode,
                     BOOL allowUpscaling)
{
  switch (resizeMode) {
    case RCTResizeModeStretch:

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
                          RCTResizeMode resizeMode)
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
      resizeMode = RCTResizeModeStretch;
    }
  }

  switch (resizeMode) {
    case RCTResizeModeStretch:

      return destSize.width > sourceSize.width || destSize.height > sourceSize.height;

    case RCTResizeModeContain:

      if (targetAspect <= aspect) { // target is taller than content

        return destSize.width > sourceSize.width;

      } else { // target is wider than content

        return destSize.height > sourceSize.height;
      }

    case RCTResizeModeCover:

      if (targetAspect <= aspect) { // target is taller than content

        return destSize.height > sourceSize.height;

      } else { // target is wider than content

        return destSize.width > sourceSize.width;
      }
  }
}

UIImage *__nullable RCTDecodeImageWithData(NSData *data,
                                           CGSize destSize,
                                           CGFloat destScale,
                                           RCTResizeMode resizeMode)
{
  CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)data, NULL);
  if (!sourceRef) {
    return nil;
  }

  // Get original image size
  CFDictionaryRef imageProperties = CGImageSourceCopyPropertiesAtIndex(sourceRef, 0, NULL);
  if (!imageProperties) {
    CFRelease(sourceRef);
    return nil;
  }
  NSNumber *width = CFDictionaryGetValue(imageProperties, kCGImagePropertyPixelWidth);
  NSNumber *height = CFDictionaryGetValue(imageProperties, kCGImagePropertyPixelHeight);
  CGSize sourceSize = {width.doubleValue, height.doubleValue};
  CFRelease(imageProperties);

  if (CGSizeEqualToSize(destSize, CGSizeZero)) {
    destSize = sourceSize;
    if (!destScale) {
      destScale = 1;
    }
  } else if (!destScale) {
    destScale = RCTScreenScale();
  }

  if (resizeMode == UIViewContentModeScaleToFill) {
    // Decoder cannot change aspect ratio, so RCTResizeModeStretch is equivalent
    // to RCTResizeModeCover for our purposes
    resizeMode = RCTResizeModeCover;
  }

  // Calculate target size
  CGSize targetSize = RCTTargetSize(sourceSize, 1, destSize, destScale, resizeMode, NO);
  CGSize targetPixelSize = RCTSizeInPixels(targetSize, destScale);
  CGFloat maxPixelSize = fmax(fmin(sourceSize.width, targetPixelSize.width),
                              fmin(sourceSize.height, targetPixelSize.height));

  NSDictionary<NSString *, NSNumber *> *options = @{
    (id)kCGImageSourceShouldAllowFloat: @YES,
    (id)kCGImageSourceCreateThumbnailWithTransform: @YES,
    (id)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
    (id)kCGImageSourceThumbnailMaxPixelSize: @(maxPixelSize),
  };

  // Get thumbnail
  CGImageRef imageRef = CGImageSourceCreateThumbnailAtIndex(sourceRef, 0, (__bridge CFDictionaryRef)options);
  CFRelease(sourceRef);
  if (!imageRef) {
    return nil;
  }

  // Return image
  UIImage *image = [UIImage imageWithCGImage:imageRef
                                       scale:destScale
                                 orientation:UIImageOrientationUp];
  CGImageRelease(imageRef);
  return image;
}

NSDictionary<NSString *, id> *__nullable RCTGetImageMetadata(NSData *data)
{
  CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)data, NULL);
  if (!sourceRef) {
    return nil;
  }
  CFDictionaryRef imageProperties = CGImageSourceCopyPropertiesAtIndex(sourceRef, 0, NULL);
  CFRelease(sourceRef);
  return (__bridge_transfer id)imageProperties;
}

NSData *__nullable RCTGetImageData(CGImageRef image, float quality)
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

UIImage *__nullable RCTTransformImage(UIImage *image,
                                      CGSize destSize,
                                      CGFloat destScale,
                                      CGAffineTransform transform)
{
  if (destSize.width <= 0 | destSize.height <= 0 || destScale <= 0) {
    return nil;
  }

  UIGraphicsBeginImageContextWithOptions(destSize, NO, destScale);
  CGContextRef currentContext = UIGraphicsGetCurrentContext();
  CGContextConcatCTM(currentContext, transform);
  [image drawAtPoint:CGPointZero];
  UIImage *result = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return result;
}

BOOL RCTImageHasAlpha(CGImageRef image)
{
  switch (CGImageGetAlphaInfo(image)) {
    case kCGImageAlphaNone:
    case kCGImageAlphaNoneSkipLast:
    case kCGImageAlphaNoneSkipFirst:
      return NO;
    default:
      return YES;
  }
}

UIImage *__nullable RCTGetPlaceholderImage(CGSize size,
                                           UIColor *__nullable color)
{
  if (size.width <= 0 || size.height <= 0) {
    return nil;
  }

  // If dimensions are nonintegral, increase scale
  CGFloat scale = 1;
  if (size.width - floor(size.width) > RCTThresholdValue) {
    scale *= round(1.0 / (size.width - floor(size.width)));
  }
  if (size.height - floor(size.height) > RCTThresholdValue) {
    scale *= round(1.0 / (size.height - floor(size.height)));
  }

  // Use Euclid's algorithm to find the greatest common divisor
  // between the specified placeholder width and height;
  NSInteger a = size.width * scale;
  NSInteger b = size.height * scale;
  while (a != 0) {
    NSInteger c = a;
    a = b % a;
    b = c;
  }

  // Divide the placeholder image scale by the GCD we found above. This allows
  // us to save memory by creating the smallest possible placeholder image
  // with the correct aspect ratio, then scaling it up at display time.
  scale /= b;

  // Fill image with specified color
  CGFloat alpha = CGColorGetAlpha(color.CGColor);
  UIGraphicsBeginImageContextWithOptions(size, ABS(1.0 - alpha) < RCTThresholdValue, scale);
  if (alpha > 0) {
    [color setFill];
    UIRectFill((CGRect){CGPointZero, size});
  }
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}
