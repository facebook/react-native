//
//  AppDelegate.swift
//  HelloWorld
//

import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate {
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    
    #if FB_SONARKIT_ENABLED
    let layoutDescriptorMapper = SKDescriptorMapper(defaults: ())
    FlipperClient.shared()!.add(FlipperKitLayoutPlugin(rootNode: application, with: layoutDescriptorMapper))
    FlipperClient.shared()!.add(FKUserDefaultsPlugin(suiteName: nil))
    FlipperClient.shared()!.add(FlipperKitReactPlugin())
    FlipperClient.shared()!.add(FlipperKitNetworkPlugin(networkAdapter: SKIOSNetworkAdapter()))
    FlipperClient.shared()!.start()
    #endif
    
    application.isNetworkActivityIndicatorVisible = true
    
    guard let bridge = RCTBridge(delegate: self, launchOptions: launchOptions) else {
      return false
    }
    let rootView = RCTRootView(bridge: bridge, moduleName: "HelloWorld", initialProperties: nil)
    
    rootView.backgroundColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0)

    self.window = UIWindow(frame: UIScreen.main.bounds)
    let rootViewController = UIViewController()
    rootViewController.view = rootView
    self.window!.rootViewController = rootViewController
    self.window!.makeKeyAndVisible()
    
    return true
  }
  
  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings()!.jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
