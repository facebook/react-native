/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import "AppDelegate.h"

#import <React/JSCExecutorFactory.h>
#import <React/RCTAsyncLocalStorage.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTJavaScriptLoader.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>

#import <cxxreact/JSExecutor.h>

#if !TARGET_OS_TV && !TARGET_OS_UIKITFORMAC
#import <React/RCTPushNotificationManager.h>
#endif

#ifdef RN_FABRIC_ENABLED
#import <React/RCTSurfacePresenter.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#endif

#import <ReactCommon/RCTTurboModuleManager.h>

#import "RNTesterTurboModuleProvider.h"

@interface AppDelegate() <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate>{

#ifdef RN_FABRIC_ENABLED
  RCTSurfacePresenter *_surfacePresenter;
#endif

  RCTTurboModuleManager *_turboModuleManager;
}
@end

@implementation AppDelegate

- (BOOL)application:(__unused UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTEnableTurboModule(YES);

  _bridge = [[RCTBridge alloc] initWithDelegate:self
                                  launchOptions:launchOptions];

  // Appetizer.io params check
  NSDictionary *initProps = @{};
  NSString *_routeUri = [[NSUserDefaults standardUserDefaults] stringForKey:@"route"];
  if (_routeUri) {
    initProps = @{@"exampleFromAppetizeParams": [NSString stringWithFormat:@"rntester://example/%@Example", _routeUri]};
  }

#ifdef RN_FABRIC_ENABLED
  _surfacePresenter = [[RCTSurfacePresenter alloc] initWithBridge:_bridge
                                                           config:nil
                                                      imageLoader:RCTTurboModuleEnabled() ?
                                                                  [_bridge moduleForName:@"RCTImageLoader"
                                                                  lazilyLoadIfNecessary:YES] : nil
                                                  runtimeExecutor:nullptr];

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

- (NSURL *)sourceURLForBridge:(__unused RCTBridge *)bridge
{
  NSString *bundlePrefix = [[[NSBundle mainBundle] infoDictionary] valueForKey:@"RN_BUNDLE_PREFIX"];
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
      strongSelf->_turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge delegate:strongSelf];
      [strongSelf->_turboModuleManager installJSBindingWithRuntime:&runtime];
    }
  });
}

#pragma mark RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return facebook::react::RNTesterTurboModuleClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return facebook::react::RNTesterTurboModuleProvider(name, jsInvoker);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                       instance:(id<RCTTurboModule>)instance
                                                      jsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return facebook::react::RNTesterTurboModuleProvider(name, instance, jsInvoker);
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  // No custom initializer here.
  return [moduleClass new];
}

# pragma mark - Push Notifications

#if !TARGET_OS_TV && !TARGET_OS_UIKITFORMAC

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

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(__unused RCTBridge *)bridge
{
  NSString *documentDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  NSString *storageDirectory = [documentDirectory stringByAppendingPathComponent:@"RCTAsyncLocalStorage_V1"];
  return @[[[RCTAsyncLocalStorage alloc] initWithStorageDirectory:storageDirectory]];
}

@end
