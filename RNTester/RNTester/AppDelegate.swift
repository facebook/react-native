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
  var bridge: RCTBridge? 

  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
    
    bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    // Appetizer.io params check
    var initProps: [AnyHashable: Any]? = nil
    
    if let routeUri = UserDefaults.standard.string(forKey: "route") {
      initProps = ["exampleFromAppetizeParams": "rntester://example/\(routeUri)Example"]
    }
    
    let rootView = RCTRootView(bridge: bridge, moduleName: "RNTesterApp", initialProperties: initProps)
    window = UIWindow(frame: UIScreen.main.bounds)
    let rootViewController = UIViewController()
    rootViewController.view = rootView ?? UIView()
    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()

    return true
  }
  
  func sourceURL(for bridge: RCTBridge) -> URL {
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "RNTester/js/RNTesterApp.ios", fallbackResource: nil)
  }
  
  func application(_ app: UIApplication, open url: URL, options: [UIApplicationOpenURLOptionsKey : Any] = [:]) -> Bool {
    return RCTLinkingManager.application(app, open: url as URL!, options: options)
  }
  
  func loadSource(for bridge: RCTBridge!, onProgress: RCTSourceLoadProgressBlock!, onComplete loadCallback: RCTSourceLoadBlock!) {
    RCTJavaScriptLoader.loadBundle(at: sourceURL(for: bridge), onProgress: onProgress, onComplete: loadCallback)
  }
  
// MARK - Push Notifications
  
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
    RCTPushNotificationManager.didFailToRegisterForRemoteNotificationsWithError(error)
  }
  
  // Required for the remoteNotificationReceived event.
  func application(_ application: UIApplication, didReceiveRemoteNotification notification: [AnyHashable: Any]) {
    RCTPushNotificationManager.didReceiveRemoteNotification(notification)
  }
  
  // Required for the localNotificationReceived event.
  func application(_ application: UIApplication, didReceive notification: UILocalNotification) {
    RCTPushNotificationManager.didReceive(notification ?? UILocalNotification())
  }

#endif
  
}
