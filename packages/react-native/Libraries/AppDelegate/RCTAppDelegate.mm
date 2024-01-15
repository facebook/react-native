/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppDelegate.h"
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
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

@interface RCTAppDelegate () <RCTComponentViewFactoryComponentProvider>
@end

@implementation RCTAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTSetNewArchEnabled([self newArchEnabled]);
  BOOL enableTM = self.turboModuleEnabled;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  RCTAppSetupPrepareApp(application, enableTM);
#pragma clang diagnostic pop
  
  RCTRootViewFactoryConfiguration *configuration = [[RCTRootViewFactoryConfiguration alloc] initWithBundleURL:self.bundleURL];
  configuration.fabricEnabled = self.fabricEnabled;
  configuration.turboModuleEnabled = self.turboModuleEnabled;
  configuration.bridgelessEnabled = self.bridgelessEnabled;
  
  __weak __typeof(self) weakSelf = self;
  configuration.createRootViewWithBridge = ^UIView* (RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps) {
    return [weakSelf createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };
  
  configuration.createBridgeWithDelegate = ^RCTBridge* (id<RCTBridgeDelegate> delegate, NSDictionary* launchOptions) {
    return [weakSelf createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };
  
  self.rootViewFactory = [[RCTRootViewFactory alloc] initWithConfiguration:configuration];
  
  UIView *rootView = [self.rootViewFactory viewWithModuleName:self.moduleName 
                                            initialProperties:self.initialProps
                                                launchOptions:launchOptions];
  
  if (self.newArchEnabled || self.bridgelessEnabled) {
    [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = self;
  }

  [self customizeRootView:(RCTRootView* )rootView];
  
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

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  [self _logWarnIfCreateRootViewWithBridgeIsOverridden];
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

- (void)customizeRootView:(RCTRootView *)rootView
{
  // Override point for customization after application launch.
}

#pragma mark - UISceneDelegate
- (void)windowScene:(UIWindowScene *)windowScene
    didUpdateCoordinateSpace:(id<UICoordinateSpace>)previousCoordinateSpace
        interfaceOrientation:(UIInterfaceOrientation)previousInterfaceOrientation
             traitCollection:(UITraitCollection *)previousTraitCollection API_AVAILABLE(ios(13.0))
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:self];
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

- (NSURL *)bundleURL { 
  [NSException raise:@"RCTAppDelegate::bundleURL not implemented"
                format:@"Subclasses must implement a valid getBundleURL method"];
  return nullptr;

}


#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  return @{};
}

@end
