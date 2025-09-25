/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootViewFactory.h"
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTDevMenu.h>
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
#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/runtime/JSRuntimeFactory.h>
#import <react/runtime/JSRuntimeFactoryCAPI.h>

@implementation RCTRootViewFactoryConfiguration

- (instancetype)initWithBundleURL:(NSURL *)bundleURL newArchEnabled:(BOOL)newArchEnabled
{
  return [self initWithBundleURL:bundleURL];
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock newArchEnabled:(BOOL)newArchEnabled
{
  return [self initWithBundleURLBlock:bundleURLBlock];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   newArchEnabled:(BOOL)newArchEnabled
               turboModuleEnabled:(BOOL)turboModuleEnabled
                bridgelessEnabled:(BOOL)bridgelessEnabled
{
  return [self initWithBundleURLBlock:^{
    return bundleURL;
  }];
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
                        newArchEnabled:(BOOL)newArchEnabled
                    turboModuleEnabled:(BOOL)turboModuleEnabled
                     bridgelessEnabled:(BOOL)bridgelessEnabled
{
  if (self = [super init]) {
    _bundleURLBlock = bundleURLBlock;
    _fabricEnabled = YES;
    _turboModuleEnabled = YES;
    _bridgelessEnabled = YES;
  }
  return self;
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
{
  if (self = [super init]) {
    _bundleURLBlock = bundleURLBlock;
    _fabricEnabled = YES;
    _turboModuleEnabled = YES;
    _bridgelessEnabled = YES;
  }
  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
{
  return [self initWithBundleURLBlock:^{
    return bundleURL;
  }];
}

@end

@interface RCTRootViewFactory () <RCTCxxBridgeDelegate> {
  std::shared_ptr<const facebook::react::ContextContainer> _contextContainer;
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
  return [self viewWithModuleName:moduleName
                initialProperties:initialProperties
                    launchOptions:nil
             devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
{
  return [self viewWithModuleName:moduleName
                initialProperties:nil
                    launchOptions:nil
             devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (void)initializeReactHostWithLaunchOptions:(NSDictionary *)launchOptions
                        devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  // Enable TurboModule interop by default in Bridgeless mode
  RCTEnableTurboModuleInterop(YES);
  RCTEnableTurboModuleInteropBridgeProxy(YES);

  [self createReactHostIfNeeded:launchOptions devMenuConfiguration:devMenuConfiguration];
  return;
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
                 launchOptions:(NSDictionary *)launchOptions
{
  return [self viewWithModuleName:moduleName
                initialProperties:initialProperties
                    launchOptions:launchOptions
             devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initProps
                 launchOptions:(NSDictionary *)launchOptions
          devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  [self initializeReactHostWithLaunchOptions:launchOptions devMenuConfiguration:devMenuConfiguration];

  RCTFabricSurface *surface = [self.reactHost createSurfaceWithModuleName:moduleName
                                                        initialProperties:initProps ? initProps : @{}];

  RCTSurfaceHostingProxyRootView *surfaceHostingProxyRootView =
      [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];

  surfaceHostingProxyRootView.backgroundColor = [UIColor systemBackgroundColor];
  if (_configuration.customizeRootView != nil) {
    _configuration.customizeRootView(surfaceHostingProxyRootView);
  }
  return surfaceHostingProxyRootView;
}

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  UIView *rootView = RCTAppSetupDefaultRootView(bridge, moduleName, initProps, YES);
  rootView.backgroundColor = [UIColor systemBackgroundColor];
  return rootView;
}

#pragma mark - RCTCxxBridgeDelegate
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _runtimeScheduler = std::make_shared<facebook::react::RuntimeScheduler>(RCTRuntimeExecutorFromBridge(bridge));

  std::shared_ptr<facebook::react::CallInvoker> callInvoker =
      std::make_shared<facebook::react::RuntimeSchedulerCallInvoker>(_runtimeScheduler);
  RCTTurboModuleManager *turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                                                   delegate:_turboModuleManagerDelegate
                                                                                  jsInvoker:callInvoker];
  _contextContainer->erase(facebook::react::RuntimeSchedulerKey);
  _contextContainer->insert(facebook::react::RuntimeSchedulerKey, _runtimeScheduler);
  return RCTAppSetupDefaultJsExecutorFactory(bridge, turboModuleManager, _runtimeScheduler);
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
  if (self.bridgeAdapter != nullptr) {
    return;
  }

  self.bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:self.bridge
                                                               contextContainer:_contextContainer];
  self.bridge.surfacePresenter = self.bridgeAdapter.surfacePresenter;
}

#pragma mark - New Arch Utilities

- (void)createReactHostIfNeeded:(NSDictionary *)launchOptions
           devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self.reactHost) {
    return;
  }
  self.reactHost = [self createReactHost:launchOptions devMenuConfiguration:devMenuConfiguration];
}

- (RCTHost *)createReactHost:(NSDictionary *)launchOptions
{
  return [self createReactHost:launchOptions devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (RCTHost *)createReactHost:(NSDictionary *)launchOptions
        devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  __weak __typeof(self) weakSelf = self;
  RCTHost *reactHost =
      [[RCTHost alloc] initWithBundleURLProvider:self->_configuration.bundleURLBlock
                                    hostDelegate:_hostDelegate
                      turboModuleManagerDelegate:_turboModuleManagerDelegate
                                jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                  return [weakSelf createJSRuntimeFactory];
                                }
                                   launchOptions:launchOptions
                            devMenuConfiguration:devMenuConfiguration];
  [reactHost setBundleURLProvider:^NSURL *() {
    return [weakSelf bundleURL];
  }];
  [reactHost start];
  return reactHost;
}

- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory
{
  if (_configuration.jsRuntimeConfiguratorDelegate == nil) {
    [NSException raise:@"RCTReactNativeFactoryDelegate::createJSRuntimeFactory not implemented"
                format:@"Delegate must implement a valid createJSRuntimeFactory method"];
    return nullptr;
  }

  auto jsRuntimeFactory = [_configuration.jsRuntimeConfiguratorDelegate createJSRuntimeFactory];

  return std::shared_ptr<facebook::react::JSRuntimeFactory>(
      reinterpret_cast<facebook::react::JSRuntimeFactory *>(jsRuntimeFactory), &js_runtime_factory_destroy);
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
