import SwiftUI
import React
import React_RCTSwiftExtensions

@main
struct RNTesterApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
  @State private var immersionLevel: ImmersionStyle = .full
  
  var body: some Scene {
    RCTMainWindow(moduleName: "RNTesterApp")
    ImmersiveSpace(id: "TestImmersiveSpace") {}
      .immersionStyle(selection: $immersionLevel, in: .mixed, .progressive, .full)
  }
}
