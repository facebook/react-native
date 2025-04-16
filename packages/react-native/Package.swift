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
func commonModulePath<T>(_ depth: Int, _ path: String, _ settingType: T.Type) -> T {
    let prefix = (0..<depth).map { _ in "../" }.joined(separator: "")
    let fullPath = "\(prefix)\(path)"
    if T.self == CSetting.self {
        return CSetting.headerSearchPath(fullPath) as! T
    } else if T.self == CXXSetting.self {
        return CXXSetting.headerSearchPath(fullPath) as! T
    } else {
        fatalError("Unsupported setting type")
    }
}

/**
 Targets that doesn't define compilation units:
 .fbLazyVector,
 .rctRequired,
 .reactCallInvoker,
 .reactTiming,
 
 .reactRuntimeExecutor,
 */

let package = Package(
  name: react,
  platforms: [.iOS(.v15)],
  products: [
    .library(
      name: react,
      type: .dynamic,
      targets: [
        
        .rctDeprecation,
        .yoga,
        .reactOSCompat,
        
        .reactRendererConsistency,
        .reactFeatureFlags,
        .reactDebug,
        .jsi,
        .reactPerfLogger,
        .mapbuffer,
        .reactRendererDebug,
        .reactUtils,
        .logger,
        
        .reactJsInspector,
        .reactJsInspectorTracing,
        .reactJsInspectorNetwork,
        .reactCxxReact,
        
        .reactJsiTooling,
        .reactJsiExecutor,
        .reactHermes,
        .hermesIncludes,
        .reactPerformanceTimeline,
        .reactRuntimeScheduler,

        .reactTurboModuleCore,
        .reactTurboModuleBridging,
        .reactJsErrorHandler,

        .reactGraphicsApple,
        .reactGraphics,
        
        .reactRendererCss,

        // Now we need React/Base files
        //.reactCoreModules
        //.reactCore

        //.reactNativeModulesApple
        //.reactRuntime,
        //.reactRuntimeApple
        //.rctTypesafety,
        
        //.reactCoreRCTWebsocket,
        //.reactRCTImage

      ]
    ),
  ],
  targets: [
    /**
     Without any dependencies
    */
   /*.reactNativeTarget(
      name: .fbLazyVector,
      path: "Libraries/FBLazyVector"
    ),*/
    .reactNativeTarget(
      name: .rctDeprecation,
      path: "ReactApple/Libraries/RCTFoundation/RCTDeprecation"
    ),
    /*.reactNativeTarget(
      name: .rctRequired,
      path: "Libraries/Required",
    ),*/
    .reactNativeTarget(
      name: .yoga,
      path: "ReactCommon/yoga",
      // To avoid having to delete the cmake folder at the same level we
      // provide a "wrong" header path and instead include it using header search paths.
      publicHeadersPath: "yoga",
      extraCSettings: [.headerSearchPath("./"), .unsafeFlags(["-fno-omit-frame-pointer", "-fexceptions", "-Wall", "-Werror", "-fPIC"])],
      extraCxxSettings: [.headerSearchPath("./"), .unsafeFlags(["-fno-omit-frame-pointer", "-fexceptions", "-Wall", "-Werror", "-fPIC"])]
    ),
    .reactNativeTarget(
      name: .reactOSCompat,
      path: "ReactCommon/oscompat"
    ),
    /*.reactNativeTarget(
      name: .reactCallInvoker,
      path: "ReactCommon/callinvoker",
    ),*/
    /*.reactNativeTarget(
      name: .reactTiming,
      path: "ReactCommon/react/timing",
      extraExcludes: ["tests"],
      extraCSettings: [.headerSearchPath("../../../React/FBReactNativeSpec")],
      extraCxxSettings: [.headerSearchPath("../../../React/FBReactNativeSpec")]
    ),*/
    .reactNativeTarget(
      name: .reactRendererConsistency,
      path: "ReactCommon/react/renderer/consistency"
    ),

    /**
     Depends on RN Thirdy Party deps only
    */
    .reactNativeTarget(
      name: .reactDebug,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/react/debug",
      commonHeaderPathModules: ["ReactCommon"]
    ),
    .reactNativeTarget(
      name: .jsi,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/jsi",
      extraExcludes: ["jsi/test"],
      sources: ["jsi"]
    ),
    .reactNativeTarget(
      name: .reactFeatureFlags,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/react/featureflags",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon"]
    ),
    .reactNativeTarget(
      name: .reactPerfLogger,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/reactperflogger",
      sources: ["reactperflogger"],
    ),

    /**
     Multiple dependencies to targets defined above
    */
    .reactNativeTarget(
      name: .logger,
      dependencies: [.reactNativeDependencies, .jsi],
      path: "ReactCommon/logger"
    ),
    .reactNativeTarget(
      name: .mapbuffer,
      dependencies: [.reactNativeDependencies, .reactDebug],
      path: "ReactCommon/react/renderer/mapbuffer",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon"]
    ),
    .reactNativeTarget(
      name: .reactUtils,
      dependencies: [.reactNativeDependencies, .reactDebug, .jsi],
      path: "ReactCommon/react/utils",
      extraExcludes: ["tests"],
      linkerSettings: [.linkedFramework("CoreFoundation")],
      commonHeaderPathModules: ["ReactCommon"]
    ),
    /*.reactNativeTarget(
      name: .reactRuntimeExecutor,
      dependencies: [.jsi],
      path: "ReactCommon/runtimeexecutor",
      sources: ["ReactCommon/RuntimeExecutor-dummy.c"],
    ),*/
    .reactNativeTarget(
      name: .reactRendererDebug,
      dependencies: [.reactDebug],
      path: "ReactCommon/react/renderer/debug",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon"]
    ),

    /**
      JSInspectors
     */
    .reactNativeTarget(
      name: .reactJsInspector,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .jsi, .hermesIncludes, .reactJsInspectorTracing, .reactJsInspectorNetwork],
      path: "ReactCommon/jsinspector-modern",
      extraExcludes: ["tracing", "network", "tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor"]
    ),
    .reactNativeTarget(
      name: .reactJsInspectorTracing,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .jsi, .reactOSCompat],
      path: "ReactCommon/jsinspector-modern/tracing",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon"]
    ),
    .reactNativeTarget(
      name: .reactJsInspectorNetwork,
      dependencies: [.reactNativeDependencies],
      path: "ReactCommon/jsinspector-modern/network",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor"]
    ),

    /**
      CXX React
     */
    .reactNativeTarget(
      name: .reactCxxReact,
      dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .logger, .reactDebug, .reactJsInspector],
      path: "ReactCommon/cxxreact",
      extraExcludes: ["tests", "SampleCXXModule.cpp"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor", "ReactCommon/callinvoker"]
    ),

    /* This target compiles the same sources as React-hermes and fails if we add it to the target list above.
     .reactNativeTarget(
      name: .reactJsiTracing,
      dependencies: [.jsi, .hermesIncludes, .reactJsiExecutor],
      path: "ReactCommon/hermes/executor",
    ),*/
    
    
    /**
     JSI Executor, tooling
     */
    .reactNativeTarget(
      name: .reactJsiExecutor,
      dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .reactCxxReact, .reactJsInspector, .hermesIncludes],
      path: "ReactCommon/jsiexecutor",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor"]
    ),
    .reactNativeTarget(
      name: .reactJsiTooling,
      dependencies: [.reactNativeDependencies, .reactJsInspector, .reactJsInspectorTracing, .reactCxxReact, .jsi],
      path: "ReactCommon/jsitooling",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor"]
    ),

    /**
     React Hermes
     */
    .reactNativeTarget(
      name: .reactHermes,
      dependencies: [.reactNativeDependencies, .reactCxxReact, .reactJsiExecutor, .reactJsInspector, .reactJsInspectorTracing, .reactPerfLogger, .hermesIncludes, .hermesPrebuilt, .jsi],
      path: "ReactCommon/hermes",
      extraExcludes: ["inspector-modern/chrome/tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor"]
    ),


    /**
     Performance timeline
     */
    .reactNativeTarget(
      name: .reactPerformanceTimeline,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactJsInspectorTracing, .reactCxxReact, .reactPerfLogger],
      path: "ReactCommon/react/performance/timeline",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor"]
    ),
    /**
     Runtime scheduler
     */
    .reactNativeTarget(
      name: .reactRuntimeScheduler,
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactCxxReact, .reactPerfLogger, .reactPerformanceTimeline, .reactRendererConsistency, .reactUtils],
      path: "ReactCommon/react/renderer/runtimescheduler",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor", "ReactCommon/callinvoker"]
    ),

    /**
      Turbomodule binding
     */
    .reactNativeTarget(
      name: .reactTurboModuleBridging,
      dependencies: [.reactNativeDependencies, .reactPerfLogger, .reactCxxReact, .jsi, .logger],
      path: "ReactCommon/react/bridging",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker"]
    ),

    /**
     JS Error handler
     */
    .reactNativeTarget(
      name: .reactJsErrorHandler,
      dependencies: [.reactNativeDependencies, .jsi, .reactCxxReact, .reactFeatureFlags, .reactDebug, .reactTurboModuleBridging],
      path: "ReactCommon/jserrorhandler",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker"]
    ),

    /**
     Graphics
     */
    .reactNativeTarget(
      name: .reactGraphicsApple,
      dependencies: [.reactDebug, .jsi, .reactUtils],
      path: "ReactCommon/react/renderer/graphics/platform/ios",
      linkerSettings: [
        .linkedFramework("UIKit"),
        .linkedFramework("CoreGraphics")
      ],
      commonHeaderPathModules: ["ReactCommon"]
    ),
    .reactNativeTarget(
      name: .reactGraphics,
      dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactRendererDebug, .reactUtils, .reactGraphicsApple],
      path: "ReactCommon/react/renderer/graphics",
      extraExcludes: ["platform", "tests"],
      extraCSettings: [.headerSearchPath("./platform/ios/")],
      extraCxxSettings: [.headerSearchPath("./platform/ios/")],
      commonHeaderPathModules: ["ReactCommon"]
    ),

    /**
     Renderer CSS
     */
    .reactNativeTarget(
      name: .reactRendererCss,
      dependencies: [.reactDebug, .reactUtils],
      path: "ReactCommon",
      extraExcludes: ["react/renderer/css/tests"],
      sources: ["react/renderer/css"],
    ),

    /**
     Turbo-modules core
     */
    .reactNativeTarget(
      name: .reactTurboModuleCore,
      dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleBridging],
      path: "ReactCommon/react/nativemodule/core/ReactCommon",
      extraCSettings: [.headerSearchPath("../")],
      extraCxxSettings: [.headerSearchPath("../")],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker"]
    ),

    /**
     Typesafety
     */
    .reactNativeTarget(
      name: .rctTypesafety,
      dependencies: [.reactNativeDependencies],
      path: "Libraries/Typesafety",
      commonHeaderPathModules: ["ReactCommon"]
    ),

    /**
     React Core
     */
    .reactNativeTarget(
      name: .reactCore,
      dependencies: [.reactCxxReact, .reactPerfLogger, .jsi, .reactJsiExecutor, .reactUtils, .reactFeatureFlags, .reactRuntimeScheduler, .yoga, .reactJsInspector, .reactJsiTooling, .rctDeprecation, .reactCoreRCTWebsocket, .reactRuntimeApple],
      path: "React",
      extraExcludes: ["CoreModules", "DevSupport", "Fabric", "FBReactNativeSpec", "Tests", "Resources", "Inspector"],
      sources: [".", "Runtime/RCTHermesInstanceFactory.mm"],
      extraCSettings: [.headerSearchPath("./FBReactNativeSpec")],
      extraCxxSettings: [.headerSearchPath("./FBReactNativeSpec")]
    ),

    /**
     React Core modules
     */
    .reactNativeTarget(
      name: .reactCoreModules,
      dependencies: [.rctTypesafety, .reactRCTImage, .jsi, .reactJsInspector, .reactJsInspectorTracing, .reactFBReactNativeSpec, .reactTurboModuleBridging, .reactNativeModulesApple],
      path: "React/CoreModules",
    ),

    /**
     RCT-WebSocket
     */
    .reactNativeTarget(
      name: .reactCoreRCTWebsocket,
      dependencies: [.yoga],
      path: "Libraries/WebSocket",
      extraExcludes: ["Wrapper/Example"]
    ),

    /**
     Image manager
     */
    .reactNativeTarget(
      name: .reactImageManagerApple,
      dependencies: [.reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .reactImageManager, .reactRCTImage, .reactCore],
      path: "ReactCommon/react/renderer/imagemanager/platform/ios",
    ),

    .reactNativeTarget(
      name: .reactImageManager,
      dependencies: [.reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug],
      path: "ReactCommon/react/renderer/imagemanager",
      extraExcludes: ["platform", "tests"]
    ),

    .reactNativeTarget(
      name: .reactNativeModulesApple,
      dependencies: [.reactTurboModuleBridging, .reactCore, .reactCxxReact, .jsi, .reactFeatureFlags, .reactJsInspector],
      path: "ReactCommon/react/nativemodule/core/platform/ios",
      extraCSettings: [.headerSearchPath("../../")],
      extraCxxSettings: [.headerSearchPath("../../")]
    ),

    .reactNativeTarget(
      name: .reactRuntime,
      dependencies: [.jsi, .reactJsiExecutor, .reactCxxReact, .jsi, .reactJsErrorHandler, .reactPerformanceTimeline, .reactUtils, .reactFeatureFlags, .reactJsInspector, .reactJsiTooling, .reactHermes, .reactRuntimeScheduler],
      path: "ReactCommon/react/runtime",
      extraExcludes: ["tests", "iostests", "platform"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor", "ReactCommon/callinvoker"]
    ),

    .reactNativeTarget(
      name: .reactRuntimeApple,
      dependencies: [.jsi, .reactPerfLogger, .reactCxxReact, .rctDeprecation, .yoga, .reactRuntime],
      path: "ReactCommon/react/runtime/platform/ios",
      extraExcludes: ["ReactCommon/RCTJscInstance.mm"]
    ),


    /**
     Fabric modules
     */
    .reactNativeTarget(
      name: .reactFabric,
      dependencies: [.reactJsiExecutor, .rctTypesafety, .reactTurboModuleCore, .jsi, .logger, .reactCore, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .reactRendererDebug, .reactGraphics],
      path: "ReactCommon/react/renderer",
      extraExcludes: ["animations/tests", "attributedstring/tests", "core/tests", "components/root/tests", "components/view/tests", "components/legacyviewmanagerinterop/tests", "components/dom/tests", "mounting/tests", "observers/events/tests", "templateprocessor/tests", "uimanager/tests", "telemetry/tests", "leakchecker/tests", "css", "debug", "graphics", "imagemanager", "mapbuffer", "consistency"],
      sources: ["animations", "attributedstring", "core", "componentregistry", "components/root", "components/view", "components/legacyviewmanagerinterop", "components/dom", "scheduler", "imagemanager", "mounting", "observers/events", "templateprocessor", "renderer/telemetry", "uimanager/consistency", "uimanager", "leakchecker"]
    ),

    /*
     FBReactNativeSpec
     TODO: Generate/run codegen
     */
    .reactNativeTarget(
      name: .reactFBReactNativeSpec,
      dependencies: [.jsi, .reactJsiExecutor, .rctTypesafety, .reactCore],
      path: "React/FBReactNativeSpec",
    ),


    .reactNativeTarget(
      name: .reactRCTAnimation,
      dependencies: [.rctTypesafety, .jsi, .reactFeatureFlags],
      path: "Libraries/NativeAnimation",
    ),
    .reactNativeTarget(
      name: .reactRCTImage,
      dependencies: [.rctTypesafety, .jsi, .reactCore, .reactTurboModuleBridging, .reactTurboModuleCore],
      path: "Libraries/Image"
    ),
    .reactNativeTarget(
      name: .reactRCTText,
      dependencies: [.yoga],
      path: "Libraries/Text",
    ),
    .reactNativeTarget(
      name: .reactRCTLinking,
      dependencies: [.jsi],
      path: "Libraries/LinkingIOS",
    ),

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
      sources: ["dummy.c"]
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
    dependencies: [String] = [],
    path: String,
    extraExcludes: [String] = [],
    sources: [String]? = nil,
    publicHeadersPath: String? = ".",
    extraCSettings: [CSetting] = [],
    extraCxxSettings: [CXXSetting] = [],
    linkerSettings: [LinkerSetting] = [],
    commonHeaderPathModules: [String] = []
  ) -> Target {
    let dependencies = dependencies.map { Dependency.byNameItem(name: $0, condition: nil) }
    let excludes = defaultExcludeFor(module: .logger) + extraExcludes
    let numOfSlash = path.count { $0 == "/" }
    let cCommonHeaderPaths: [CSetting] = commonHeaderPathModules.map {
      commonModulePath(numOfSlash + 1, $0, CSetting.self)
    }
    let cxxCommonHeaderPaths : [CXXSetting] = commonHeaderPathModules.map {
      commonModulePath(numOfSlash + 1, $0, CXXSetting.self)
    }
    let cSettings = [cRNDepHeaderSearchPath(numOfSlash + 1)] + cCommonHeaderPaths + extraCSettings
    let cxxSettings = [cxxRNDepHeaderSearchPath(numOfSlash + 1), .unsafeFlags(["-std=c++20"])] + cxxCommonHeaderPaths + extraCxxSettings
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
