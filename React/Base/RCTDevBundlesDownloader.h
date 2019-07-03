/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>

extern NSString *const RCTDevBundleDownloaderErrorDomain;

NS_ENUM(NSInteger) {
  RCTDevBundleDownloaderErrorNoScriptURL = 1,
  RCTDevBundleDownloaderErrorURLLoadFailed = 3,
};
  
NS_ENUM(NSInteger) {
  RCTDevSourceFilesChangedCountNotBuiltByBundler = -2,
  RCTDevSourceFilesChangedCountRebuiltFromScratch = -1,
};
    
@interface RCTDevBundleLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (strong, nonatomic) NSNumber *done;
@property (strong, nonatomic) NSNumber *total;

@end
    
@interface RCTDevBundleSource : NSObject

/**
 * Name of the bundle.
 */
@property (strong, nonatomic, readonly) NSString *bundleName;

/**
 * URL of the source object.
 */
@property (strong, nonatomic, readonly) NSURL *url;

/**
 * JS source (or simply the binary header in the case of a RAM bundle).
 */
@property (strong, nonatomic, readonly) NSData *data;

/**
 * Length of the entire JS bundle. Note that self.length != self.data.length in the case of certain bundle formats. For
 * instance, when using RAM bundles:
 *
 *  - self.data will point to the bundle header
 *  - self.data.length is the length of the bundle header, i.e. sizeof(facebook::react::BundleHeader)
 *  - self.length is the length of the entire bundle file (header + contents)
 */
@property (nonatomic, readonly) NSUInteger length;

/**
 * Returns number of files changed when building this bundle:
 *
 *  - RCTSourceFilesChangedCountNotBuiltByBundler if the source wasn't built by the bundler (e.g. read from disk)
 *  - RCTSourceFilesChangedCountRebuiltFromScratch if the source was rebuilt from scratch by the bundler
 *  - Otherwise, the number of files changed when incrementally rebuilding the source
 */
@property (nonatomic, readonly) NSInteger filesChangedCount;

@end
    
typedef void (^RCTDevBundlesProgressBlock)(RCTDevBundleLoadingProgress *progressData);
typedef void (^RCTDevBundlesLoadBlock)(NSError *error, NSDictionary<NSString *, RCTDevBundleSource *> *bundles);
  
typedef void (^RCTDevBundleLoadBlock)(NSError *error, RCTDevBundleSource *bundleSource, NSArray<NSString *> *additionalBundles);
typedef void (^RCTDevBundleProgressBlock)(RCTDevBundleLoadingProgress *progressData);
    
@interface RCTDevBundlesDownloader : NSObject

@property (nonatomic, readonly) NSMutableDictionary<NSString *, RCTDevBundleSource *> *bundlesContainer;

+ (void)loadBundleAtURL:(NSURL *)scriptURL onProgress:(RCTDevBundlesProgressBlock)onProgress onComplete:(RCTDevBundlesLoadBlock)onComplete;

@end
