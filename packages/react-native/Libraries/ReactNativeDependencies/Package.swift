// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

let package = Package(
  name: "ReactNativeDependencies",
  products: [
    // Products define the executables and libraries a package produces, making them visible to other packages.
    .library(
      name: "ReactNativeDependencies",
      targets: ["ReactNativeDependencies"]
    ),
  ],
  targets: [
    .binaryTarget(
      name: "ReactNativeDependencies",
      path: "../../third-party/ReactNativeDependencies.xcframework" // this will be replaced by the URL of the xcframework after we publish it on maven
    ),
  ]
)
