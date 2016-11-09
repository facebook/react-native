/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTDefines.h"

/**
 * RCTScriptTag
 *
 * Scripts given to the JS Executors to run could be in any of the following
 * formats. They are tagged so the executor knows how to run them.
 */
typedef NS_ENUM(NSInteger) {
  RCTScriptString = 0,
  RCTScriptRAMBundle,
  RCTScriptBCBundle,
} RCTScriptTag;

/**
 * RCTMagicNumber
 *
 * RAM bundles and BC bundles begin with magic numbers. For RAM bundles this is
 * 4 bytes, for BC bundles this is 8 bytes. This structure holds the first 8
 * bytes from a bundle in a way that gives access to that information.
 */
typedef union {
  uint64_t allBytes;
  uint32_t first4;
  uint64_t first8;
} RCTMagicNumber;

/**
 * RCTParseMagicNumber
 *
 * Takes the first 8 bytes of a bundle, and returns a tag describing the
 * bundle's format.
 */
RCT_EXTERN RCTScriptTag RCTParseMagicNumber(RCTMagicNumber magic);

extern NSString *const RCTJavaScriptLoaderErrorDomain;

NS_ENUM(NSInteger) {
  RCTJavaScriptLoaderErrorNoScriptURL = 1,
  RCTJavaScriptLoaderErrorFailedOpeningFile = 2,
  RCTJavaScriptLoaderErrorFailedReadingFile = 3,
  RCTJavaScriptLoaderErrorFailedStatingFile = 3,
  RCTJavaScriptLoaderErrorURLLoadFailed = 3,

  RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously = 1000,
};

@interface RCTLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (strong, nonatomic) NSNumber *done;
@property (strong, nonatomic) NSNumber *total;

@end

typedef void (^RCTSourceLoadProgressBlock)(RCTLoadingProgress *progressData);
typedef void (^RCTSourceLoadBlock)(NSError *error, NSData *source, int64_t sourceLength);

@interface RCTJavaScriptLoader : NSObject

+ (void)loadBundleAtURL:(NSURL *)scriptURL onProgress:(RCTSourceLoadProgressBlock)onProgress onComplete:(RCTSourceLoadBlock)onComplete;

/**
 * @experimental
 * Attempts to synchronously load the script at the given URL. The following two conditions must be met:
 *   1. It must be a file URL.
 *   2. It must not point to a text/javascript file.
 * If the URL does not meet those conditions, this method will return nil and supply an error with the domain
 * RCTJavaScriptLoaderErrorDomain and the code RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously.
 */
+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                                   sourceLength:(int64_t *)sourceLength
                                          error:(NSError **)error;

@end
