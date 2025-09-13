// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "React-Libraries",
    platforms: [.iOS(.v15), .macCatalyst(SupportedPlatform.MacCatalystVersion.v13)],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "PushNotification",
            targets: ["PushNotification"]),
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
            // cSettings: [
            //   .headerSearchPath("headers")
            // ],
            cxxSettings: [
              // .headerSearchPath("headers"),
              .unsafeFlags(["-std=c++20"]),
            ],
            linkerSettings: [
              .linkedFramework("Foundation")
            ]
        ),
    ]
)
