/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridgeDelegate.h"

extern uint32_t const RCTRAMBundleMagicNumber;

extern NSString *const RCTJavaScriptLoaderErrorDomain;

NS_ENUM(NSInteger) {
  RCTJavaScriptLoaderErrorNoScriptURL = 1,
  RCTJavaScriptLoaderErrorFailedOpeningFile = 2,
  RCTJavaScriptLoaderErrorFailedReadingFile = 3,
  RCTJavaScriptLoaderErrorFailedStatingFile = 3,
  RCTJavaScriptLoaderErrorURLLoadFailed = 3,

  RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously = 1000,
};

@class RCTBridge;

/**
 * Class that allows easy embedding, loading, life-cycle management of a
 * JavaScript application inside of a native application.
 * TODO: Incremental module loading. (low pri).
 */
@interface RCTJavaScriptLoader : NSObject

+ (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(RCTSourceLoadBlock)onComplete;

/**
 * @experimental
 * Attempts to synchronously load the script at the given URL. The following two conditions must be met:
 * 1. It must be a file URL.
 * 2. It must point to a RAM bundle, or allowLoadingNonRAMBundles must be YES.
 * If the URL does not meet those conditions, this method will return nil and supply an error with the domain
 * RCTJavaScriptLoaderErrorDomain and the code RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously.
 */
+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                                   sourceLength:(int64_t *)sourceLength
                      allowLoadingNonRAMBundles:(BOOL)allowLoadingNonRAMBundles
                                          error:(NSError **)error;

@end
