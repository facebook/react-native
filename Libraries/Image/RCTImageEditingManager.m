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

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "RCTImageLoader.h"
#import "RCTImageStoreManager.h"
#import "RCTImageUtils.h"

@implementation RCTImageEditingManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

/**
 * Crops an image and adds the result to the image store.
 *
 * @param imageRequest An image URL
 * @param cropData Dictionary with `offset`, `size`, `displaySize` and
 *        `quality`.
 *        `offset` and `size` are relative to the full-resolution image size.
 *        `displaySize` is an optimization - if specified, the image will
 *        be scaled down to `displaySize` rather than `size`.
 *        `quality` - optionally specify the JPEG compression quality to use.
 *        All units are in px (not points).
 */
RCT_EXPORT_METHOD(cropImage:(NSURLRequest *)imageRequest
                  cropData:(NSDictionary *)cropData
                  successCallback:(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
  CGRect rect = {
    [RCTConvert CGPoint:cropData[@"offset"]],
    [RCTConvert CGSize:cropData[@"size"]]
  };

  [_bridge.imageLoader loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
    if (error) {
      errorCallback(error);
      return;
    }

    // Crop image
    CGSize targetSize = rect.size;
    CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
    CGAffineTransform transform = RCTTransformFromTargetRect(image.size, targetRect);
    UIImage *croppedImage = RCTTransformImage(image, targetSize, image.scale, transform);

    // Scale image
    if (cropData[@"displaySize"]) {
      targetSize = [RCTConvert CGSize:cropData[@"displaySize"]]; // in pixels
      RCTResizeMode resizeMode = [RCTConvert RCTResizeMode:cropData[@"resizeMode"] ?: @"contain"];
      targetRect = RCTTargetRect(croppedImage.size, targetSize, 1, resizeMode);
      transform = RCTTransformFromTargetRect(croppedImage.size, targetRect);
      croppedImage = RCTTransformImage(croppedImage, targetSize, image.scale, transform);
    }

    // Store image
    void (^block)(NSString *croppedImageTag) = ^(NSString *croppedImageTag) {
      if (!croppedImageTag) {
        NSString *errorMessage = @"Error storing cropped image in RCTImageStoreManager";
        RCTLogWarn(@"%@", errorMessage);
        errorCallback(RCTErrorWithMessage(errorMessage));
        return;
      }
      successCallback(@[croppedImageTag]);
    };

    if (cropData[@"quality"]) {
      float quality = [cropData[@"quality"] floatValue];
      [self->_bridge.imageStoreManager storeImage:croppedImage quality:quality withBlock:block];
    }
    else {
      [self->_bridge.imageStoreManager storeImage:croppedImage withBlock:block];
    }
  }];
}

@end
