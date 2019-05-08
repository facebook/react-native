/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import "AppDelegate.h"

#import <React/JSCExecutorFactory.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTJavaScriptLoader.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>

#import <cxxreact/JSExecutor.h>

#if !TARGET_OS_TV
#import <React/RCTPushNotificationManager.h>
#endif

#ifdef RN_FABRIC_ENABLED
#import <React/RCTSurfacePresenter.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#endif

#ifdef RN_TURBO_MODULE_ENABLED
#import <jsireact/RCTTurboModuleManager.h>

#import "RNTesterTurboModuleProvider.h"
#endif

#ifdef RN_TURBO_MODULE_ENABLED
@interface AppDelegate() <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate>{
#else
@interface AppDelegate() <RCTCxxBridgeDelegate>{
#endif

#ifdef RN_FABRIC_ENABLED
  RCTSurfacePresenter *_surfacePresenter;
#endif

#ifdef RN_TURBO_MODULE_ENABLED
  RCTTurboModuleManager *_turboModuleManager;
#endif

}
@end

#ifdef RN_FABRIC_ENABLED
// FIXME: remove when resolved https://github.com/facebook/react-native/issues/23910
@interface RCTSurfacePresenter ()
-(void)_startAllSurfaces;
@end
#endif

@implementation AppDelegate

- (BOOL)application:(__unused UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef RN_TURBO_MODULE_ENABLED
  RCTEnableTurboModule(YES);
#endif

  _bridge = [[RCTBridge alloc] initWithDelegate:self
                                  launchOptions:launchOptions];

  // Appetizer.io params check
  NSDictionary *initProps = @{};
  NSString *_routeUri = [[NSUserDefaults standardUserDefaults] stringForKey:@"route"];
  if (_routeUri) {
    initProps = @{@"exampleFromAppetizeParams": [NSString stringWithFormat:@"rntester://example/%@Example", _routeUri]};
  }

#ifdef RN_FABRIC_ENABLED
  // FIXME: remove when resolved https://github.com/facebook/react-native/issues/23910
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:_bridge];

  _surfacePresenter = [[RCTSurfacePresenter alloc] initWithBridge:_bridge config:nil];
  _bridge.surfacePresenter = _surfacePresenter;

  UIView *rootView = [[RCTFabricSurfaceHostingProxyRootView alloc] initWithBridge:_bridge moduleName:@"RNTesterApp" initialProperties:initProps];
#else
  UIView *rootView = [[RCTRootView alloc] initWithBridge:_bridge moduleName:@"RNTesterApp" initialProperties:initProps];
#endif

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

#ifdef RN_FABRIC_ENABLED
// FIXME: remove when resolved https://github.com/facebook/react-native/issues/23910
- (void)handleJavaScriptDidLoadNotification:(__unused NSNotification*)notification {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_surfacePresenter _startAllSurfaces];
  });
}
#endif

- (NSURL *)sourceURLForBridge:(__unused RCTBridge *)bridge
{
  NSString *bundlePrefix = @"";
  if (getenv("CI_USE_BUNDLE_PREFIX")) {
    bundlePrefix = @"react-native-github/";
  }
  NSString *bundleRoot = [NSString stringWithFormat:@"%@RNTester/js/RNTesterApp.ios", bundlePrefix];
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:bundleRoot
                                                        fallbackResource:nil];
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:app openURL:url options:options];
}

- (void)loadSourceForBridge:(RCTBridge *)bridge
                 onProgress:(RCTSourceLoadProgressBlock)onProgress
                 onComplete:(RCTSourceLoadBlock)loadCallback
{
  [RCTJavaScriptLoader loadBundleAtURL:[self sourceURLForBridge:bridge]
                            onProgress:onProgress
                            onComplete:loadCallback];
}

# pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  __weak __typeof(self) weakSelf = self;
  return std::make_unique<facebook::react::JSCExecutorFactory>([weakSelf, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
#ifdef RN_TURBO_MODULE_ENABLED
      strongSelf->_turboModuleManager = [[RCTTurboModuleManager alloc] initWithRuntime:&runtime bridge:bridge delegate:strongSelf];
      [strongSelf->_turboModuleManager installJSBinding];
#endif
    }
  });
}

#pragma mark RCTTurboModuleManagerDelegate

#ifdef RN_TURBO_MODULE_ENABLED

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return RNTesterTurboModuleProvider(name, jsInvoker);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                       instance:(id<RCTTurboModule>)instance
                                                      jsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return RNTesterTurboModuleProvider(name, instance, jsInvoker);
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  // No custom initializer here.
  return [moduleClass new];
}

#endif

# pragma mark - Push Notifications

#if !TARGET_OS_TV

// Required to register for notifications
- (void)application:(__unused UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
}

// Required for the remoteNotificationsRegistered event.
- (void)application:(__unused UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Required for the remoteNotificationRegistrationError event.
- (void)application:(__unused UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];
}

// Required for the remoteNotificationReceived event.
- (void)application:(__unused UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  [RCTPushNotificationManager didReceiveRemoteNotification:notification];
}

// Required for the localNotificationReceived event.
- (void)application:(__unused UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  [RCTPushNotificationManager didReceiveLocalNotification:notification];
}

#endif

@end
