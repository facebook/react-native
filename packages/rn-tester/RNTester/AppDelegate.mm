/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTLocalAssetImageLoader.h>
#import <React/RCTNetworking.h>
#import <React/RCTRootView.h>
#import <ReactCommon/RCTSampleTurboModule.h>
#import <ReactCommon/SampleTurboCxxModule.h>

#import <cxxreact/JSExecutor.h>

#if !TARGET_OS_TV && !TARGET_OS_UIKITFORMAC
#import <React/RCTPushNotificationManager.h>
#endif

#ifdef RN_FABRIC_ENABLED
#import <React/RCTComponentViewFactory.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>

#import <React/RCTLegacyViewManagerInteropComponentView.h>
#import <react/config/ReactNativeConfig.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#endif

#if RCT_NEW_ARCH_ENABLED
#import <NativeCxxModuleExample/NativeCxxModuleExample.h>
#import <RNTMyNativeViewComponentView.h>
#endif

#if DEBUG
#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitLayoutPlugin/SKDescriptorMapper.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#endif
#endif

#import <ReactCommon/RCTTurboModuleManager.h>
#import "RNTesterTurboModuleProvider.h"

@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
#ifdef RN_FABRIC_ENABLED
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
#endif
}
@end

#if RCT_NEW_ARCH_ENABLED
/// Declare conformance to `RCTComponentViewFactoryComponentProvider`
@interface AppDelegate () <RCTComponentViewFactoryComponentProvider>
@end
#endif

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"RNTesterApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = [self prepareInitialProps];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = [NSMutableDictionary new];

  NSString *_routeUri = [[NSUserDefaults standardUserDefaults] stringForKey:@"route"];
  if (_routeUri) {
    initProps[@"exampleFromAppetizeParams"] = [NSString stringWithFormat:@"rntester://example/%@Example", _routeUri];
  }

  return initProps;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"js/RNTesterApp.ios"];
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  return [RCTLinkingManager application:app openURL:url options:options];
}

- (void)loadSourceForBridge:(RCTBridge *)bridge
                 onProgress:(RCTSourceLoadProgressBlock)onProgress
                 onComplete:(RCTSourceLoadBlock)loadCallback
{
  [RCTJavaScriptLoader loadBundleAtURL:[self sourceURLForBridge:bridge] onProgress:onProgress onComplete:loadCallback];
}

#pragma mark - RCTCxxBridgeDelegate

// This function is called during
// `[[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];`
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  std::shared_ptr<facebook::react::CallInvoker> callInvoker = bridge.jsCallInvoker;

#ifdef RN_FABRIC_ENABLED
  _runtimeScheduler = std::make_shared<facebook::react::RuntimeScheduler>(RCTRuntimeExecutorFromBridge(bridge));
  _contextContainer->erase("RuntimeScheduler");
  _contextContainer->insert("RuntimeScheduler", _runtimeScheduler);
  callInvoker = std::make_shared<facebook::react::RuntimeSchedulerCallInvoker>(_runtimeScheduler);
#endif

  RCTTurboModuleManager *turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                                                   delegate:self
                                                                                  jsInvoker:callInvoker];
  [bridge setRCTTurboModuleRegistry:turboModuleManager];

#if RCT_DEV
  /**
   * Eagerly initialize RCTDevMenu so CMD + d, CMD + i, and CMD + r work.
   * This is a stop gap until we have a system to eagerly init Turbo Modules.
   */
  [turboModuleManager moduleForName:"RCTDevMenu"];
#endif

  __weak __typeof(self) weakSelf = self;

#if RCT_USE_HERMES
  return std::make_unique<facebook::react::HermesExecutorFactory>(
#else
  return std::make_unique<facebook::react::JSCExecutorFactory>(
#endif
      facebook::react::RCTJSIExecutorRuntimeInstaller([weakSelf, bridge, turboModuleManager](
                                                          facebook::jsi::Runtime &runtime) {
        if (!bridge) {
          return;
        }

#if RN_FABRIC_ENABLED
        __typeof(self) strongSelf = weakSelf;
        if (strongSelf && strongSelf->_runtimeScheduler) {
          facebook::react::RuntimeSchedulerBinding::createAndInstallIfNeeded(runtime, strongSelf->_runtimeScheduler);
        }
#endif

        facebook::react::RuntimeExecutor syncRuntimeExecutor =
            [&](std::function<void(facebook::jsi::Runtime & runtime_)> &&callback) { callback(runtime); };
        [turboModuleManager installJSBindingWithRuntimeExecutor:syncRuntimeExecutor];
      }));
}

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return facebook::react::RNTesterTurboModuleClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (name == std::string([@"SampleTurboCxxModule" UTF8String])) {
    return std::make_shared<facebook::react::SampleTurboCxxModule>(jsInvoker);
  }
#ifdef RCT_NEW_ARCH_ENABLED
  if (name == std::string([@"NativeCxxModuleExampleCxx" UTF8String])) {
    return std::make_shared<facebook::react::NativeCxxModuleExample>(jsInvoker);
  }
#endif
  return nullptr;
}

#if !TARGET_OS_TV && !TARGET_OS_UIKITFORMAC

// Required to register for notifications
- (void)application:(__unused UIApplication *)application
    didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
}

// Required for the remoteNotificationsRegistered event.
- (void)application:(__unused UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Required for the remoteNotificationRegistrationError event.
- (void)application:(__unused UIApplication *)application
    didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];
}

// Required for the remoteNotificationReceived event.
- (void)application:(__unused UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  [RCTPushNotificationManager didReceiveRemoteNotification:notification];
}

// Required for the localNotificationReceived event.
- (void)application:(__unused UIApplication *)application
    didReceiveLocalNotification:(UILocalNotification *)notification
{
  [RCTPushNotificationManager didReceiveLocalNotification:notification];
}

#endif

#pragma mark - RCTComponentViewFactoryComponentProvider

#if RCT_NEW_ARCH_ENABLED
- (nonnull NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  return @{@"RNTMyNativeView" : RNTMyNativeViewComponentView.class};
}
#endif

@end
