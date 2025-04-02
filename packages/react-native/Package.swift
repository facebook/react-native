// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

let react = "React"
let hermesVersion = "0.79.0-rc.2"

let cxxRNDepHeaderSearchPath: (Int) -> CXXSetting = {
  let prefix = (0..<$0).map { _ in "../" } .joined(separator: "")
  return .headerSearchPath("\(prefix)third-party/ReactNativeDependencies.xcframework/Headers")
}
let cRNDepHeaderSearchPath: (Int) -> CSetting = {
  let prefix = (0..<$0).map { _ in "../" } .joined(separator: "")
  return .headerSearchPath("\(prefix)third-party/ReactNativeDependencies.xcframework/Headers")
}

let package = Package(
  name: react,
  platforms: [.iOS(.v15)],
  products: [
    .library(
      name: react,
      type: .dynamic,
      targets: [
        .fbLazyVector,
        .rctDeprecation,
        .rctRequired,
        .yoga,
        .reactOSCompat,
        .reactCallInvoker,
        .reactTiming,
        .reactRendererConsistency,
        .reactFeatureFlags,
        .reactDebug,
        .jsi,
        .reactPerfLogger,
        .reactJsInspectorNetwork,
        .mapbuffer,
        .reactRendererDebug,
        .reactUtils,
        .reactRuntimeExecutor,
        .logger
        
        /*.reactDebug, .jsi, .logger, .mapbuffer, .fbLazyVector, .rctDeprecation, .rctRequired, .yoga, .reactUtils, .reactFeatureFlags, .reactRuntimeExecutor, .reactOSCompat, .reactCallInvoker, .reactTiming, .reactRendererDebug, .reactRendererConsistency, .hermesPrebuilt, .reactJsiExecutor, .reactCxxReact, .reactJsInspector, .reactJsInspectorNetwork, .reactJsInspectorTracing, .reactHermes, .reactJsiTooling, .reactPerformanceTimeline, .reactGraphics, .reactRendererCss, .reactJsErrorHandler, .reactImageManager, .reactImageManagerApple, .reactRCTImage, .reactCoreModules, .reactRCTAnimation, .reactRCTText, .reactRCTLinking*/]
    ),
  ],
  targets: [
    .reactNativeTarget(
      name: .fbLazyVector,
      dependencies: [],
      path: "Libraries/FBLazyVector",
      publicHeadersPath: "FBLazyVector"
    ),
    .reactNativeTarget(
      name: .rctDeprecation,
      dependencies: [],
      path: "ReactApple/Libraries/RCTFoundation/RCTDeprecation"
    ),
    .reactNativeTarget(
      name: .rctRequired,
      dependencies: [],
      path: "Libraries/Required",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .yoga,
      dependencies: [],
      path: "ReactCommon/yoga",
      publicHeadersPath: ".",
      extraCSettings: [.unsafeFlags(["-fno-omit-frame-pointer", "-fexceptions", "-Wall", "-Werror", "-fPIC"])],
      extraCxxSettings: [.unsafeFlags(["-fno-omit-frame-pointer", "-fexceptions", "-Wall", "-Werror", "-fPIC"])]
    ),
    .reactNativeTarget(
      name: .reactOSCompat,
      dependencies: [],
      path: "ReactCommon/oscompat",
      extraCSettings: [.headerSearchPath("./include/oscompat")],
      extraCxxSettings: [.headerSearchPath("./include/oscompat")]
    ),
    .reactNativeTarget(
      name: .reactCallInvoker,
      dependencies: [],
      path: "ReactCommon/callinvoker",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactTiming,
      dependencies: [],
      path: "ReactCommon/react/timing",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("../../../React/FBReactNativeSpec")],
      extraCxxSettings: [.headerSearchPath("../../../React/FBReactNativeSpec")]
    ),
    .reactNativeTarget(
      name: .reactRendererConsistency,
      dependencies: [],
      path: "ReactCommon/react/renderer/consistency",
      extraCSettings: [.headerSearchPath("./include/react/renderer/consistency"), .headerSearchPath("./include")],
      extraCxxSettings: [.headerSearchPath("./include/react/renderer/consistency"), .headerSearchPath("./include")]
    ),
    .reactNativeTarget(
      name: .reactDebug,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/react/debug",
      extraCSettings: [.headerSearchPath("../include")],
      extraCxxSettings: [.headerSearchPath("../include")]
    ),
    .reactNativeTarget(
      name: .jsi,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/jsi",
      extraExcludes: ["jsi/test"],
      sources: ["jsi"],
      publicHeadersPath: ".",
      extraCSettings: [.headerSearchPath(".")],
      extraCxxSettings: [.headerSearchPath(".")]
    ),
    .reactNativeTarget(
      name: .reactFeatureFlags,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/react/featureflags",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include/react/featureflags")],
      extraCxxSettings: [.headerSearchPath("./include/react/featureflags")]
    ),
    .reactNativeTarget(
      name: .reactPerfLogger,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/reactperflogger",
      sources: ["reactperflogger"],
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactJsInspectorNetwork,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/jsinspector-modern/network",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/jsinspector-modern/network")],
      extraCxxSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/jsinspector-modern/network")]
    ),
    .reactNativeTarget(
      name: .logger,
      dependencies: [.reactNativeDependencies, .jsi],
      path: "ReactCommon/logger",
      extraCSettings: [.headerSearchPath("./include/logger")],
      extraCxxSettings: [.headerSearchPath("./include/logger")]
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
    .reactNativeTarget(
      name: .reactUtils,
      dependencies: [.reactNativeDependencies, .reactDebug, .jsi],
      path: "ReactCommon/react/utils",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/react/utils")],
      extraCxxSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/react/utils")],
      linkerSettings: [.linkedFramework("CoreFoundation")]
    ),
    .reactNativeTarget(
      name: .reactRuntimeExecutor,
      dependencies: [.jsi],
      path: "ReactCommon/runtimeexecutor",
      sources: ["ReactCommon/RuntimeExecutor-dummy.c"],
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactRendererDebug,
      dependencies: [.reactDebug],
      path: "ReactCommon/react/renderer/debug",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include/react/renderer/debug"), .headerSearchPath("./include")],
      extraCxxSettings: [.headerSearchPath("./include/react/renderer/debug"), .headerSearchPath("./include")]
    ),
    .reactNativeTarget(
      name: .reactCxxReact,
      dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .reactRuntimeExecutor, .reactCallInvoker, .logger, .reactTiming, .reactDebug, .reactJsInspector],
      path: "ReactCommon/cxxreact",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include/cxxreact")],
      extraCxxSettings: [.headerSearchPath("./include/cxxreact")]
    ),
    
    /* This target compiles the same sources as React-hermes and fails if we add it to the target list above.
     .reactNativeTarget(
      name: .reactJsiTracing,
      dependencies: [.jsi, .hermesIncludes, .reactJsiExecutor],
      path: "ReactCommon/hermes/executor",
      publicHeadersPath: "."
    ),*/
    .reactNativeTarget(
      name: .reactJsiExecutor,
      dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .reactCxxReact, .reactJsInspector, .hermesIncludes],
      path: "ReactCommon/jsiexecutor",
      publicHeadersPath: "."
    ),
   
    .reactNativeTarget(
      name: .reactJsInspector,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactRuntimeExecutor, .jsi, .hermesIncludes, .reactJsInspectorTracing, .reactJsInspectorNetwork],
      path: "ReactCommon/jsinspector-modern",
      extraExcludes: ["tracing", "network", "tests"],
      extraCSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/jsinspector-modern")],
      extraCxxSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/jsinspector-modern")]
    ),
    .reactNativeTarget(
      name: .reactJsInspectorTracing,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactRuntimeExecutor, .jsi, .reactOSCompat],
      path: "ReactCommon/jsinspector-modern/tracing",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/jsinspector-modern/tracing")],
      extraCxxSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/jsinspector-modern/tracing")]
    ),
    .reactNativeTarget(
      name: .reactHermes,
      dependencies: [.reactNativeDependencies, .reactCxxReact, .reactJsiExecutor, .reactJsInspector, .reactJsInspectorTracing, .reactPerfLogger, .hermesIncludes, .hermesPrebuilt, .jsi, .reactRuntimeExecutor],
      path: "ReactCommon/hermes",
      extraExcludes: ["inspector-modern/chrome/tests"],
      extraCSettings: [.headerSearchPath("./include/hermes/inspector-modern/chrome"), .headerSearchPath("./include/hermes/executor")],
      extraCxxSettings: [.headerSearchPath("./include/hermes/inspector-modern/chrome"), .headerSearchPath("./include/hermes/executor")]
    ),
    .reactNativeTarget(
      name: .reactJsiTooling,
      dependencies: [.reactNativeDependencies, .reactJsInspector, .reactJsInspectorTracing, .reactCxxReact, .jsi],
      path: "ReactCommon/jsitooling",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactPerformanceTimeline,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactTiming, .reactJsInspectorTracing, .reactCxxReact, .reactPerfLogger],
      path: "ReactCommon/react/performance/timeline",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include/react/performance/timeline")],
      extraCxxSettings: [.headerSearchPath("./include/react/performance/timeline")]
    ),
    .reactNativeTarget(
      name: .reactRuntimeScheduler,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactTiming, .reactCxxReact, .reactPerfLogger, .reactPerformanceTimeline, .reactRendererConsistency, .reactUtils],
      path: "ReactCommon/react/renderer/runtimescheduler",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include/react/renderer/runtimescheduler"), .headerSearchPath("./include")],
      extraCxxSettings: [.headerSearchPath("./include/react/renderer/runtimescheduler"), .headerSearchPath("./include")]
    ),
    .reactNativeTarget(
      name: .rctTypesafety,
      dependencies: [.reactNativeDependencies, .rctRequired],
      path: "Libraries/Typesafety",
      extraCSettings: [.headerSearchPath("./include/React"), .headerSearchPath("./include"), .headerSearchPath("../../React/include")],
      extraCxxSettings: [.headerSearchPath("./include/React"), .headerSearchPath("./include"), .headerSearchPath("../../React/include")]
    ),
    .reactNativeTarget(
      name: .reactGraphicsCommon,
      dependencies: [.reactUtils],
      path: "ReactCommon",
      sources: ["react/renderer/graphics/dummy/dummy.c"],
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactGraphicsApple,
      dependencies: [.reactGraphicsCommon, .reactDebug, .jsi],
      path: "ReactCommon/react/renderer/graphics/platform/ios",
      publicHeadersPath: ".",
      extraCSettings: [.headerSearchPath("../../../include")],
      extraCxxSettings: [.headerSearchPath("../../../include")],
      linkerSettings: [
        .linkedFramework("UIKit"),
        .linkedFramework("CoreGraphics")
      ]
    ),
    .reactNativeTarget(
      name: .reactGraphics,
      dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactRendererDebug, .reactUtils, .reactGraphicsApple, .reactGraphicsCommon],
      path: "ReactCommon/react/renderer/graphics",
      extraExcludes: ["dummy", "platform", "tests"],
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactRendererCss,
      dependencies: [.reactDebug, .reactUtils],
      path: "ReactCommon",
      extraExcludes: ["react/renderer/css/tests"],
      sources: ["react/renderer/css"],
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactImageManagerApple,
      dependencies: [.reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .reactImageManager, .reactRCTImage, .reactCore],
      path: "ReactCommon/react/renderer/imagemanager/platform/ios",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactImageManager,
      dependencies: [.reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug],
      path: "ReactCommon/react/renderer/imagemanager",
      extraExcludes: ["platform", "tests"],
      extraCSettings: [.headerSearchPath("./include/react/renderer/imagemanager"), .headerSearchPath("./include")],
      extraCxxSettings: [.headerSearchPath("./include/react/renderer/imagemanager"), .headerSearchPath("./include")]
    ),
    .reactNativeTarget(
      name: .reactJsErrorHandler,
      dependencies: [.reactNativeDependencies, .jsi, .reactCxxReact, .reactFeatureFlags, .reactDebug, .reactTurboModuleBridging],
      path: "ReactCommon/jserrorhandler",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include/jserrorhandler")],
      extraCxxSettings: [.headerSearchPath("./include/jserrorhandler")]
    ),
    .reactNativeTarget(
      name: .reactTurboModuleBridging,
      dependencies: [.reactNativeDependencies, .reactCallInvoker, .reactPerfLogger, .reactCxxReact, .jsi, .logger],
      path: "ReactCommon/react/bridging",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("./include/react/bridging")],
      extraCxxSettings: [.headerSearchPath("./include/react/bridging")]
    ),
    .reactNativeTarget(
      name: .reactTurboModuleCore,
      dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCallInvoker, .reactCxxReact],
      path: "ReactCommon/react/nativemodule/core/ReactCommon",
      publicHeadersPath: ".",
      extraCSettings: [.headerSearchPath("../../../bridging/include"), .headerSearchPath("../")],
      extraCxxSettings: [.headerSearchPath("../../../bridging/include"), .headerSearchPath("../")]
    ),
    .reactNativeTarget(
      name: .reactCoreRCTWebsocket,
      dependencies: [.yoga],
      path: "Libraries/WebSocket",
      extraExcludes: ["Wrapper/Example"]      
    ),
    .reactNativeTarget(
      name: .reactCoreModules,
      dependencies: [.rctTypesafety, .reactRCTImage, .jsi, .reactJsInspector, .reactJsInspectorTracing, .reactFBReactNativeSpec, .reactTurboModuleBridging, .reactNativeModulesApple],
      path: "React/CoreModules",
      publicHeadersPath: ".",
      extraCSettings: [.headerSearchPath("../../include/React")],
      extraCxxSettings: [.headerSearchPath("../../include/React")]
    ),
    .reactNativeTarget(
      name: .reactCore,
      dependencies: [.reactCxxReact, .reactPerfLogger, .jsi, .reactJsiExecutor, .reactUtils, .reactFeatureFlags, .reactRuntimeScheduler, .yoga, .reactJsInspector, .reactJsiTooling, .rctDeprecation, .reactCoreRCTWebsocket, .reactRuntimeApple],
      path: "React",
      extraExcludes: ["Fabric", "FBReactNativeSpec", "CoreModules", "Tests", "Resources", "I18n", "Runtime"],
      sources: [".", "Runtime/RCTHermesInstanceFactory.mm"],
      extraCSettings: [.headerSearchPath("./include/React"), .headerSearchPath("./include"), .headerSearchPath("./FBReactNativeSpec")],
      extraCxxSettings: [.headerSearchPath("./include/React"), .headerSearchPath("./include"), .headerSearchPath("./FBReactNativeSpec")]
    ),
    .reactNativeTarget(
      name: .reactFBReactNativeSpec,
      dependencies: [.jsi, .reactJsiExecutor, .rctRequired, .rctTypesafety, .reactCore],
      path: "React/FBReactNativeSpec",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactNativeModulesApple,
      dependencies: [.reactTurboModuleBridging, .reactCore, .reactCallInvoker, .reactCxxReact, .jsi, .reactFeatureFlags, .reactRuntimeExecutor, .reactJsInspector],
      path: "ReactCommon/react/nativemodule/core/platform/ios",
      publicHeadersPath: ".",
      extraCSettings: [.headerSearchPath("../../")],
      extraCxxSettings: [.headerSearchPath("../../")]
    ),
    .reactNativeTarget(
      name: .reactFabric,
      dependencies: [.reactJsiExecutor, .rctRequired, .rctTypesafety, .reactTurboModuleCore, .jsi, .logger, .reactCore, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .reactRendererDebug, .reactGraphics],
      path: "ReactCommon/react/renderer",
      extraExcludes: ["animations/tests", "attributedstring/tests", "core/tests", "components/root/tests", "components/view/tests", "components/legacyviewmanagerinterop/tests", "components/dom/tests", "mounting/tests", "observers/events/tests", "templateprocessor/tests", "uimanager/tests", "telemetry/tests", "leakchecker/tests", "css", "debug", "graphics", "imagemanager", "mapbuffer", "consistency"],
      sources: ["animations", "attributedstring", "core", "componentregistry", "components/root", "components/view", "components/legacyviewmanagerinterop", "components/dom", "scheduler", "imagemanager", "mounting", "observers/events", "templateprocessor", "renderer/telemetry", "uimanager/consistency", "uimanager", "leakchecker"],
      publicHeadersPath: "./include"
    ),
    .reactNativeTarget(
      name: .reactRuntime,
      dependencies: [.jsi, .reactJsiExecutor, .reactCxxReact, .reactRuntimeExecutor, .jsi, .reactJsErrorHandler, .reactPerformanceTimeline, .reactUtils, .reactFeatureFlags, .reactJsInspector, .reactJsiTooling, .reactHermes, .reactRuntimeScheduler],
      path: "ReactCommon/react/runtime",
      extraExcludes: ["tests", "iostests", "platform"],
      extraCSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/react/runtime")],
      extraCxxSettings: [.headerSearchPath("./include"), .headerSearchPath("./include/react/runtime")]
    ),
      .reactNativeTarget(
      name: .reactRuntimeApple,
      dependencies: [.jsi, .reactPerfLogger, .reactCxxReact, .rctDeprecation, .yoga, .reactRuntime],
      path: "ReactCommon/react/runtime/platform/ios",
      extraExcludes: ["ReactCommon/RCTJscInstance.mm"],
      publicHeadersPath: ".",
      extraCSettings: [.headerSearchPath("../../../../../React/include")],
      extraCxxSettings: [.headerSearchPath("../../../../../React/include")]
    ),
    .reactNativeTarget(
      name: .reactRCTAnimation,
      dependencies: [.rctTypesafety, .jsi, .reactFeatureFlags],
      path: "Libraries/NativeAnimation",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactRCTImage,
      dependencies: [.rctTypesafety, .jsi, .reactCore, .reactTurboModuleBridging, .reactTurboModuleCore],
      path: "Libraries/Image",
      extraCSettings: [.headerSearchPath("./include/React")],
      extraCxxSettings: [.headerSearchPath("./include/React")]
    ),
    .reactNativeTarget(
      name: .reactRCTText,
      dependencies: [.yoga],
      path: "Libraries/Text",
      publicHeadersPath: "."
    ),
    .reactNativeTarget(
      name: .reactRCTLinking,
      dependencies: [.jsi],
      path: "Libraries/LinkingIOS",
      publicHeadersPath: "."
    ),
    /*
     Empty target
     .reactNativeTarget(
      name: .reactRCTActionSheet,
      dependencies: [],
      path: "Libraries/ActionSheetIOS"
    ),*/
    .binaryTarget(
      name: .reactNativeDependencies,
      path: "third-party/ReactNativeDependencies.xcframework"
    ),
    .binaryTarget(
      name: .hermesPrebuilt,
      path: "sdks/hermes-engine-artifacts/hermes-ios-\(hermesVersion)-debug/destroot/Library/Frameworks/universal/hermes.xcframework"
    ),
    .target(
      name: .hermesIncludes,
      path: "sdks/hermes-engine-artifacts/hermes-ios-\(hermesVersion)-debug/destroot",
      sources: ["dummy.c"],
      publicHeadersPath: "include"
    )
  ]
)

