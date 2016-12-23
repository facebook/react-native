/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDevSettings.h"

#import <objc/runtime.h>
#import <JavaScriptCore/JavaScriptCore.h>
#import <jschelpers/JavaScriptCore.h>

#import "JSCSamplingProfiler.h"

#import "RCTBridge+Private.h"
#import "RCTBridgeModule.h"
#import "RCTDevMenu.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTUtils.h"
#import "RCTWebSocketObserverProtocol.h"

NSString *const kRCTDevSettingProfilingEnabled = @"profilingEnabled";
NSString *const kRCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";
NSString *const kRCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kRCTDevSettingIsInspectorShown = @"showInspector";
NSString *const kRCTDevSettingIsDebuggingRemotely = @"isDebuggingRemotely";
NSString *const kRCTDevSettingWebsocketExecutorName = @"websocket-executor-name";
NSString *const kRCTDevSettingExecutorOverrideClass = @"executor-override";
NSString *const kRCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kRCTDevSettingIsPerfMonitorShown = @"RCTPerfMonitorKey";
NSString *const kRCTDevSettingIsJSCProfilingEnabled = @"RCTJSCProfilerEnabled";
NSString *const kRCTDevSettingStartSamplingProfilerOnLaunch = @"startSamplingProfilerOnLaunch";

NSString *const kRCTDevSettingsUserDefaultsKey = @"RCTDevMenu";

#if RCT_DEV

@interface RCTDevSettingsUserDefaultsDataSource : NSObject <RCTDevSettingsDataSource>

@property (nonatomic, strong) NSMutableDictionary *settings;

@end

@implementation RCTDevSettingsUserDefaultsDataSource

- (instancetype)init
{
  return [self initWithDefaultValues:nil];
}

- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues
{
  if (self = [super init]) {
    if (defaultValues) {
      [self _reloadWithDefaults:defaultValues];
    }
  }
  return self;
}

- (void)updateSettingWithValue:(id)value forKey:(NSString *)key
{
  RCTAssert((key != nil), @"%@", [NSString stringWithFormat:@"%@: Tried to update nil key", [self class]]);

  id currentValue = _settings[key];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[key] = value;
  } else {
    [_settings removeObjectForKey:key];
  }
  [[NSUserDefaults standardUserDefaults] setObject:_settings forKey:kRCTDevSettingsUserDefaultsKey];
}

- (id)settingForKey:(NSString *)key
{
  return _settings[key];
}

- (void)_reloadWithDefaults:(NSDictionary *)defaultValues
{
  NSUserDefaults *standardDefaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *existingSettings = [standardDefaults objectForKey:kRCTDevSettingsUserDefaultsKey];
  _settings = (existingSettings) ? [existingSettings mutableCopy] : [NSMutableDictionary dictionary];
  for (NSString *key in [defaultValues keyEnumerator]) {
    if (!_settings[key]) {
      _settings[key] = defaultValues[key];
    }
  }
  [standardDefaults setObject:_settings forKey:kRCTDevSettingsUserDefaultsKey];
}

@end

@interface RCTDevSettings () <RCTBridgeModule, RCTInvalidating, RCTWebSocketObserverDelegate>
{
  NSURLSessionDataTask *_liveReloadUpdateTask;
  NSURL *_liveReloadURL;
  BOOL _isJSLoaded;
}

@property (nonatomic, strong) Class executorClass;
@property (nonatomic, readwrite, strong) id<RCTDevSettingsDataSource> dataSource;

@end

@implementation RCTDevSettings

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  // default behavior is to use NSUserDefaults
  NSDictionary *defaultValues = @{
    kRCTDevSettingShakeToShowDevMenu: @YES,
  };
  RCTDevSettingsUserDefaultsDataSource *dataSource = [[RCTDevSettingsUserDefaultsDataSource alloc] initWithDefaultValues:defaultValues];
  return [self initWithDataSource:dataSource];
}

- (instancetype)initWithDataSource:(id<RCTDevSettingsDataSource>)dataSource
{
  if (self = [super init]) {
    _dataSource = dataSource;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];

    // Delay setup until after Bridge init
    dispatch_async(dispatch_get_main_queue(), ^{
      [self _synchronizeAllSettings];
      [self connectPackager];
    });
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  [_liveReloadUpdateTask cancel];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)_updateSettingWithValue:(id)value forKey:(NSString *)key
{
  [_dataSource updateSettingWithValue:value forKey:key];
}

