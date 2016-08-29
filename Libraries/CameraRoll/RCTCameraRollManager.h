/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridgeModule.h"
#import "RCTConvert.h"

#if !TARGET_OS_TV
#import <AssetsLibrary/AssetsLibrary.h>

@interface RCTConvert (ALAssetGroup)

+ (ALAssetsGroupType)ALAssetsGroupType:(id)json;
+ (ALAssetsFilter *)ALAssetsFilter:(id)json;

@end
#endif //TARGET_OS_TV

@interface RCTCameraRollManager : NSObject <RCTBridgeModule>

@end