extension String {
  static let reactDebug = "React-debug"
  static let jsi = "React-jsi"
  static let logger = "React-logger"
  static let mapbuffer = "React-Mapbuffer"

  static let fbLazyVector = "FBLazyVector"
  static let rctDeprecation = "RCT-Deprecation"
  static let rctRequired = "RCT-Required"
  static let yoga = "Yoga"
  static let reactUtils = "React-utils"
  static let reactFeatureFlags = "React-featureflags"
  static let reactPerfLogger = "React-perflogger"
  static let reactJsInspectorNetwork = "React-jsinspectornetwork"
  static let reactRuntimeExecutor = "React-runtimeexecutor"
  static let reactOSCompat = "React-oscompat"
  static let reactCallInvoker = "React-callinvoker"
  static let reactTiming = "React-timing"
  static let reactRendererDebug = "React-rendererdebug"
  static let reactRendererConsistency = "React-rendererconsistency"

  static let reactHermes = "React-hermes"
  static let reactJsiTracing = "React-jsitracing"
  static let reactJsiExecutor = "React-jsiexecutor"
  static let reactJsInspector = "React-jsinspector"
  static let reactJsInspectorTracing = "React-jsinspectortracing"
  static let reactCxxReact = "React-cxxreact"
  static let reactCore = "React-Core"
  static let reactCoreRCTWebsocket = "React-Core/RCTWebSocket"
  static let reactFBReactNativeSpec = "React-RCTFBReactNativeSpec"
  static let reactFabric = "React-Fabric"
  static let reactCoreModules = "React-CoreModules"

