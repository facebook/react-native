/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@interface RCTBundleURLProvider : NSObject

extern NSString *const RCTBundleURLProviderUpdatedNotification;

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
@end
