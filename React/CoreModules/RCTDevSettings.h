/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTDefines.h>
#import <React/RCTEventEmitter.h>

@protocol RCTPackagerClientMethod;

/**
 * An abstraction for a key-value store to manage RCTDevSettings behavior.
 * The default implementation persists settings using NSUserDefaults.
 */
@protocol RCTDevSettingsDataSource <NSObject>

/**
 * Updates the setting with the given key to the given value.
 * How the data source's state changes depends on the implementation.
 */
- (void)updateSettingWithValue:(id)value forKey:(NSString *)key;

/**
 * Returns the value for the setting with the given key.
 */
- (id)settingForKey:(NSString *)key;

@end

@protocol RCTDevSettingsInspectable <NSObject>

/**
 * Whether current jsi::Runtime is inspectable.
 * Only set when using as a bridgeless turbo module.
 */
@property (nonatomic, assign, readwrite) BOOL isInspectable;

@end

@interface RCTDevSettings : RCTEventEmitter

- (instancetype)initWithDataSource:(id<RCTDevSettingsDataSource>)dataSource;

@property (nonatomic, readonly) BOOL isHotLoadingAvailable;
@property (nonatomic, readonly) BOOL isRemoteDebuggingAvailable;
@property (nonatomic, readonly) BOOL isDeviceDebuggingAvailable;
@property (nonatomic, readonly) BOOL isJSCSamplingProfilerAvailable;

/**
 * Whether the bridge is connected to a remote JS executor.
 */
@property (nonatomic, assign) BOOL isDebuggingRemotely;

/*
 * Whether shaking will show RCTDevMenu. The menu is enabled by default if RCT_DEV=1, but
 * you may wish to disable it so that you can provide your own shake handler.
 */
@property (nonatomic, assign) BOOL isShakeToShowDevMenuEnabled;

/**
 * Whether performance profiling is enabled.
 */
@property (nonatomic, assign, setter=setProfilingEnabled:) BOOL isProfilingEnabled;

/**
 * Whether hot loading is enabled.
 */
@property (nonatomic, assign, setter=setHotLoadingEnabled:) BOOL isHotLoadingEnabled;

/**
 * Enables starting of profiling sampler on launch
 */
@property (nonatomic, assign) BOOL startSamplingProfilerOnLaunch;

/**
 * Whether the element inspector is visible.
 */
@property (nonatomic, readonly) BOOL isElementInspectorShown;

/**
 * Whether the performance monitor is visible.
 */
@property (nonatomic, assign) BOOL isPerfMonitorShown;

/**
 * Toggle the element inspector.
 */
- (void)toggleElementInspector;

/**
 * Set up the HMRClient if loading the bundle from Metro.
 */
- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL;

/**
 * Register additional bundles with the HMRClient.
 */
- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL;

#if RCT_DEV_MENU
- (void)addHandler:(id<RCTPackagerClientMethod>)handler
    forPackagerMethod:(NSString *)name __deprecated_msg("Use RCTPackagerConnection directly instead");
#endif

@end

@interface RCTBridge (RCTDevSettings)

@property (nonatomic, readonly) RCTDevSettings *devSettings;

@end

// In debug builds, the dev menu is enabled by default but it is further customizable using this method.
// However, this method only has an effect in builds where the dev menu is actually compiled in.
// (i.e. RCT_DEV or RCT_DEV_MENU is set)
RCT_EXTERN void RCTDevSettingsSetEnabled(BOOL enabled);
