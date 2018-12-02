/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTURLRequestHandler.h>

@class ALAssetsLibrary;

@interface RCTAssetsLibraryRequestHandler : NSObject <RCTURLRequestHandler>

@end

@interface RCTBridge (RCTAssetsLibraryImageLoader)

/**
 * The shared asset library instance.
 */
@property (nonatomic, readonly) ALAssetsLibrary *assetsLibrary;

@end
