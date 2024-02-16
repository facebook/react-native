import SwiftUI
import React
import React_RCTSwiftExtensions

// TODO: Export this to module, rethink sharing data
struct RCTWindow<Content: View>: Scene {
  let id: String
  let content: Content
  
  @State private var props: [AnyHashable : Any]? = nil
  
  public init(id: String, @ViewBuilder _ content: () -> Content) {
    self.id = id
    self.content = content()
  }
  
  public var body: some Scene {
    WindowGroup {
      content
        .onContinueUserActivity(id, perform: { userActivity in
          props = userActivity.userInfo ?? [:]
        })
    }
    .handlesExternalEvents(matching: [id])
  }
}

@main
struct RNTesterApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
  @State private var immersionLevel: ImmersionStyle = .full
  
  var body: some Scene {
    RCTMainWindow(moduleName: "RNTesterApp")
    
    RCTWindow(id: "FirstWindow") {
      RCTRootViewRepresentable(moduleName: "SecondWindow")
    }
    .defaultSize(width: 400, height: 600)
    
    ImmersiveSpace(id: "TestImmersiveSpace") {}
      .immersionStyle(selection: $immersionLevel, in: .mixed, .progressive, .full)
  }
}
