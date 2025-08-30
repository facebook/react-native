// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "RNTesterModules",
    platforms: [.iOS(.v15), .macCatalyst(SupportedPlatform.MacCatalystVersion.v13)],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "NativeCxxModuleExample",
            targets: ["NativeCxxModuleExample"]
        ),
        .library(
          name: "NativeComponentExample",
          targets: ["NativeComponentExample"]
        ),
    ],
    dependencies: [
      .package(name: "React", path: "../react-native"),
      .package(name: "ReactCodegen", path: "./build/generated/ios"),
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "NativeCxxModuleExample",
            dependencies: ["React", "ReactCodegen"],
            path: "NativeCxxModuleExample",
            exclude: ["tests/", "CMakeLists.txt", "NativeCxxModuleExample.js", "module.modulemap", "NativeCxxModuleExample.podspec"],
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
        .target(
            name: "NativeComponentExample",
            dependencies: ["React", "ReactCodegen"],
            path: "NativeComponentExample",
            exclude: ["js/", "MyNativeView.podspec"],
            publicHeadersPath: "ios",
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
