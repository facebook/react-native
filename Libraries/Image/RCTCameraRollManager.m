/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTCameraRollManager.h"

#import <AssetsLibrary/AssetsLibrary.h>
#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

 #import "RCTImageLoader.h"
#import "RCTLog.h"

@implementation RCTCameraRollManager

- (void)saveImageWithTag:(NSString *)imageTag successCallback:(RCTResponseSenderBlock)successCallback errorCallback:(RCTResponseSenderBlock)errorCallback
{
  RCT_EXPORT();

  [RCTImageLoader loadImageWithTag:imageTag callback:^(NSError *loadError, UIImage *loadedImage) {
    if (loadError) {
      errorCallback(@[[loadError localizedDescription]]);
      return;
    }
    [[RCTImageLoader assetsLibrary] writeImageToSavedPhotosAlbum:[loadedImage CGImage] metadata:nil completionBlock:^(NSURL *assetURL, NSError *saveError) {
      if (saveError) {
        NSString *errorMessage = [NSString stringWithFormat:@"Error saving cropped image: %@", saveError];
        RCTLogWarn(@"%@", errorMessage);
        errorCallback(@[errorMessage]);
        return;
      }
      successCallback(@[[assetURL absoluteString]]);
    }];
  }];
}

- (void)callCallback:(RCTResponseSenderBlock)callback withAssets:(NSArray *)assets hasNextPage:(BOOL)hasNextPage
{
  if (![assets count]) {
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

- (void)getPhotos:(NSDictionary *)params callback:(RCTResponseSenderBlock)callback errorCallback:(RCTResponseSenderBlock)errorCallback
{
  RCT_EXPORT();

  NSUInteger first = [params[@"first"] integerValue];
  NSString *afterCursor = params[@"after"];
  NSString *groupTypesStr = params[@"groupTypes"];
  NSString *groupName = params[@"groupName"];
  ALAssetsGroupType groupTypes;
  if ([groupTypesStr isEqualToString:@"Album"]) {
    groupTypes = ALAssetsGroupAlbum;
  } else if ([groupTypesStr isEqualToString:@"All"]) {
    groupTypes = ALAssetsGroupAll;
  } else if ([groupTypesStr isEqualToString:@"Event"]) {
    groupTypes = ALAssetsGroupEvent;
  } else if ([groupTypesStr isEqualToString:@"Faces"]) {
    groupTypes = ALAssetsGroupFaces;
  } else if ([groupTypesStr isEqualToString:@"Library"]) {
    groupTypes = ALAssetsGroupLibrary;
  } else if ([groupTypesStr isEqualToString:@"PhotoStream"]) {
    groupTypes = ALAssetsGroupPhotoStream;
  } else {
    groupTypes = ALAssetsGroupSavedPhotos;
  }

  BOOL __block foundAfter = NO;
  BOOL __block hasNextPage = NO;
  BOOL __block calledCallback = NO;
  NSMutableArray *assets = [[NSMutableArray alloc] init];

  [[RCTImageLoader assetsLibrary] enumerateGroupsWithTypes:groupTypes usingBlock:^(ALAssetsGroup *group, BOOL *stopGroups) {
    if (group && (groupName == nil || [groupName isEqualToString:[group valueForProperty:ALAssetsGroupPropertyName]])) {
      [group setAssetsFilter:ALAssetsFilter.allPhotos];
      [group enumerateAssetsWithOptions:NSEnumerationReverse usingBlock:^(ALAsset *result, NSUInteger index, BOOL *stopAssets) {
        if (result) {
          NSString *uri = [(NSURL *)[result valueForProperty:ALAssetPropertyAssetURL] absoluteString];
          if (afterCursor && !foundAfter) {
            if ([afterCursor isEqualToString:uri]) {
              foundAfter = YES;
            }
            return; // Skip until we get to the first one
          }
          if (first == [assets count]) {
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
                                  @"timestamp": @([date timeIntervalSince1970]),
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
    errorCallback(@[error.description]);
  }];
}

@end