- (id)settingForKey:(NSString *)key
{
  return [_dataSource settingForKey:key];
}

- (BOOL)isRemoteDebuggingAvailable
{
  Class jsDebuggingExecutorClass = objc_lookUpClass("RCTWebSocketExecutor");
  return (jsDebuggingExecutorClass != nil);
}

- (BOOL)isHotLoadingAvailable
{
  return _bridge.bundleURL && !_bridge.bundleURL.fileURL; // Only works when running from server
}

- (BOOL)isLiveReloadAvailable
{
  return (_liveReloadURL != nil);
}

- (BOOL)isJSCSamplingProfilerAvailable
{
  return JSC_JSSamplingProfilerEnabled(_bridge.jsContext.JSGlobalContextRef);
}

RCT_EXPORT_METHOD(reload)
{
  [_bridge reload];
}

- (void)setWebsocketExecutorName:(NSString *)websocketExecutorName
{
  [self _updateSettingWithValue:websocketExecutorName forKey:kRCTDevSettingWebsocketExecutorName];
}

- (NSString *)websocketExecutorName
{
  return [self settingForKey:kRCTDevSettingWebsocketExecutorName];
}

- (void)setIsShakeToShowDevMenuEnabled:(BOOL)isShakeToShowDevMenuEnabled
{
  [self _updateSettingWithValue:@(isShakeToShowDevMenuEnabled) forKey:kRCTDevSettingShakeToShowDevMenu];
}

- (BOOL)isShakeToShowDevMenuEnabled
{
  return [[self settingForKey:kRCTDevSettingShakeToShowDevMenu] boolValue];
}

RCT_EXPORT_METHOD(setIsDebuggingRemotely:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kRCTDevSettingIsDebuggingRemotely];
  [self _remoteDebugSettingDidChange];
}

- (BOOL)isDebuggingRemotely
{
  return [[self settingForKey:kRCTDevSettingIsDebuggingRemotely] boolValue];
}

- (void)_remoteDebugSettingDidChange
{
  BOOL enabled = self.isRemoteDebuggingAvailable && self.isDebuggingRemotely;
  Class executorOverrideClass = [self settingForKey:kRCTDevSettingExecutorOverrideClass];
  Class jsDebuggingExecutorClass = (executorOverrideClass) ?: NSClassFromString(@"RCTWebSocketExecutor");
  self.executorClass = enabled ? jsDebuggingExecutorClass : nil;
}

RCT_EXPORT_METHOD(setProfilingEnabled:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kRCTDevSettingProfilingEnabled];
  [self _profilingSettingDidChange];
}

- (BOOL)isProfilingEnabled
{
  return [[self settingForKey:kRCTDevSettingProfilingEnabled] boolValue];
}

- (void)_profilingSettingDidChange
{
  BOOL enabled = self.isProfilingEnabled;
  if (_liveReloadURL && enabled != RCTProfileIsProfiling()) {
    if (enabled) {
      [_bridge startProfiling];
    } else {
      [_bridge stopProfiling:^(NSData *logData) {
        RCTProfileSendResult(self->_bridge, @"systrace", logData);
      }];
    }
  }
}

RCT_EXPORT_METHOD(setLiveReloadEnabled:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kRCTDevSettingLiveReloadEnabled];
  [self _liveReloadSettingDidChange];
}

- (BOOL)isLiveReloadEnabled
{
  return [[self settingForKey:kRCTDevSettingLiveReloadEnabled] boolValue];
}

- (void)_liveReloadSettingDidChange
{
  BOOL liveReloadEnabled = (self.isLiveReloadAvailable && self.isLiveReloadEnabled);
  if (liveReloadEnabled) {
    [self _pollForLiveReload];
  } else {
    [_liveReloadUpdateTask cancel];
    _liveReloadUpdateTask = nil;
  }
}

RCT_EXPORT_METHOD(setHotLoadingEnabled:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kRCTDevSettingHotLoadingEnabled];
  [self _hotLoadingSettingDidChange];
}

- (BOOL)isHotLoadingEnabled
{
  return [[self settingForKey:kRCTDevSettingHotLoadingEnabled] boolValue];
}

