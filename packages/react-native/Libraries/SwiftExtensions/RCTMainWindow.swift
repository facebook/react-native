import SwiftUI

/**
 This SwiftUI struct returns main React Native scene. It should be used only once as it conains setup code.
 
 Example:
 ```swift
 @main
 struct YourApp: App {
   @UIApplicationDelegateAdaptor var delegate: AppDelegate
   
   var body: some Scene {
     RCTMainWindow(moduleName: "YourApp")
   }
 }
 ```
 
 Note: If you want to create additional windows in your app, create a new `WindowGroup {}` and pass it a `RCTRootViewRepresentable`.
*/
public struct RCTMainWindow: Scene {
  var moduleName: String
  var initialProps: RCTRootViewRepresentable.InitialPropsType
  
  public init(moduleName: String, initialProps: RCTRootViewRepresentable.InitialPropsType = nil) {
    self.moduleName = moduleName
    self.initialProps = initialProps
  }
  
  public var body: some Scene {
    WindowGroup {
      RCTRootViewRepresentable(moduleName: moduleName, initialProps: initialProps)
    }
  }
}
