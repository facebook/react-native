/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit


@main
class AppDelegate: UIResponder, UIApplicationDelegate, UIWindowSceneDelegate {
  var window: UIWindow?
  
  var reactNativeFactory: RCTReactNativeFactory!
  var reactNativeDelegate: ReactNativeDelegate!
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    reactNativeDelegate = ReactNativeDelegate()
    reactNativeFactory = RCTReactNativeFactory(delegate: reactNativeDelegate)
    reactNativeDelegate.dependencyProvider = RCTAppDependencyProvider()

    let rootView = reactNativeFactory.rootViewFactory.view(
      withModuleName: "HelloWorld",
      initialProperties: [:],
      launchOptions: launchOptions
    )
    
    window = UIWindow(frame: UIScreen.main.bounds)
    window?.windowScene?.delegate = self
    let rootViewController = UIViewController()
    rootViewController.view = rootView
    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()

    return true
  }
  
  func windowScene(
    _ windowScene: UIWindowScene,
    didUpdate previousCoordinateSpace: any UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    NotificationCenter.default.post(name: .RCTWindowFrameDidChange, object: self)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
