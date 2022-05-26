//
//  AppDelegate.m
//  RNTester-macOS
//
//  Created by Jeff Cruikshank on 6/5/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "AppDelegate.h"

#import <React/CoreModulesPlugins.h>
#import <React/JSCExecutorFactory.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTDataRequestHandler.h>
#import <React/RCTFileRequestHandler.h>
#import <React/RCTGIFImageDecoder.h>
#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTImageLoader.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTLocalAssetImageLoader.h>
#import <React/RCTNetworking.h>
#import <React/RCTPushNotificationManager.h>
#import <React/RCTTextAttributes.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/TurboModule.h>
#import <TurboModulesProvider.h>

#import "../NativeModuleExample/ScreenshotMacOS.h"

NSString *kBundleNameJS = @"RNTesterApp";

@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate, NSUserNotificationCenterDelegate>

@end

@implementation AppDelegate {
  NSMutableArray *_mainWindows;
  RCTTurboModuleManager *_turboModuleManager;
  std::shared_ptr<winrt::Microsoft::ReactNative::TurboModulesProvider> _turboModulesProvider;
}

- (void)awakeFromNib
{
  [super awakeFromNib];

  RCTEnableTurboModule(YES);

  _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];

  // Optionally set the global `fontSmoothing` setting.
  // If not explicitly set, the default is subpixel-antialiased
  [RCTTextAttributes setFontSmoothingDefault:RCTFontSmoothingSubpixelAntialiased];
}

- (void)applicationWillFinishLaunching:(NSNotification *)__unused aNotification
{
  [NSUserNotificationCenter defaultUserNotificationCenter].delegate = self;

  // initialize the url event listeners for Linking module
  // note that you will need to add a URL type to your app’s info.plist
  // this sample registers the rntester scheme
  [[NSAppleEventManager sharedAppleEventManager] setEventHandler:[RCTLinkingManager class]
                                                     andSelector:@selector(getUrlEventHandler:withReplyEvent:)
                                                   forEventClass:kInternetEventClass
                                                      andEventID:kAEGetURL];
}

- (IBAction)newDocument:(id)__unused sender
{
  if (_mainWindows == nil) {
    _mainWindows = [NSMutableArray new];
  }

  NSWindowController *windowController =
      [[NSStoryboard storyboardWithName:@"Main" bundle:nil] instantiateControllerWithIdentifier:@"MainWindow"];
  [_mainWindows addObject:windowController];
  [windowController showWindow:self];
}

#pragma mark - RCTBridgeDelegate Methods

- (NSURL *)sourceURLForBridge:(__unused RCTBridge *)bridge
{
  NSString *jsBundlePath = [NSString stringWithFormat:@"packages/rn-tester/js/%@.macos", kBundleNameJS];
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:jsBundlePath fallbackResource:nil];
}

#pragma mark - RCTCxxBridgeDelegate Methods

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                             delegate:self
                                                            jsInvoker:bridge.jsCallInvoker];
  [bridge setRCTTurboModuleRegistry:_turboModuleManager];

#if RCT_DEV
  /**
   * Eagerly initialize RCTDevMenu so CMD + d, CMD + i, and CMD + r work.
   * This is a stop gap until we have a system to eagerly init Turbo Modules.
   */
  [_turboModuleManager moduleForName:"RCTDevMenu"];
#endif

  __weak __typeof(self) weakSelf = self;
  return std::make_unique<facebook::react::JSCExecutorFactory>(
      facebook::react::RCTJSIExecutorRuntimeInstaller([weakSelf, bridge](facebook::jsi::Runtime &runtime) {
        if (!bridge) {
          return;
        }
        __typeof(self) strongSelf = weakSelf;
        if (strongSelf) {
          facebook::react::RuntimeExecutor syncRuntimeExecutor =
              [&](std::function<void(facebook::jsi::Runtime & runtime_)> &&callback) { callback(runtime); };
          [strongSelf->_turboModuleManager installJSBindingWithRuntimeExecutor:syncRuntimeExecutor];
        }
      }));
}

#pragma mark RCTTurboModuleManagerDelegate Methods

- (Class)getModuleClassFromName:(const char *)name
{
  return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (!_turboModulesProvider) {
    _turboModulesProvider = std::make_shared<winrt::Microsoft::ReactNative::TurboModulesProvider>();
    _turboModulesProvider->SetReactContext(winrt::Microsoft::ReactNative::CreateMacOSReactContext(jsInvoker));

    _turboModulesProvider->AddModuleProvider(
        L"ScreenshotManager", winrt::Microsoft::ReactNative::MakeModuleProvider<ScreenshotManagerCxx>());
  }
  return _turboModulesProvider->getModule(name, jsInvoker);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  // Set up the default RCTImageLoader and RCTNetworking modules.
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil
        loadersProvider:^NSArray<id<RCTImageURLLoader>> *(__unused RCTModuleRegistry *moduleRegistry) {
          return @[ [RCTLocalAssetImageLoader new] ];
        }
        decodersProvider:^NSArray<id<RCTImageDataDecoder>> *(__unused RCTModuleRegistry *moduleRegistry) {
          return @[ [RCTGIFImageDecoder new] ];
        }];
  } else if (moduleClass == RCTNetworking.class) {
    return [[moduleClass alloc]
        initWithHandlersProvider:^NSArray<id<RCTURLRequestHandler>> *(__unused RCTModuleRegistry *moduleRegistry) {
          return @[
            [RCTHTTPRequestHandler new],
            [RCTDataRequestHandler new],
            [RCTFileRequestHandler new],
          ];
        }];
  }
  // No custom initializer here.
  return [moduleClass new];
}

#pragma mark - Push Notifications

// Required for the remoteNotificationsRegistered event.
- (void)application:(NSApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Required for the remoteNotificationRegistrationError event.
- (void)application:(NSApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];
}

// Required for the remoteNotificationReceived event.
- (void)application:(NSApplication *)application didReceiveRemoteNotification:(NSDictionary<NSString *, id> *)userInfo
{
  [RCTPushNotificationManager didReceiveRemoteNotification:userInfo];
}

- (void)userNotificationCenter:(NSUserNotificationCenter *)center
        didDeliverNotification:(NSUserNotification *)notification
{
}

- (void)userNotificationCenter:(NSUserNotificationCenter *)center
       didActivateNotification:(NSUserNotification *)notification
{
  [RCTPushNotificationManager didReceiveUserNotification:notification];
}

- (BOOL)userNotificationCenter:(NSUserNotificationCenter *)center
     shouldPresentNotification:(NSUserNotification *)notification
{
  return YES;
}

@end
