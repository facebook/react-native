import Foundation
import SwiftUI

@objc public enum ImmersiveSpaceResult: Int {
  case opened
  case userCancelled
  case error
}

public typealias CompletionHandlerType = (_ result: ImmersiveSpaceResult) -> Void

/**
 * Utility view used to bridge the gap between SwiftUI environment and UIKit.
 *
 * Calls `openImmersiveSpace` when view appears in the UIKit hierarchy and `dismissImmersiveSpace` when removed.
 */
struct ImmersiveBridgeView: View {
  @Environment(\.openImmersiveSpace) private var openImmersiveSpace
  @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
  
  var spaceId: String
  var completionHandler: CompletionHandlerType
  
  var body: some View {
    EmptyView()
      .onAppear {
        Task {
          let result = await openImmersiveSpace(id: spaceId)
          
          switch result {
          case .opened:
            completionHandler(.opened)
          case .error:
            completionHandler(.error)
          case .userCancelled:
            completionHandler(.userCancelled)
          default:
            break
          }
        }
      }
      .onDisappear {
        Task { await dismissImmersiveSpace() }
      }
  }
}

@objc public class ImmersiveBridgeFactory: NSObject {
  @objc public static func makeImmersiveBridgeView(
    spaceId: String,
    completionHandler: @escaping CompletionHandlerType
  ) -> UIViewController {
    return UIHostingController(rootView: ImmersiveBridgeView(spaceId: spaceId, completionHandler: completionHandler))
  }
}
