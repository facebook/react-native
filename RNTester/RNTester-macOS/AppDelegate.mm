//
//  AppDelegate.m
//  RNTester-macOS
//
//  Created by Jeff Cruikshank on 6/5/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "AppDelegate.h"

#import <React/JSCExecutorFactory.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTPushNotificationManager.h>
#import <React/RCTTextAttributes.h>
#import <ReactCommon/TurboModule.h>
#import "../NativeModuleExample/ScreenshotMacOS.h"

#import <ReactCommon/RCTTurboModuleManager.h>

NSString *kBundleNameJS = @"RNTesterApp";

@interface AppDelegate () <RCTCxxBridgeDelegate, NSUserNotificationCenterDelegate>
{
  ScreenshotManagerTurboModuleManagerDelegate *_turboModuleManagerDelegate;
  RCTTurboModuleManager *_turboModuleManager;
}
@end

@implementation AppDelegate
{
  NSMutableArray *_mainWindows;
}

- (void)awakeFromNib
{
	[super awakeFromNib];

	_bridge = [[RCTBridge alloc] initWithDelegate:self
																	launchOptions:nil];

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

-(IBAction)newDocument:(id)__unused sender
{
  if (_mainWindows == nil) {
    _mainWindows = [NSMutableArray new];
  }
  
  NSWindowController *windowController = [[NSStoryboard storyboardWithName:@"Main" bundle:nil] instantiateControllerWithIdentifier:@"MainWindow"];
  [_mainWindows addObject:windowController];
  [windowController showWindow:self];
}

#pragma mark - RCTBridgeDelegate Methods

- (NSURL *)sourceURLForBridge:(__unused RCTBridge *)bridge
{
	NSString *jsBundlePath = [NSString stringWithFormat:@"RNTester/js/%@.macos",kBundleNameJS];
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:jsBundlePath
                                                        fallbackResource:nil];
}

#pragma mark - RCTCxxBridgeDelegate Methods

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  __weak __typeof(self) weakSelf = self;
  return std::make_unique<facebook::react::JSCExecutorFactory>([weakSelf, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf->_turboModuleManagerDelegate = [ScreenshotManagerTurboModuleManagerDelegate new];
      strongSelf->_turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                                             delegate:strongSelf->_turboModuleManagerDelegate
                                                                            jsInvoker:bridge.jsCallInvoker];
      [strongSelf->_turboModuleManager installJSBindingWithRuntime:&runtime];
    }
  });
}

# pragma mark - Push Notifications

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
- (void)application:(NSApplication *)application didReceiveRemoteNotification:(NSDictionary<NSString *,id> *)userInfo
{
  [RCTPushNotificationManager didReceiveRemoteNotification:userInfo];
}

- (void)userNotificationCenter:(NSUserNotificationCenter *)center didDeliverNotification:(NSUserNotification *)notification
{
  
}

- (void)userNotificationCenter:(NSUserNotificationCenter *)center didActivateNotification:(NSUserNotification *)notification
{
  [RCTPushNotificationManager didReceiveUserNotification:notification];
}

- (BOOL)userNotificationCenter:(NSUserNotificationCenter *)center shouldPresentNotification:(NSUserNotification *)notification
{
  return YES;
}

@end
