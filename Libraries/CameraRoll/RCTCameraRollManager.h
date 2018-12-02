/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <AssetsLibrary/AssetsLibrary.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>

@interface RCTConvert (ALAssetGroup)

+ (ALAssetsGroupType)ALAssetsGroupType:(id)json;
+ (ALAssetsFilter *)ALAssetsFilter:(id)json;

@end

@interface RCTCameraRollManager : NSObject <RCTBridgeModule>

@end
