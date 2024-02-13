import UIKit
import React
import React_RCTAppDelegate

class AppDelegate: RCTAppDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }
  
  override func bundleURL() -> URL? {
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "js/RNTesterApp.ios")
  }
}
