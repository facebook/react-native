import SwiftUI

/**
 SwiftUI view enclosing `RCTReactViewController`. Its main purpose is to display React Native views inside of SwiftUI lifecycle.

 Use it create new windows in your app:
 Example:
 ```swift
  WindowGroup {
    RCTRootViewRepresentable(moduleName: "YourAppName")
  }
 ```
*/
public struct RCTRootViewRepresentable: UIViewControllerRepresentable {
  public typealias InitialPropsType = [AnyHashable: Any]?
  
  var moduleName: String
  var initialProps: InitialPropsType
  
  public init(moduleName: String, initialProps: InitialPropsType = nil) {
    self.moduleName = moduleName
    self.initialProps = initialProps
  }
  
  public func makeUIViewController(context: Context) -> UIViewController {
    RCTReactViewController(moduleName: moduleName, initProps: initialProps)
  }
  
  public func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
    // noop
  }
}
