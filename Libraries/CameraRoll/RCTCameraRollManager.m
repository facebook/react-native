/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTCameraRollManager.h"

#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "RCTAssetsLibraryImageLoader.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTImageLoader.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTConvert (ALAssetGroup)

RCT_ENUM_CONVERTER(ALAssetsGroupType, (@{

  // New values
  @"album": @(ALAssetsGroupAlbum),
  @"all": @(ALAssetsGroupAll),
  @"event": @(ALAssetsGroupEvent),
  @"faces": @(ALAssetsGroupFaces),
  @"library": @(ALAssetsGroupLibrary),
  @"photo-stream": @(ALAssetsGroupPhotoStream),
  @"saved-photos": @(ALAssetsGroupSavedPhotos),

  // Legacy values
  @"Album": @(ALAssetsGroupAlbum),
  @"All": @(ALAssetsGroupAll),
  @"Event": @(ALAssetsGroupEvent),
  @"Faces": @(ALAssetsGroupFaces),
  @"Library": @(ALAssetsGroupLibrary),
  @"PhotoStream": @(ALAssetsGroupPhotoStream),
  @"SavedPhotos": @(ALAssetsGroupSavedPhotos),

}), ALAssetsGroupSavedPhotos, integerValue)

+ (ALAssetsFilter *)ALAssetsFilter:(id)json
{
  static NSDictionary *options;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    options = @{

      // New values
      @"photos": [ALAssetsFilter allPhotos],
      @"videos": [ALAssetsFilter allVideos],
      @"all": [ALAssetsFilter allAssets],

      // Legacy values
      @"Photos": [ALAssetsFilter allPhotos],
      @"Videos": [ALAssetsFilter allVideos],
      @"All": [ALAssetsFilter allAssets],
    };
  });

  ALAssetsFilter *filter = options[json ?: @"photos"];
  if (!filter) {
    RCTLogError(@"Invalid filter option: '%@'. Expected one of 'photos',"
                "'videos' or 'all'.", json);
  }
  return filter ?: [ALAssetsFilter allPhotos];
}

@end

@implementation RCTCameraRollManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

RCT_EXPORT_METHOD(saveImageWithTag:(NSString *)imageTag
                  successCallback:(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
  [_bridge.imageLoader loadImageWithTag:imageTag callback:^(NSError *loadError, UIImage *loadedImage) {
    if (loadError) {
      errorCallback(loadError);
      return;
    }
    // It's unclear if writeImageToSavedPhotosAlbum is thread-safe
    dispatch_async(dispatch_get_main_queue(), ^{
      [_bridge.assetsLibrary writeImageToSavedPhotosAlbum:loadedImage.CGImage metadata:nil completionBlock:^(NSURL *assetURL, NSError *saveError) {
        if (saveError) {
          RCTLogWarn(@"Error saving cropped image: %@", saveError);
          errorCallback(saveError);
        } else {
          successCallback(@[assetURL.absoluteString]);
        }
      }];
    });
  }];
}

- (void)callCallback:(RCTResponseSenderBlock)callback
          withAssets:(NSArray<NSDictionary *> *)assets
         hasNextPage:(BOOL)hasNextPage
{
  if (!assets.count) {
    callback(@[@{
                 @"edges": assets,
                 @"page_info": @{
                     @"has_next_page": @NO}
                 }]);
    return;
  }
  callback(@[@{
               @"edges": assets,
               @"page_info": @{
                   @"start_cursor": assets[0][@"node"][@"image"][@"uri"],
                   @"end_cursor": assets[assets.count - 1][@"node"][@"image"][@"uri"],
                   @"has_next_page": @(hasNextPage)}
               }]);
}

RCT_EXPORT_METHOD(getPhotos:(NSDictionary *)params
                  callback:(RCTResponseSenderBlock)callback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
  NSUInteger first = [RCTConvert NSInteger:params[@"first"]];
  NSString *afterCursor = [RCTConvert NSString:params[@"after"]];
  NSString *groupName = [RCTConvert NSString:params[@"groupName"]];
  ALAssetsFilter *assetType = [RCTConvert ALAssetsFilter:params[@"assetType"]];
  ALAssetsGroupType groupTypes = [RCTConvert ALAssetsGroupType:params[@"groupTypes"]];

  BOOL __block foundAfter = NO;
  BOOL __block hasNextPage = NO;
  BOOL __block calledCallback = NO;
  NSMutableArray<NSDictionary *> *assets = [NSMutableArray new];

  [_bridge.assetsLibrary enumerateGroupsWithTypes:groupTypes usingBlock:^(ALAssetsGroup *group, BOOL *stopGroups) {
    if (group && (groupName == nil || [groupName isEqualToString:[group valueForProperty:ALAssetsGroupPropertyName]])) {

      [group setAssetsFilter:assetType];
      [group enumerateAssetsWithOptions:NSEnumerationReverse usingBlock:^(ALAsset *result, NSUInteger index, BOOL *stopAssets) {
        if (result) {
          NSString *uri = ((NSURL *)[result valueForProperty:ALAssetPropertyAssetURL]).absoluteString;
          if (afterCursor && !foundAfter) {
            if ([afterCursor isEqualToString:uri]) {
              foundAfter = YES;
            }
            return; // Skip until we get to the first one
          }
          if (first == assets.count) {
            *stopAssets = YES;
            *stopGroups = YES;
            hasNextPage = YES;
            RCTAssert(calledCallback == NO, @"Called the callback before we finished processing the results.");
            [self callCallback:callback withAssets:assets hasNextPage:hasNextPage];
            calledCallback = YES;
            return;
          }
          CGSize dimensions = [result defaultRepresentation].dimensions;
          CLLocation *loc = [result valueForProperty:ALAssetPropertyLocation];
          NSDate *date = [result valueForProperty:ALAssetPropertyDate];
          [assets addObject:@{
                              @"node": @{
                                  @"type": [result valueForProperty:ALAssetPropertyType],
                                  @"group_name": [group valueForProperty:ALAssetsGroupPropertyName],
                                  @"image": @{
                                      @"uri": uri,
                                      @"height": @(dimensions.height),
                                      @"width": @(dimensions.width),
                                      @"isStored": @YES,
                                      },
                                  @"timestamp": @(date.timeIntervalSince1970),
                                  @"location": loc ?
                                  @{
                                    @"latitude": @(loc.coordinate.latitude),
                                    @"longitude": @(loc.coordinate.longitude),
                                    @"altitude": @(loc.altitude),
                                    @"heading": @(loc.course),
                                    @"speed": @(loc.speed),
                                    } : @{},
                                  }
                              }];
        }
      }];
    } else {
      // Sometimes the enumeration continues even if we set stop above, so we guard against calling the callback
      // multiple times here.
      if (!calledCallback) {
        [self callCallback:callback withAssets:assets hasNextPage:hasNextPage];
        calledCallback = YES;
      }
    }
  } failureBlock:^(NSError *error) {
    if (error.code != ALAssetsLibraryAccessUserDeniedError) {
      RCTLogError(@"Failure while iterating through asset groups %@", error);
    }
    errorCallback(error);
  }];
}

@end
