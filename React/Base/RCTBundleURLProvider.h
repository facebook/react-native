/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

extern NSString *const RCTBundleURLProviderUpdatedNotification;

@interface RCTBundleURLProvider : NSObject

/**
 * Set default settings on NSUserDefaults.
 */
- (void)setDefaults;

/**
 * Reset every settings to default.
 */
- (void)resetToDefaults;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle if the packager is not running.
 */
- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                   fallbackResource:(NSString *)resourceName;

/**
 * Returns the URL of the packager server.
 */
- (NSURL *)packagerServerURL;

/**
 * The IP address or hostname of the packager.
 */
@property (nonatomic, copy) NSString *jsLocation;

@property (nonatomic, assign) BOOL enableLiveReload;
@property (nonatomic, assign) BOOL enableMinification;
@property (nonatomic, assign) BOOL enableDev;

+ (instancetype)sharedSettings;

/**
 * @experimental
 * The default behavior of RCTBundleURLProvider (including the singleton shared instance) is to call
 * [NSURLConnection +sendSynchronousRequest:returningResponse:error:] to determine if the packager is running at
 * startup time. (Note this behavior is only enabled if RCT_DEV is on.) This experimental API allows you to specify
 * a custom predicate function that must return YES if the packager is running at the given host and port, and NO
 * otherwise.
 */
- (instancetype)initWithPackagerRunningPredicate:(BOOL (*)(NSString *host, NSUInteger port))packagerRunningPredicate;

@end
