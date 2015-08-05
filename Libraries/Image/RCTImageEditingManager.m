/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageEditingManager.h"

#import <UIKit/UIKit.h>

#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

#import "RCTImageStoreManager.h"
#import "RCTImageLoader.h"

@implementation RCTImageEditingManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

/**
 * Crops an image and adds the result to the image store.
 *
 * @param imageTag A URL, a string identifying an asset etc.
 * @param cropData Dictionary with `offset`, `size` and `displaySize`.
 *        `offset` and `size` are relative to the full-resolution image size.
 *        `displaySize` is an optimization - if specified, the image will
 *        be scaled down to `displaySize` rather than `size`.
 *        All units are in px (not points).
 */
RCT_EXPORT_METHOD(cropImage:(NSString *)imageTag
                  cropData:(NSDictionary *)cropData
                  successCallback:(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
  NSDictionary *offset = cropData[@"offset"];
  NSDictionary *size = cropData[@"size"];
  NSDictionary *displaySize = cropData[@"displaySize"];
  NSString *resizeMode = cropData[@"resizeMode"] ?: @"contain";

  if (!offset[@"x"] || !offset[@"y"] || !size[@"width"] || !size[@"height"]) {
    NSString *errorMessage = [NSString stringWithFormat:@"Invalid cropData: %@", cropData];
    RCTLogError(@"%@", errorMessage);
    errorCallback(RCTErrorWithMessage(errorMessage));
    return;
  }

  [_bridge.imageLoader loadImageWithTag:imageTag callback:^(NSError *error, UIImage *image) {
    if (error) {
      errorCallback(error);
      return;
    }
    CGRect rect = (CGRect){
      [RCTConvert CGPoint:offset],
      [RCTConvert CGSize:size]
    };

    // Crop image
    CGRect rectToDrawIn = {{-rect.origin.x, -rect.origin.y}, image.size};
    UIGraphicsBeginImageContextWithOptions(rect.size, !RCTImageHasAlpha(image.CGImage), image.scale);
    [image drawInRect:rectToDrawIn];
    UIImage *croppedImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (displaySize && displaySize[@"width"] && displaySize[@"height"]) {
      CGSize targetSize = [RCTConvert CGSize:displaySize];
      croppedImage = [self scaleImage:croppedImage targetSize:targetSize resizeMode:resizeMode];
    }

    [_bridge.imageStoreManager storeImage:croppedImage withBlock:^(NSString *croppedImageTag) {
      if (!croppedImageTag) {
        NSString *errorMessage = @"Error storing cropped image in RCTImageStoreManager";
        RCTLogWarn(@"%@", errorMessage);
        errorCallback(RCTErrorWithMessage(errorMessage));
        return;
      }
      successCallback(@[croppedImageTag]);
    }];
  }];
}

- (UIImage *)scaleImage:(UIImage *)image targetSize:(CGSize)targetSize resizeMode:(NSString *)resizeMode
{
  if (CGSizeEqualToSize(image.size, targetSize)) {
    return image;
  }

  CGFloat imageRatio = image.size.width / image.size.height;
  CGFloat targetRatio = targetSize.width / targetSize.height;

  CGFloat newWidth = targetSize.width;
  CGFloat newHeight = targetSize.height;

  // contain vs cover
  // http://blog.vjeux.com/2013/image/css-container-and-cover.html
  if ([resizeMode isEqualToString:@"contain"]) {
    if (imageRatio <= targetRatio) {
      newWidth = targetSize.height * imageRatio;
      newHeight = targetSize.height;
    } else {
      newWidth = targetSize.width;
      newHeight = targetSize.width / imageRatio;
    }
  } else if ([resizeMode isEqualToString:@"cover"]) {
    if (imageRatio <= targetRatio) {
      newWidth = targetSize.width;
      newHeight = targetSize.width / imageRatio;
    } else {
      newWidth = targetSize.height * imageRatio;
      newHeight = targetSize.height;
    }
  } // else assume we're stretching the image

  // prevent upscaling
  newWidth = MIN(newWidth, image.size.width);
  newHeight = MIN(newHeight, image.size.height);

  // perform the scaling @1x because targetSize is in actual pixel width/height
  UIGraphicsBeginImageContextWithOptions(targetSize, NO, 1.0f);
  [image drawInRect:CGRectMake(0.f, 0.f, newWidth, newHeight)];
  UIImage *scaledImage = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  return scaledImage;
}

@end
