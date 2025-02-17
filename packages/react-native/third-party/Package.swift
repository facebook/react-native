// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

let glogUnsafeCAndCxxFlags = ["-Wno-shorten-64-to-32"]

let package = Package(
    name: "ReactNativeDependencies",
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "ReactNativeDependencies",
            type: .dynamic,
            targets: ["glog"]
        ),
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "glog",
            dependencies: [],
            path: "glog",
//            resources: [.copy("../third-party-podspecs/glog/PrivacyInfo.xcprivacy")],
            publicHeadersPath: "./src",
            cSettings: [
              .headerSearchPath("src"),
              .unsafeFlags(glogUnsafeCAndCxxFlags)
            ],
            cxxSettings: [
              .headerSearchPath("src"),
              .unsafeFlags(glogUnsafeCAndCxxFlags)
            ]
        ),
    ]
)