- (void)_hotLoadingSettingDidChange
{
  BOOL hotLoadingEnabled = self.isHotLoadingAvailable && self.isHotLoadingEnabled;
  if (RCTGetURLQueryParam(_bridge.bundleURL, @"hot").boolValue != hotLoadingEnabled) {
    _bridge.bundleURL = RCTURLByReplacingQueryParam(_bridge.bundleURL, @"hot",
                                                    hotLoadingEnabled ? @"true" : nil);
    [_bridge reload];
  }
}

RCT_EXPORT_METHOD(toggleElementInspector)
{
  BOOL value = [[self settingForKey:kRCTDevSettingIsInspectorShown] boolValue];
  [self _updateSettingWithValue:@(!value) forKey:kRCTDevSettingIsInspectorShown];

  if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [self.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
  }
}

- (void)toggleJSCSamplingProfiler
{
  JSContext *context = _bridge.jsContext;
  JSGlobalContextRef globalContext = context.JSGlobalContextRef;
  // JSPokeSamplingProfiler() toggles the profiling process
  JSValueRef jsResult = JSC_JSPokeSamplingProfiler(globalContext);
  
  if (JSC_JSValueGetType(globalContext, jsResult) != kJSTypeNull) {
    NSString *results = [[JSC_JSValue(globalContext) valueWithJSValueRef:jsResult inContext:context] toObject];
    JSCSamplingProfiler *profilerModule = [_bridge moduleForClass:[JSCSamplingProfiler class]];
    [profilerModule operationCompletedWithResults:results];
  }
}

- (BOOL)isElementInspectorShown
{
  return [[self settingForKey:kRCTDevSettingIsInspectorShown] boolValue];
}

- (void)setIsPerfMonitorShown:(BOOL)isPerfMonitorShown
{
  [self _updateSettingWithValue:@(isPerfMonitorShown) forKey:kRCTDevSettingIsPerfMonitorShown];
}

- (BOOL)isPerfMonitorShown
{
  return [[self settingForKey:kRCTDevSettingIsPerfMonitorShown] boolValue];
}

- (void)setIsJSCProfilingEnabled:(BOOL)isJSCProfilingEnabled
{
  [self _updateSettingWithValue:@(isJSCProfilingEnabled) forKey:kRCTDevSettingIsJSCProfilingEnabled];
}

- (BOOL)isJSCProfilingEnabled
{
  return [[self settingForKey:kRCTDevSettingIsJSCProfilingEnabled] boolValue];
}

- (void)setStartSamplingProfilerOnLaunch:(BOOL)startSamplingProfilerOnLaunch
{
  [self _updateSettingWithValue:@(startSamplingProfilerOnLaunch) forKey:kRCTDevSettingStartSamplingProfilerOnLaunch];
}

- (BOOL)startSamplingProfilerOnLaunch
{
  return [[self settingForKey:kRCTDevSettingStartSamplingProfilerOnLaunch] boolValue];
}

- (void)setExecutorClass:(Class)executorClass
{
  _executorClass = executorClass;
  if (_bridge.executorClass != executorClass) {
    
    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil &&
        _bridge.executorClass != objc_lookUpClass("RCTWebSocketExecutor")) {
      return;
    }
    
    _bridge.executorClass = executorClass;
    [_bridge reload];
  }
}

#pragma mark - internal

/**
 *  Query the data source for all possible settings and make sure we're doing the right
 *  thing for the state of each setting.
 */
- (void)_synchronizeAllSettings
{
  [self _hotLoadingSettingDidChange];
  [self _liveReloadSettingDidChange];
  [self _remoteDebugSettingDidChange];
  [self _profilingSettingDidChange];
}

- (void)_pollForLiveReload
{
  if (!_isJSLoaded || ![[self settingForKey:kRCTDevSettingLiveReloadEnabled] boolValue] || !_liveReloadURL) {
    return;
  }
  
  if (_liveReloadUpdateTask) {
    return;
  }
  
  __weak RCTDevSettings *weakSelf = self;
  _liveReloadUpdateTask = [[NSURLSession sharedSession] dataTaskWithURL:_liveReloadURL completionHandler:
                           ^(__unused NSData *data, NSURLResponse *response, NSError *error) {
                             
                             dispatch_async(dispatch_get_main_queue(), ^{
                               __strong RCTDevSettings *strongSelf = weakSelf;
                               if (strongSelf && [[strongSelf settingForKey:kRCTDevSettingLiveReloadEnabled] boolValue]) {
                                 NSHTTPURLResponse *HTTPResponse = (NSHTTPURLResponse *)response;
                                 if (!error && HTTPResponse.statusCode == 205) {
                                   [strongSelf reload];
                                 } else {
                                   if (error.code != NSURLErrorCancelled) {
                                     strongSelf->_liveReloadUpdateTask = nil;
                                     [strongSelf _pollForLiveReload];
                                   }
                                 }
                               }
                             });
                             
                           }];
  
  [_liveReloadUpdateTask resume];
}

