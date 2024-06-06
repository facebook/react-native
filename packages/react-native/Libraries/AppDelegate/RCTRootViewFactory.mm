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
#import <ReactCommon/RCTContextContainerHandling.h>
#if USE_HERMES
#import <ReactCommon/RCTHermesInstance.h>
#else
#import <ReactCommon/RCTJscInstance.h>
#endif
#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/config/ReactNativeConfig.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/runtime/JSRuntimeFactory.h>

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

static NSDictionary *updateInitialProps(NSDictionary *initialProps, BOOL isFabricEnabled)
{
  NSMutableDictionary *mutableProps = initialProps != NULL ? [initialProps mutableCopy] : [NSMutableDictionary new];
  // Hardcoding the Concurrent Root as it it not recommended to
  // have the concurrentRoot turned off when Fabric is enabled.
  mutableProps[kRNConcurrentRoot] = @(isFabricEnabled);
  return mutableProps;
}

@implementation RCTRootViewFactoryConfiguration

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

@interface RCTRootViewFactory () <RCTContextContainerHandling> {
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end

@interface RCTRootViewFactory () <RCTCxxBridgeDelegate> {
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
}
@end

@implementation RCTRootViewFactory {
  RCTHost *_reactHost;
  RCTRootViewFactoryConfiguration *_configuration;
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
}

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration
        andTurboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  if (self = [super init]) {
    _configuration = configuration;
    _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
    _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
    _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
    _turboModuleManagerDelegate = turboModuleManagerDelegate;
  }
  return self;
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
             initialProperties:(NSDictionary *)initialProperties
                 launchOptions:(NSDictionary *)launchOptions
{
  NSDictionary *initProps = updateInitialProps(initialProperties, self->_configuration.fabricEnabled);

  if (self->_configuration.bridgelessEnabled) {
    // Enable native view config interop only if both bridgeless mode and Fabric is enabled.
    RCTSetUseNativeViewConfigsInBridgelessMode(self->_configuration.fabricEnabled);

    // Enable TurboModule interop by default in Bridgeless mode
    RCTEnableTurboModuleInterop(YES);
    RCTEnableTurboModuleInteropBridgeProxy(YES);

    [self createReactHostIfNeeded:launchOptions];

    RCTFabricSurface *surface = [_reactHost createSurfaceWithModuleName:moduleName initialProperties:initProps];

    RCTSurfaceHostingProxyRootView *surfaceHostingProxyRootView = [[RCTSurfaceHostingProxyRootView alloc]
        initWithSurface:surface
        sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];

    if (self->_configuration.customizeRootView != nil) {
      self->_configuration.customizeRootView(surfaceHostingProxyRootView);
    }
    return surfaceHostingProxyRootView;
  }

  [self createBridgeIfNeeded:launchOptions];
  [self createBridgeAdapterIfNeeded];

  UIView *rootView;
  if (self->_configuration.createRootViewWithBridge != nil) {
    rootView = self->_configuration.createRootViewWithBridge(self.bridge, moduleName, initProps);
  } else {
    rootView = [self createRootViewWithBridge:self.bridge moduleName:moduleName initProps:initProps];
  }
  if (self->_configuration.customizeRootView != nil) {
    self->_configuration.customizeRootView(rootView);
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
  BOOL enableFabric = self->_configuration.fabricEnabled;
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
  if (_reactHost) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
  _reactHost = [[RCTHost alloc] initWithBundleURLProvider:self->_configuration.bundleURLBlock
                                             hostDelegate:nil
                               turboModuleManagerDelegate:_turboModuleManagerDelegate
                                         jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                           return [weakSelf createJSRuntimeFactory];
                                         }
                                            launchOptions:launchOptions];
  [_reactHost setBundleURLProvider:^NSURL *() {
    return [weakSelf bundleURL];
  }];
  [_reactHost setContextContainerHandler:self];
  [_reactHost start];
}

- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory
{
#if USE_HERMES
  return std::make_shared<facebook::react::RCTHermesInstance>(_reactNativeConfig, nullptr);
#else
  return std::make_shared<facebook::react::RCTJscInstance>();
#endif
}

- (void)didCreateContextContainer:(std::shared_ptr<facebook::react::ContextContainer>)contextContainer
{
  contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
  return self->_configuration.bundleURLBlock();
}

@end
