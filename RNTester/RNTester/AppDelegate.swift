/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate {
  
  var window: UIWindow?
  
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
    
    bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    // Appetizer.io params check
    var initProps: [AnyHashable: Any]? = nil
    var _routeUri: String? = UserDefaults.standard.string(forKey: "route")
    if routeUri {
      initProps = ["exampleFromAppetizeParams": "rntester://example/\(routeUri)Example"]
    }
    var rootView = RCTRootView(bridge: bridge, moduleName: "RNTesterApp", initialProperties: initProps)
    window = UIWindow(frame: UIScreen.main.bounds)
    var rootViewController = UIViewController()
    rootViewController.view = rootView as? UIView ?? UIView()
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    return true
  }
  
  func sourceURL(for bridge: __unused RCTBridge) -> URL {
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "RNTester/js/RNTesterApp.ios", fallbackResource: nil)
  }
  
  func loadSource(for bridge: RCTBridge, onProgress: RCTSourceLoadProgressBlock, onComplete loadCallback: RCTSourceLoadBlock) {
    RCTJavaScriptLoader.loadBundle(atURL: sourceURL(for: bridge), onProgress: onProgress, onComplete: loadCallback)
  }

  
  func application(app: UIApplication, openURL url: NSURL, options: [String : AnyObject]) -> Bool
  {
    return RCTLinkingManager.application(app, open: url, options: options)

  }
  
# pragma mark - Push Notifications
  
#if !TARGET_OS_TV
  

  // Required to register for notifications
  
  func application(_ application: UIApplication, didRegister notificationSettings: UIUserNotificationSettings) {
    RCTPushNotificationManager.didRegister(notificationSettings)
  }
  
  // Required for the remoteNotificationsRegistered event.
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RCTPushNotificationManager.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }

  
  // Required for the remoteNotificationRegistrationError event.
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    try? RCTPushNotificationManager.didFailToRegisterForRemoteNotifications()
  }
  
  // Required for the remoteNotificationReceived event.
  func application(_ application: __unused UIApplication, didReceiveRemoteNotification notification: [AnyHashable: Any]) {
    RCTPushNotificationManager.didReceiveRemoteNotification(notification)
  }
  
  func application(_ application: __unused UIApplication, didReceiveRemoteNotification notification: [AnyHashable: Any]) {
    RCTPushNotificationManager.didReceiveRemoteNotification(notification)
  }
  
  // Required for the localNotificationReceived event.
  func application(_ application: UIApplication, didReceive notification: UILocalNotification) {
    RCTPushNotificationManager.didReceive(notification as? UILocalNotification ?? UILocalNotification())
  }

#endif
  
}