- (void)jsLoaded:(NSNotification *)notification
{
  if (notification.userInfo[@"bridge"] != _bridge) {
    return;
  }
  
  _isJSLoaded = YES;
  
  // Check if live reloading is available
  NSURL *scriptURL = _bridge.bundleURL;
  if (![scriptURL isFileURL]) {
    // Live reloading is disabled when running from bundled JS file
    _liveReloadURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:scriptURL];
  } else {
    _liveReloadURL = nil;
  }
  
  dispatch_async(dispatch_get_main_queue(), ^{
    // update state again after the bridge has finished loading
    [self _synchronizeAllSettings];
  });
}

#pragma mark - RCTWebSocketObserver

- (void)connectPackager
{
  RCTAssertMainQueue();
  
  NSURL *url = [self packagerURL];
  if (!url) {
    return;
  }
  
  Class webSocketObserverClass = objc_lookUpClass("RCTWebSocketObserver");
  if (webSocketObserverClass == Nil) {
    return;
  }
  
  // If multiple RCTDevMenus are created, the most recently connected one steals the RCTWebSocketObserver.
  // (Why this behavior exists is beyond me, as of this writing.)
  static NSMutableDictionary<NSString *, id<RCTWebSocketObserver>> *observers = nil;
  if (observers == nil) {
    observers = [NSMutableDictionary new];
  }
  
  NSString *key = [url absoluteString];
  id<RCTWebSocketObserver> existingObserver = observers[key];
  if (existingObserver) {
    existingObserver.delegate = self;
  } else {
    id<RCTWebSocketObserver> newObserver = [(id<RCTWebSocketObserver>)[webSocketObserverClass alloc] initWithURL:url];
    newObserver.delegate = self;
    [newObserver start];
    observers[key] = newObserver;
  }
}

- (void)didReceiveWebSocketMessage:(NSDictionary<NSString *, id> *)message
{
  if ([self isSupportedWebSocketMessageVersion:message[@"version"]]) {
    [self processWebSocketMethod:message[@"method"] params:message[@"params"]];
  }
}

- (NSURL *)packagerURL
{
  NSString *host = [_bridge.bundleURL host];
  NSString *scheme = [_bridge.bundleURL scheme];
  if (!host) {
    host = @"localhost";
    scheme = @"http";
  }
  
  NSNumber *port = [_bridge.bundleURL port];
  if (!port) {
    port = @8081; // Packager default port
  }
  return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@:%@/message?role=ios-rn-rctdevsettings", scheme, host, port]];
}

- (BOOL)isSupportedWebSocketMessageVersion:(NSNumber *)version
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @2 ];
  return [kSupportedVersions containsObject:version];
}

- (void)processWebSocketMethod:(NSString *)method params:(NSDictionary<NSString *, id> *)params
{
  if ([method isEqualToString:@"reload"]) {
    if (![params isEqual:[NSNull null]] && [params[@"debug"] boolValue]) {
      _bridge.executorClass = objc_lookUpClass("RCTWebSocketExecutor");
    }
    [_bridge reload];
  }
}

@end

#else // #if RCT_DEV

@implementation RCTDevSettings

- (instancetype)initWithDataSource:(id<RCTDevSettingsDataSource>)dataSource { return [super init]; }
- (BOOL)isHotLoadingAvailable { return NO; }
- (BOOL)isLiveReloadAvailable { return NO; }
- (BOOL)isRemoteDebuggingAvailable { return NO; }
- (id)settingForKey:(NSString *)key { return nil; }
- (void)reload {}
- (void)toggleElementInspector {}

@end

#endif

@implementation RCTBridge (RCTDevSettings)

- (RCTDevSettings *)devSettings
{
#if RCT_DEV
  return [self moduleForClass:[RCTDevSettings class]];
#else
  return nil;
#endif
}

@end