  static let reactNativeDependencies = "ReactNativeDependencies"

  static let hermesPrebuilt = "hermes-prebuilt"
  static let hermesIncludes = "hermes-includes"
  
  static let reactJsiTooling = "React-jsitooling"
  static let reactPerformanceTimeline = "React-performancetimeline"
  static let reactRuntimeScheduler = "React-runtimescheduler"
  static let rctTypesafety = "RCTTypesafety"
  static let reactGraphics = "React-graphics"
  static let reactGraphicsApple = "React-graphics-Apple"
  static let reactGraphicsCommon = "React-graphics-Common"
  static let reactRendererCss = "React-renderercss"
  static let reactImageManager = "React-ImageManager"
  static let reactImageManagerApple = "React-ImageManagerApple"
  static let reactJsErrorHandler = "React-jserrorhandler"
  
  static let reactNativeModulesApple = "React-NativeModulesApple"
  
  static let reactRuntime = "React-Runtime"
  static let reactRuntimeApple = "React-RuntimeApple"
  static let reactRCTAnimation = "React-RCTAnimation"
  static let reactRCTImage = "React-RCTImage"
  static let reactRCTText = "React-RCTText"
  static let reactRCTActionSheet = "React-RCTActionSheet" // Empty target
  static let reactRCTLinking = "React-RCTLinking"
  
  static let reactTurboModuleBridging = "ReactCommon/turbomodule/bridging"
  static let reactTurboModuleCore = "ReactCommon/turbomodule/core"
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
    extraCxxSettings: [CXXSetting] = [],
    linkerSettings: [LinkerSetting] = []
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
      cxxSettings: cxxSettings,
      linkerSettings: linkerSettings
    )
  }
}
