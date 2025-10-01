/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

typedef NSURL * (^RCTBridgelessBundleURLGetter)(void);
typedef void (^RCTBridgelessBundleURLSetter)(NSURL *bundleURL);

/**
 * Configuration class for setting up custom bundle locations
 */
@interface RCTCustomBundleConfiguration : NSObject

/**
 * The URL of the bundle to load from the file system
 */
@property (nonatomic, readonly, nullable) NSURL *bundleFilePath;

/**
 * The server scheme (e.g. http or https) to use when loading from the packager
 */
@property (nonatomic, readonly, nullable) NSString *packagerServerScheme;

/**
 * The server host (e.g. localhost) to use when loading from the packager
 */
@property (nonatomic, readonly, nullable) NSString *packagerServerHost;

- (instancetype)initWithBundleFilePath:(NSURL *)bundleFilePath;

- (instancetype)initWithPackagerServerScheme:(NSString *)packagerServerScheme
                          packagerServerHost:(NSString *)packagerServerHost;

- (NSURL *)getBundleURL:(NSURL *__nullable (^)(void))fallbackURLProvider;

- (NSString *)getPackagerServerScheme;

- (NSString *)getPackagerServerHost;

- (void)clean;

@end

/**
 * A class that allows NativeModules/TurboModules to read/write the bundleURL, with or without the bridge.
 */
@interface RCTBundleManager : NSObject
#ifndef RCT_REMOVE_LEGACY_ARCH
- (void)setBridge:(RCTBridge *)bridge;
#endif // RCT_REMOVE_LEGACY_ARCH
- (void)setBridgelessBundleURLGetter:(RCTBridgelessBundleURLGetter)getter
                           andSetter:(RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(RCTBridgelessBundleURLGetter)defaultGetter;
- (void)resetBundleURL;
@property NSURL *bundleURL;
@property (nonatomic, nullable) RCTCustomBundleConfiguration *customBundleConfig;
@end
