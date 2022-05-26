/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "Screenshot.h"

#import <React/RCTUIManager.h>

@implementation ScreenshotManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(takeScreenshot
                  : (id /* NSString or NSNumber */)target withOptions
                  : (NSDictionary *)options resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        // Get view
        UIView *view;
        if (target == nil || [target isEqual:@"window"]) {
          view = RCTKeyWindow();
        } else if ([target isKindOfClass:[NSNumber class]]) {
          view = viewRegistry[target];
          if (!view) {
            RCTLogError(@"No view found with reactTag: %@", target);
            return;
          }
        }

        // Get options
        CGSize size = [RCTConvert CGSize:options];
        NSString *format = [RCTConvert NSString:options[@"format"] ?: @"png"];

        // Capture image
        if (size.width < 0.1 || size.height < 0.1) {
          size = view.bounds.size;
        }
        UIGraphicsBeginImageContextWithOptions(size, NO, 0);
        BOOL success = [view drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
        UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
        UIGraphicsEndImageContext();

        if (!success || !image) {
          reject(RCTErrorUnspecified, @"Failed to capture view snapshot.", nil);
          return;
        }

        // Convert image to data (on a background thread)
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          NSData *data;
          if ([format isEqualToString:@"png"]) {
            data = UIImagePNGRepresentation(image);
          } else if ([format isEqualToString:@"jpeg"]) {
            CGFloat quality = [RCTConvert CGFloat:options[@"quality"] ?: @1];
            data = UIImageJPEGRepresentation(image, quality);
          } else {
            RCTLogError(@"Unsupported image format: %@", format);
            return;
          }

          // Save to a temp file
          NSError *error = nil;
          NSString *tempFilePath = RCTTempFilePath(format, &error);
          if (tempFilePath) {
            if ([data writeToFile:tempFilePath options:(NSDataWritingOptions)0 error:&error]) {
              resolve(tempFilePath);
              return;
            }
          }

          // If we reached here, something went wrong
          reject(RCTErrorUnspecified, error.localizedDescription, error);
        });
      }];
}

@end
