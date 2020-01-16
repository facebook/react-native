/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Photos/Photos.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>

@interface RCTConvert (PHFetchOptions)

+ (PHFetchOptions *)PHFetchOptionsFromMediaType:(NSString *)mediaType;

@end


@interface RCTCameraRollManager : NSObject <RCTBridgeModule>

@end
