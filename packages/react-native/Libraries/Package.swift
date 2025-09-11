// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

let package = Package(
  name: "React-Libraries",
  platforms: [.iOS(.v15), .macCatalyst(SupportedPlatform.MacCatalystVersion.v13)],
  products: [
    // Products define the executables and libraries a package produces, making them visible to other packages.
    .library(
      name: "PushNotification",
      targets: ["PushNotification"])
  ],
  dependencies: [
    .package(name: "React", path: "../")
  ],
  targets: [
    // Targets are the basic building blocks of a package, defining a module or a test suite.
    // Targets can depend on other targets in this package and products from dependencies.
    .target(
      name: "PushNotification",
      dependencies: ["React"],
      path: "PushNotificationIOS",
      exclude: ["React-RCTPushNotification.podspec", "NativePushNotificationManagerIOS.js", "PushNotificationIOS.d.ts", "PushNotificationIOS.js"],
      publicHeadersPath: ".",
      cxxSettings: [
        .unsafeFlags(["-std=c++20"])
      ],
      linkerSettings: [
        .linkedFramework("Foundation")
      ]
    )
  ]
)
