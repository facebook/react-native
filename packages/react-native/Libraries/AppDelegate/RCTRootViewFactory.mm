/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootViewFactory.h"
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import "RCTAppDelegate.h"
#import "RCTAppSetupUtils.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif
#import <React/RCTBundleURLProvider.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#if USE_HERMES
#import <ReactCommon/RCTHermesInstance.h>
#else
#import <ReactCommon/RCTJscInstance.h>
#endif
#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/runtime/JSRuntimeFactory.h>

@implementation RCTRootViewFactoryConfiguration

- (instancetype)initWithBundleURL:(NSURL *)bundleURL newArchEnabled:(BOOL)newArchEnabled
{
  return [self initWithBundleURL:bundleURL
                  newArchEnabled:newArchEnabled
              turboModuleEnabled:newArchEnabled
               bridgelessEnabled:newArchEnabled];
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock newArchEnabled:(BOOL)newArchEnabled
{
  return [self initWithBundleURLBlock:bundleURLBlock
                       newArchEnabled:newArchEnabled
                   turboModuleEnabled:newArchEnabled
                    bridgelessEnabled:newArchEnabled];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   newArchEnabled:(BOOL)newArchEnabled
               turboModuleEnabled:(BOOL)turboModuleEnabled
                bridgelessEnabled:(BOOL)bridgelessEnabled
{
  return [self
      initWithBundleURLBlock:^{
        return bundleURL;
      }
              newArchEnabled:newArchEnabled
          turboModuleEnabled:turboModuleEnabled
           bridgelessEnabled:bridgelessEnabled];
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
                        newArchEnabled:(BOOL)newArchEnabled
                    turboModuleEnabled:(BOOL)turboModuleEnabled
                     bridgelessEnabled:(BOOL)bridgelessEnabled
{
  if (self = [super init]) {
    _bundleURLBlock = bundleURLBlock;
    _fabricEnabled = newArchEnabled;
    _turboModuleEnabled = turboModuleEnabled;
    _bridgelessEnabled = bridgelessEnabled;
  }
  return self;
}

@end

@interface RCTRootViewFactory () <RCTCxxBridgeDelegate> {
  facebook::react::ContextContainer::Shared _contextContainer;
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
}
@end

@implementation RCTRootViewFactory {
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
  __weak id<RCTHostDelegate> _hostDelegate;
  RCTRootViewFactoryConfiguration *_configuration;
}

- (instancetype)initWithTurboModuleDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                               hostDelegate:(id<RCTHostDelegate>)hostdelegate
                              configuration:(RCTRootViewFactoryConfiguration *)configuration
{
  if (self = [super init]) {
    _configuration = configuration;
    _hostDelegate = hostdelegate;
    _contextContainer = std::make_shared<const facebook::react::ContextContainer>();
    _turboModuleManagerDelegate = turboModuleManagerDelegate;
  }
  return self;
}

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration
        andTurboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  id<RCTHostDelegate> hostDelegate = [turboModuleManagerDelegate conformsToProtocol:@protocol(RCTHostDelegate)]
      ? (id<RCTHostDelegate>)turboModuleManagerDelegate
      : nil;
  return [self initWithTurboModuleDelegate:turboModuleManagerDelegate
                              hostDelegate:hostDelegate
                             configuration:configuration];
}

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration
{
  return [self initWithConfiguration:configuration andTurboModuleManagerDelegate:nil];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties
{
  return [self viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:nil];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
{
  return [self viewWithModuleName:moduleName initialProperties:nil launchOptions:nil];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initProps
                 launchOptions:(NSDictionary *)launchOptions
{
  if (_configuration.bridgelessEnabled) {
    // Enable TurboModule interop by default in Bridgeless mode
    RCTEnableTurboModuleInterop(YES);
    RCTEnableTurboModuleInteropBridgeProxy(YES);

    [self createReactHostIfNeeded:launchOptions];

    RCTFabricSurface *surface = [self.reactHost createSurfaceWithModuleName:moduleName initialProperties:initProps];

    RCTSurfaceHostingProxyRootView *surfaceHostingProxyRootView =
        [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];

    surfaceHostingProxyRootView.backgroundColor = [UIColor systemBackgroundColor];
    if (_configuration.customizeRootView != nil) {
      _configuration.customizeRootView(surfaceHostingProxyRootView);
    }
    return surfaceHostingProxyRootView;
  }

  [self createBridgeIfNeeded:launchOptions];
  [self createBridgeAdapterIfNeeded];

  UIView *rootView;
  if (_configuration.createRootViewWithBridge != nil) {
    rootView = _configuration.createRootViewWithBridge(self.bridge, moduleName, initProps);
  } else {
    rootView = [self createRootViewWithBridge:self.bridge moduleName:moduleName initProps:initProps];
  }
  if (_configuration.customizeRootView != nil) {
    _configuration.customizeRootView(rootView);
  }
  return rootView;
}

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  BOOL enableFabric = _configuration.fabricEnabled;
  UIView *rootView = RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);
  rootView.backgroundColor = [UIColor systemBackgroundColor];
  return rootView;
}

#pragma mark - RCTCxxBridgeDelegate
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _runtimeScheduler = std::make_shared<facebook::react::RuntimeScheduler>(RCTRuntimeExecutorFromBridge(bridge));
  if (RCTIsNewArchEnabled()) {
    std::shared_ptr<facebook::react::CallInvoker> callInvoker =
        std::make_shared<facebook::react::RuntimeSchedulerCallInvoker>(_runtimeScheduler);
    RCTTurboModuleManager *turboModuleManager =
        [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                             delegate:_turboModuleManagerDelegate
                                            jsInvoker:callInvoker];
    _contextContainer->erase("RuntimeScheduler");
    _contextContainer->insert("RuntimeScheduler", _runtimeScheduler);
    return RCTAppSetupDefaultJsExecutorFactory(bridge, turboModuleManager, _runtimeScheduler);
  } else {
    return RCTAppSetupJsExecutorFactoryForOldArch(bridge, _runtimeScheduler);
  }
}

- (void)createBridgeIfNeeded:(NSDictionary *)launchOptions
{
  if (self.bridge != nil) {
    return;
  }

  if (self->_configuration.createBridgeWithDelegate != nil) {
    self.bridge = self->_configuration.createBridgeWithDelegate(self, launchOptions);
  } else {
    self.bridge = [self createBridgeWithDelegate:self launchOptions:launchOptions];
  }
}

- (void)createBridgeAdapterIfNeeded
{
  if (!self->_configuration.fabricEnabled || self.bridgeAdapter) {
    return;
  }

  self.bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:self.bridge
                                                               contextContainer:_contextContainer];
  self.bridge.surfacePresenter = self.bridgeAdapter.surfacePresenter;
}

#pragma mark - New Arch Utilities

- (void)createReactHostIfNeeded:(NSDictionary *)launchOptions
{
  if (self.reactHost) {
    return;
  }
  self.reactHost = [self createReactHost:launchOptions];
}

- (RCTHost *)createReactHost:(NSDictionary *)launchOptions
{
  __weak __typeof(self) weakSelf = self;
  RCTHost *reactHost =
      [[RCTHost alloc] initWithBundleURLProvider:self->_configuration.bundleURLBlock
                                    hostDelegate:_hostDelegate
                      turboModuleManagerDelegate:_turboModuleManagerDelegate
                                jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                  return [weakSelf createJSRuntimeFactory];
                                }
                                   launchOptions:launchOptions];
  [reactHost setBundleURLProvider:^NSURL *() {
    return [weakSelf bundleURL];
  }];
  [reactHost start];
  return reactHost;
}

- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory
{
#if USE_HERMES
  return std::make_shared<facebook::react::RCTHermesInstance>(nullptr, /* allocInOldGenBeforeTTI */ false);
#else
  return std::make_shared<facebook::react::RCTJscInstance>();
#endif
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  if (_configuration.extraModulesForBridge != nil) {
    return _configuration.extraModulesForBridge(bridge);
  }
  return nil;
}

- (NSDictionary<NSString *, Class> *)extraLazyModuleClassesForBridge:(RCTBridge *)bridge
{
  if (_configuration.extraLazyModuleClassesForBridge != nil) {
    return _configuration.extraLazyModuleClassesForBridge(bridge);
  }
  return nil;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  if (_configuration.sourceURLForBridge != nil) {
    return _configuration.sourceURLForBridge(bridge);
  }
  return [self bundleURL];
}

- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName
{
  if (_configuration.bridgeDidNotFindModule != nil) {
    return _configuration.bridgeDidNotFindModule(bridge, moduleName);
  }
  return NO;
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  if (_configuration.loadSourceForBridge != nil) {
    _configuration.loadSourceForBridge(bridge, loadCallback);
  }
}

- (void)loadSourceForBridge:(RCTBridge *)bridge
                 onProgress:(RCTSourceLoadProgressBlock)onProgress
                 onComplete:(RCTSourceLoadBlock)loadCallback
{
  if (_configuration.loadSourceForBridgeWithProgress != nil) {
    _configuration.loadSourceForBridgeWithProgress(bridge, onProgress, loadCallback);
  }
}

- (NSURL *)bundleURL
{
  return self->_configuration.bundleURLBlock();
}

@end
