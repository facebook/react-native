import SwiftUI
import React
import React_RCTSwiftExtensions

@main
struct RNTesterApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
  
  var body: some Scene {
    RCTMainWindow(moduleName: "RNTesterApp")
  }
}
