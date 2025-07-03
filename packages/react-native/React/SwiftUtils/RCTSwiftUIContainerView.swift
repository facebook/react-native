/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
 
import SwiftUI
import UIKit

@objc public class RCTSwiftUIContainerView: NSObject {
  private var containerViewModel = ContainerViewModel()
  private var hostingController: UIHostingController<SwiftUIContainerView>?

  @objc public override init() {
    super.init();
    hostingController = UIHostingController(rootView: SwiftUIContainerView(viewModel: containerViewModel))
    guard let view = hostingController?.view else {
      return
    }

    view.backgroundColor = .clear;
  }


  @objc public func updateContentView(_ view: UIView) {
    containerViewModel.contentView = view
  }

  @objc public func hostingView() -> UIView? {
    return hostingController?.view;
  }
  
  @objc public func contentView() -> UIView? {
    return containerViewModel.contentView
  }
  
  @objc public func updateBlurRadius(_ radius: NSNumber) {
    let blurRadius = CGFloat(radius.floatValue)
    containerViewModel.blurRadius = blurRadius
  }
  
  @objc public func updateGrayScale(_ amount: NSNumber) {
    let amount = CGFloat(amount.floatValue)
    containerViewModel.grayScale = amount;
  }

  @objc public func resetStyles() {
    containerViewModel.blurRadius = 0
    containerViewModel.grayScale = 0
  }
}

class ContainerViewModel: ObservableObject {
  @Published var blurRadius: CGFloat = 0
  @Published var grayScale: CGFloat = 0
  @Published var contentView: UIView?
}

struct SwiftUIContainerView: View {
  @ObservedObject var viewModel: ContainerViewModel

  var body: some View {
    if let contentView = viewModel.contentView {
      UIViewWrapper(view: contentView)
        .blur(radius: viewModel.blurRadius)
        .grayscale(viewModel.grayScale)

    }
  }
}

struct UIViewWrapper: UIViewRepresentable {
  let view: UIView

  func makeUIView(context: Context) -> UIView {
    return view
  }

  func updateUIView(_ uiView: UIView, context: Context) {
  }
}
