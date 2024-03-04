/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppDelegate.h"
#import <React/RCTColorSpaceUtils.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <react/renderer/graphics/ColorComponents.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import "RCTAppDelegate+Protected.h"
#import "RCTAppSetupUtils.h"

#ifndef RN_DISABLE_OSS_PLUGIN_HEADER
#import <ReactCodegen/RCTFabricComponentsProvider.h>
#endif

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
#import <react/nativemodule/featureflags/NativeReactNativeFeatureFlags.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/runtime/JSRuntimeFactory.h>

@interface RCTAppDelegate () <RCTComponentViewFactoryComponentProvider, RCTContextContainerHandling> {
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end

static NSDictionary *updateInitialProps(NSDictionary *initialProps, BOOL isFabricEnabled)
{
  NSMutableDictionary *mutableProps = [initialProps mutableCopy] ?: [NSMutableDictionary new];
  return mutableProps;
}

@interface RCTAppDelegate () <RCTCxxBridgeDelegate> {
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
}
@end

@implementation RCTAppDelegate {
  RCTHost *_reactHost;
}

- (instancetype)init
{
  if (self = [super init]) {
    _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
    _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
    _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  }
  return self;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTSetNewArchEnabled([self newArchEnabled]);
  [RCTColorSpaceUtils applyDefaultColorSpace:self.defaultColorSpace];
  BOOL enableTM = self.turboModuleEnabled;
  BOOL fabricEnabled = self.fabricEnabled;
  BOOL enableBridgeless = self.bridgelessEnabled;

  NSDictionary *initProps = updateInitialProps([self prepareInitialProps], fabricEnabled);

  RCTAppSetupPrepareApp(application, enableTM);

  UIView *rootView;
  if (enableBridgeless) {
    // Enable native view config interop only if both bridgeless mode and Fabric is enabled.
    RCTSetUseNativeViewConfigsInBridgelessMode(fabricEnabled);

    // Enable TurboModule interop by default in Bridgeless mode
    RCTEnableTurboModuleInterop(YES);
    RCTEnableTurboModuleInteropBridgeProxy(YES);

    [self createReactHost];
    [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = self;
    RCTFabricSurface *surface = [_reactHost createSurfaceWithModuleName:self.moduleName initialProperties:initProps];

    RCTSurfaceHostingProxyRootView *surfaceHostingProxyRootView = [[RCTSurfaceHostingProxyRootView alloc]
        initWithSurface:surface
        sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];

    rootView = (RCTRootView *)surfaceHostingProxyRootView;
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    if (!self.bridge) {
      self.bridge = [self createBridgeWithDelegate:self launchOptions:launchOptions];
    }
    if ([self newArchEnabled]) {
      self.bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:self.bridge
                                                                   contextContainer:_contextContainer];
      self.bridge.surfacePresenter = self.bridgeAdapter.surfacePresenter;

      [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = self;
    }
    rootView = [self createRootViewWithBridge:self.bridge moduleName:self.moduleName initProps:initProps];
  }
  [self _logWarnIfCreateRootViewWithBridgeIsOverridden];
  [self customizeRootView:(RCTRootView *)rootView];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [self createRootViewController];
  [self setRootView:rootView toRootViewController:rootViewController];
  self.window.rootViewController = rootViewController;
  self.window.windowScene.delegate = self;
  [self.window makeKeyAndVisible];

  return YES;
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  // Noop
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  [NSException raise:@"RCTBridgeDelegate::sourceURLForBridge not implemented"
              format:@"Subclasses must implement a valid sourceURLForBridge method"];
  return nil;
}

- (NSDictionary *)prepareInitialProps
{
  return self.initialProps;
}

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (void)customizeRootView:(RCTRootView *)rootView
{
  // Override point for customization after application launch.
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  BOOL enableFabric = self.fabricEnabled;
  UIView *rootView = RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);

  rootView.backgroundColor = [UIColor systemBackgroundColor];

  return rootView;
}

// TODO T173939093 - Remove _logWarnIfCreateRootViewWithBridgeIsOverridden after 0.74 is cut
- (void)_logWarnIfCreateRootViewWithBridgeIsOverridden
{
  SEL selector = @selector(createRootViewWithBridge:moduleName:initProps:);
  IMP baseClassImp = method_getImplementation(class_getInstanceMethod([RCTAppDelegate class], selector));
  IMP currentClassImp = method_getImplementation(class_getInstanceMethod([self class], selector));
  if (currentClassImp != baseClassImp) {
    NSString *warnMessage =
        @"If you are using the `createRootViewWithBridge` to customize the root view appearence,"
         "for example to set the backgroundColor, please migrate to `customiseView` method.\n"
         "The `createRootViewWithBridge` method is not invoked in bridgeless.";
    RCTLogWarn(@"%@", warnMessage);
  }
}

- (UIViewController *)createRootViewController
{
  return [UIViewController new];
}

- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController
{
  rootViewController.view = rootView;
}

- (BOOL)runtimeSchedulerEnabled
{
  return YES;
}

#pragma mark - UISceneDelegate

- (void)windowScene:(UIWindowScene *)windowScene
    didUpdateCoordinateSpace:(id<UICoordinateSpace>)previousCoordinateSpace
        interfaceOrientation:(UIInterfaceOrientation)previousInterfaceOrientation
             traitCollection:(UITraitCollection *)previousTraitCollection API_AVAILABLE(ios(13.0))
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:self];
}

#pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _runtimeScheduler = std::make_shared<facebook::react::RuntimeScheduler>(RCTRuntimeExecutorFromBridge(bridge));
  if ([self newArchEnabled]) {
    std::shared_ptr<facebook::react::CallInvoker> callInvoker =
        std::make_shared<facebook::react::RuntimeSchedulerCallInvoker>(_runtimeScheduler);
    RCTTurboModuleManager *turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                                                     delegate:self
                                                                                    jsInvoker:callInvoker];
    _contextContainer->erase("RuntimeScheduler");
    _contextContainer->insert("RuntimeScheduler", _runtimeScheduler);
    return RCTAppSetupDefaultJsExecutorFactory(bridge, turboModuleManager, _runtimeScheduler);
  } else {
    return RCTAppSetupJsExecutorFactoryForOldArch(bridge, _runtimeScheduler);
  }
}

- (RCTColorSpace)defaultColorSpace
{
  return RCTColorSpaceSRGB;
}

#pragma mark - New Arch Enabled settings

- (BOOL)newArchEnabled
{
#if RCT_NEW_ARCH_ENABLED
  return YES;
#else
  return NO;
#endif
}

- (BOOL)turboModuleEnabled
{
  return [self newArchEnabled];
}

- (BOOL)fabricEnabled
{
  return [self newArchEnabled];
}

- (BOOL)bridgelessEnabled
{
  return [self newArchEnabled];
}

#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
#ifndef RN_DISABLE_OSS_PLUGIN_HEADER
  return [RCTFabricComponentsProvider fabricComponents];
#else
  return @{};
#endif
}

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
#if RN_DISABLE_OSS_PLUGIN_HEADER
  return RCTTurboModulePluginClassProvider(name);
#else
  return RCTCoreModulesClassProvider(name);
#endif
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (name == facebook::react::NativeReactNativeFeatureFlags::kModuleName) {
    return std::make_shared<facebook::react::NativeReactNativeFeatureFlags>(jsInvoker);
  }

  return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#pragma mark - New Arch Utilities

- (void)createReactHost
{
  __weak __typeof(self) weakSelf = self;
  _reactHost = [[RCTHost alloc] initWithBundleURL:[self bundleURL]
                                     hostDelegate:nil
                       turboModuleManagerDelegate:self
                                 jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                   return [weakSelf createJSRuntimeFactory];
                                 }];
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

- (NSURL *)bundleURL
{
  [NSException raise:@"RCTAppDelegate::bundleURL not implemented"
              format:@"Subclasses must implement a valid getBundleURL method"];
  return nullptr;
}

@end
