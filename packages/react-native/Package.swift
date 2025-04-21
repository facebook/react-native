// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

let react = "React"

let cxxRNDepHeaderSearchPath: (Int) -> CXXSetting = {
  let prefix = (0..<$0).map { _ in "../" }.joined(separator: "")
  return .headerSearchPath("\(prefix)third-party/ReactNativeDependencies.xcframework/Headers")
}
let cRNDepHeaderSearchPath: (Int) -> CSetting = {
  let prefix = (0..<$0).map { _ in "../" }.joined(separator: "")
  return .headerSearchPath("\(prefix)third-party/ReactNativeDependencies.xcframework/Headers")
}

let package = Package(
  name: react,
  products: [
    .library(
      name: react,
      type: .dynamic,
      targets: [.reactDebug, .jsi, .logger, .mapbuffer]
    )
  ],
  targets: [
    .reactNativeTarget(
      name: .reactDebug,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/react/debug",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .jsi,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/jsi",
      extraExcludes: ["jsi/CMakeLists.txt", "jsi/test/testlib.h", "jsi/test/testlib.cpp"],
      sources: ["jsi"],
      publicHeadersPath: "jsi/",
      extraCSettings: [.headerSearchPath(".")],
      extraCxxSettings: [.headerSearchPath(".")]
    ),
    .reactNativeTarget(
      name: .logger,
      dependencies: [.reactNativeDependencies, .jsi],
      path: "ReactCommon/logger",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .mapbuffer,
      dependencies: [.reactNativeDependencies, .reactDebug],
      path: "ReactCommon/react/renderer/mapbuffer",
      extraExcludes: ["tests/MapBufferTest.cpp"],
      publicHeadersPath: ".",
      extraCSettings: [.headerSearchPath("../../..")],
      extraCxxSettings: [.headerSearchPath("../../..")]
    ),
    .binaryTarget(
      name: .reactNativeDependencies,
      path: "third-party/ReactNativeDependencies.xcframework"
    ),
  ]
)

extension String {
  static let reactDebug = "React-debug"
  static let jsi = "React-jsi"
  static let logger = "React-logger"
  static let mapbuffer = "React-Mapbuffer"

  static let reactNativeDependencies = "ReactNativeDependencies"
}

func defaultExcludeFor(module: String) -> [String] {
  return ["BUCK", "CMakeLists.txt", "\(module).podspec"]
}

extension Target {
  static func reactNativeTarget(
    name: String,
    dependencies: [String],
    path: String,
    extraExcludes: [String] = [],
    sources: [String]? = nil,
    publicHeadersPath: String? = nil,
    extraCSettings: [CSetting] = [],
    extraCxxSettings: [CXXSetting] = []
  ) -> Target {
    let dependencies = dependencies.map { Dependency.byNameItem(name: $0, condition: nil) }
    let excludes = defaultExcludeFor(module: .logger) + extraExcludes
    let numOfSlash = path.count { $0 == "/" }
    let cSettings = [cRNDepHeaderSearchPath(numOfSlash + 1)] + extraCSettings
    let cxxSettings = [cxxRNDepHeaderSearchPath(numOfSlash + 1), .unsafeFlags(["-std=c++20"])] + extraCxxSettings

    return .target(
      name: name,
      dependencies: dependencies,
      path: path,
      exclude: excludes,
      sources: sources,
      publicHeadersPath: publicHeadersPath,
      cSettings: cSettings,
      cxxSettings: cxxSettings
    )
  }
}
