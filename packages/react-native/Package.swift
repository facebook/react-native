// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

let react = "React"
let hermesVersion = "0.79.1"

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
func generatedIncludePath<T>(_ depth: Int, _ path: String, _ settingType: T.Type) -> T {
    let prefix = (0..<depth).map { _ in "../" }.joined(separator: "")
    let fullPath = "\(prefix).build/includes/\(path)"
    if T.self == CSetting.self {
        return CSetting.headerSearchPath(fullPath) as! T
    } else if T.self == CXXSetting.self {
        return CXXSetting.headerSearchPath(fullPath) as! T
    } else {
        fatalError("Unsupported setting type")
    }
}

let package = Package(
  name: react,
  platforms: [.iOS(.v15)],
  products: [
    .library(
      name: react,
      type: .dynamic,
      targets: [
        .reactDebug,
        .jsi,
        .logger,
        .mapbuffer,
        .rctDeprecation,
        .yoga,
        .reactUtils,
        .reactFeatureFlags,
        .reactPerfLogger,
        .reactJsInspectorNetwork,
        .reactOSCompat,
        .reactRendererDebug,
        .reactRendererConsistency,
        .reactHermes,
        .reactJsiExecutor,
        .reactJsInspector,
        .reactJsInspectorTracing,
        .reactCxxReact,
        .reactCore,
        .reactCoreRCTWebsocket,
        .reactFabric,
        .reactRCTFabric,
        .reactFabricComponents,
        .reactFabricImage,
        .reactNativeDependencies,
        .hermesPrebuilt,
        .hermesIncludes,
        .reactJsiTooling,
        .reactPerformanceTimeline,
        .reactRuntimeScheduler,
        .rctTypesafety,
        .reactGraphics,
        .reactGraphicsApple,
        .reactImageManager,
        .reactImageManagerApple,
        .reactJsErrorHandler,
        .reactNativeModulesApple,
        .reactRuntime,
        .reactRuntimeApple,
        .reactRCTAnimation,
        .reactRCTImage,
        .reactRCTText,
        .reactRCTBlob,
        .reactRCTNetwork,
        .reactRCTLinking,
        .reactCoreModules,
        .reactTurboModuleBridging,
        .reactTurboModuleCore,
        .reactTurboModuleCoreDefaults,
        .reactTurboModuleCoreMicrotasks,
        .reactIdleCallbacksNativeModule,
        .reactFeatureflagsNativemodule,
        .reactNativeModuleDom,
        .reactAppDelegate,
        .reactCodegen,
      ]
    ),
  ],
  targets: [
    /**
     Without any dependencies
    */
    .reactNativeTarget(
      name: .rctDeprecation,
      path: "ReactApple/Libraries/RCTFoundation/RCTDeprecation"
    ),
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
      extraExcludes: ["jsi/test", "CMakeLists.txt", "jsi/CMakeLists.txt"],
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
      dependencies: [.reactNativeDependencies, .reactFeatureFlags, .jsi, .reactJsInspectorTracing, .reactJsInspectorNetwork],
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
    
    .reactNativeTarget(
      name: .reactTurboModuleCoreDefaults,
      dependencies: [.jsi, .reactJsiExecutor, .reactTurboModuleCore],
      path: "ReactCommon/react/nativemodule/defaults",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker", "ReactCommon/react/nativemodule/core", "React/FBReactNativeSpec"]
    ),
    
    .reactNativeTarget(
      name: .reactTurboModuleCoreMicrotasks,
      dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleBridging],
      path: "ReactCommon/react/nativemodule/microtasks",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker", "ReactCommon/react/nativemodule/core", "React/FBReactNativeSpec"]
    ),
    
    .reactNativeTarget(
      name: .reactIdleCallbacksNativeModule,
      dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleBridging],
      path: "ReactCommon/react/nativemodule/idlecallbacks",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker", "ReactCommon/runtimeexecutor", "React/FBReactNativeSpec", "ReactCommon/react/nativemodule/core"]
    ),
    
    .reactNativeTarget(
      name: .reactFeatureflagsNativemodule,
      dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleBridging],
      path: "ReactCommon/react/nativemodule/featureflags",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker", "ReactCommon/runtimeexecutor", "React/FBReactNativeSpec", "ReactCommon/react/nativemodule/core"]
    ),
    
    .reactNativeTarget(
      name: .reactNativeModuleDom,
      dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleBridging, .yoga],
      path: "ReactCommon/react/nativemodule/dom",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/callinvoker", "ReactCommon/runtimeexecutor", "React/FBReactNativeSpec", "ReactCommon/react/nativemodule/core", "ReactCommon/react/renderer/components/view/platform/cxx", "ReactCommon/react/renderer/graphics/platform/ios"]
    ),

    /**
     Typesafety
     */
    .reactNativeTarget(
      name: .rctTypesafety,
      dependencies: [.reactNativeDependencies],
      path: "Libraries/Typesafety",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "Libraries/FBLazyVector"],
      extraGeneratedIncludePaths: ["Base", "ReactApple", "Views"]
    ),

    /**
     RCT-WebSocket
     */
    .reactNativeTarget(
      name: .reactCoreRCTWebsocket,
      dependencies: [.yoga],
      path: "Libraries/WebSocket",
      commonHeaderPathModules: ["ReactCommon/yoga"],
      extraGeneratedIncludePaths: ["WebSocket", "Base", "Views", "RefreshControl"]
    ),

    /**
     React-Runtime
     */
    .reactNativeTarget(
      name: .reactRuntime,
      dependencies: [.jsi, .reactJsiExecutor, .reactCxxReact, .reactJsErrorHandler, .reactPerformanceTimeline, .reactUtils, .reactFeatureFlags, .reactJsInspector, .reactJsiTooling, .reactHermes, .reactRuntimeScheduler],
      path: "ReactCommon/react/runtime",
      extraExcludes: ["tests", "iostests", "platform"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/runtimeexecutor", "ReactCommon/callinvoker"]
    ),

    /**
     React-runtime-apple
     */
    .reactNativeTarget(
      name: .reactRuntimeApple,
      dependencies: [.jsi, .reactPerfLogger, .reactCxxReact, .rctDeprecation, .yoga, .reactRuntime, .reactRCTFabric, .reactCoreModules],
      path: "ReactCommon/react/runtime/platform/ios",
      extraExcludes: ["ReactCommon/RCTJscInstance.mm"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/react/renderer/graphics/platform/cxx", "React", "ReactCommon/yoga", "ReactCommon/runtimeexecutor", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/react/nativemodule/core", "ReactCommon/callinvoker", "React/FBReactNativeSpec", "React/Fabric", "Libraries/FBLazyVector"],
      extraGeneratedIncludePaths: ["Base", "CxxBridge", "CoreModules", "ReactApple", "CxxModule", "Views", "Modules", "Required", "TypeSafety", "Fabric", "Fabric_Surface", "Fabric_Mounting", "Surface", "Surface_HostingView", "I18n", "DevSupport", "Inspector", "CxxUtils"]
    ),

    /**
     React Core
     */
    .reactNativeTarget(
      name: .reactCore,
      dependencies: [.reactCxxReact, .reactPerfLogger, .jsi, .reactJsiExecutor, .reactUtils, .reactFeatureFlags, .reactRuntimeScheduler, .yoga, .reactJsInspector, .reactJsiTooling, .rctDeprecation, .reactCoreRCTWebsocket, .reactRCTImage, .reactNativeModulesApple, .reactRCTText, .reactRCTBlob, .reactRCTAnimation, .reactRCTNetwork, .reactFabric],
      path: "React",
      extraExcludes: ["Fabric", "Tests", "Resources", "Runtime/RCTJscInstanceFactory.mm", "I18n/strings", "CxxBridge/JSCExecutorFactory.mm", "CoreModules"],
      sources: [".", "Runtime/RCTHermesInstanceFactory.mm"],
      extraCSettings: [.headerSearchPath("./Base/")],
      extraCxxSettings: [.headerSearchPath("./Base/")],
      linkerSettings: [.linkedFramework("CoreServices")],
      commonHeaderPathModules: ["ReactCommon/yoga", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/callinvoker", "ReactCommon", "React/FBReactNativeSpec", "React/I18n", "React/Profiler", "ReactCommon/runtimeexecutor", "ReactCommon/react/runtime/platform/ios", "ReactCommon/react/renderer/components/textinput/platform/ios", "ReactCommon/react/renderer/graphics/platform/ios", "Libraries/FBLazyVector", "ReactCommon/react/renderer/components/view/platform/cxx", "ReactCommon/react/renderer/textlayoutmanager/platform/ios", "ReactCommon/react/renderer/imagemanager/platform/cxx", "ReactCommon/react/renderer/imagemanager/platform/ios", "ReactCommon/hermes"],
      extraGeneratedIncludePaths: ["WebSocket", "Base", "Views", "Modules", "ReactApple", "Surface", "ScrollView", "RefreshControl", "RefreshControl", "Modules", "Surface_SurfaceHostingView", "ScrollView", "Views", "Base", "Surface", "I18n", "CxxModule", "CxxUtils", "Profiler", "CxxBridge", "CoreModules", "CoreModules", "DevSupport", "Inspector", "DevSupport", "Inspector", "Fabric_Surface", "Fabric_Mounting", "Fabric_Mounting_ComponentViews_View", "Fabric_Mounting_ComponentViews", "Text_TextInput", "Fabric", "Fabric_Mounting_ComponentViews", "Fabric_Mounting_ComponentViews_ScrollView", "Fabric_Mounting_ComponentViews_Text", "Fabric_Mounting_ComponentViews_Image", "Fabric", "Fabric_Utils", "Image", "Text_TextInput_SingleLine", "Text_TextInput_MultiLine", "Fabric_Utils", "NativeAnimation", "Fabric_Mounting_ComponentViews_LegacyViewManagerInterop", "Fabric_Mounting_ComponentViews_Root", "Fabric_Mounting_ComponentViews_TextInput", "Fabric_Mounting_ComponentViews_UnimplementedView", "Required", "TypeSafety", "Hermes_executor"]
    ),
        
    /**
     Fabric
     */
    .reactNativeTarget(
      name: .reactFabric,
      dependencies: [.reactJsiExecutor, .rctTypesafety, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .reactRendererDebug, .reactGraphics],
      path: "ReactCommon/react/renderer",
      extraExcludes: ["animations/tests", "attributedstring/tests", "core/tests", "components/view/tests", "components/view/platform/android", "mounting/tests", "uimanager/tests", "telemetry/tests", "css", "debug", "graphics", "imagemanager", "mapbuffer", "consistency", "uimanager/consistency/tests", "components/inputaccessory", "components/modal", "components/rncore", "components/safeareaview", "components/scrollview", "components/text", "components/textinput", "components/textinput/platform/ios/", "components/unimplementedview", "components/root/tests"],
      sources: ["animations", "attributedstring", "core", "componentregistry", "componentregistry/native", "components/root", "components/view", "components/scrollview", "components/legacyviewmanagerinterop", "dom", "scheduler", "mounting", "observers/events", "telemetry", "consistency", "leakchecker", "uimanager", "uimanager/consistency"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga","ReactCommon/react/renderer/components/view", "ReactCommon/react/renderer/components/view/platform/cxx", "ReactCommon/RuntimeExecutor", "ReactCommon/callinvoker", "ReactCommon/react/renderer/components/text", "ReactCommon/react/renderer/imagemanager/platform/ios"],
      extraGeneratedIncludePaths: ["Base", "ReactApple", "Views", "CxxUtils", "Modules", "CoreModules"]
    ),
    
    .reactNativeTarget(
      name: .reactRCTFabric,
      dependencies: [.reactCore, .reactRCTImage, .yoga, .reactRCTText, .jsi, .reactFabricComponents, .reactGraphics, .reactImageManager, .reactDebug, .reactUtils, .reactPerformanceTimeline, .reactRendererDebug, .reactRendererConsistency, .reactRuntimeScheduler, .reactRCTAnimation, .reactJsInspector, .reactJsInspectorNetwork, .reactJsInspectorTracing, .reactFabric, .reactFabricImage],
      path: "React/Fabric",
      extraExcludes: [],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/RuntimeExecutor", "ReactCommon/callinvoker", "ReactCommon/react/renderer/components/view/platform/cxx", "ReactCommon/react/renderer/components/textinput/platform/ios", "ReactCommon/react/renderer/textlayoutmanager/platform/ios", "ReactCommon/react/renderer/imagemanager/platform/ios", "ReactCommon/react/renderer/legacyviewmanagerinterop"],
      extraGeneratedIncludePaths: ["Base", "Base_Surface", "ReactApple", "Modules", "CxxUtils", "Fabric", "Fabric_Surface", "Fabric_Mounting", "Fabric_Mounting_ComponentViews_View", "Fabric_Mounting_ComponentViews", "Fabric_Mounting_ComponentViews_ScrollView", "Fabric_Mounting_ComponentViews_LegacyViewManagerInterop", "Fabric_Mounting_ComponentViews_Root", "Fabric_Mounting_ComponentViews_Image", "Fabric_Mounting_ComponentViews_Text", "Fabric_Mounting_ComponentViews_TextInput", "Fabric_Mounting_ComponentViews_UnimplementedView", "Fabric_Utils", "Views", "Views_ScrollView", "Views_RefreshControl", "Text_TextInput", "Text_TextInput_Singleline", "Text_TextInput_Multiline", "Image", "NativeAnimation", "I18n"]
    ),
    
    .reactNativeTarget(
      name: .reactFabricComponents,
      dependencies: [.reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging],
      path: "ReactCommon/react/renderer",
      extraExcludes: ["components/view/platform/android", "components/scrollview/tests", "components/scrollview/platform/android", "components/textinput/platform/android", "components/text/tests", "textlayoutmanager/tests", "textlayoutmanager/platform/android", "textlayoutmanager/platform/cxx"],
      sources: ["components/inputaccessory", "components/modal", "components/rncore", "components/safeareaview", "components/scrollview", "components/text", "components/textinput", "components/textinput/platform/ios/", "components/unimplementedview", "textlayoutmanager", "textlayoutmanager/platform/ios"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/react/renderer/components/view/platform/cxx", "ReactCommon/react/renderer/components/textinput/platform/ios", "ReactCommon/react/renderer/components/textinput/platform/ios", "ReactCommon/react/renderer/textlayoutmanager/platform/ios", "ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager", "ReactCommon/react/renderer/textlayoutmanager"],
      extraGeneratedIncludePaths: ["Base", "Views", "Text_Text"]
    ),
    
    .reactNativeTarget(
      name: .reactFabricImage,
      dependencies: [.reactFabric, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactTurboModuleBridging, .reactImageManagerApple],
      path: "ReactCommon/react/renderer/components/image",
      extraExcludes: ["tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/react/renderer/components/view/platform/cxx", "ReactCommon/react/renderer/imagemanager/platform/ios"],
      extraGeneratedIncludePaths: ["Base"]
    ),

    /**
     Image manager
     */
    .reactNativeTarget(
      name: .reactImageManagerApple,
      dependencies: [.reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .reactImageManager, .reactRCTImage, .reactCore, .yoga],
      path: "ReactCommon/react/renderer/imagemanager/platform/ios",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga"],
      extraGeneratedIncludePaths: ["Base", "Image", "ReactApple", "Views"]
    ),

    .reactNativeTarget(
      name: .reactImageManager,
      dependencies: [.reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .yoga],
      path: "ReactCommon/react/renderer/imagemanager",
      extraExcludes: ["platform", "tests"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga"],
      extraGeneratedIncludePaths: []
    ),

    .reactNativeTarget(
      name: .reactNativeModulesApple,
      dependencies: [.reactTurboModuleBridging, .reactCxxReact, .jsi, .reactFeatureFlags, .reactJsInspector],
      path: "ReactCommon/react/nativemodule/core/platform/ios",
      extraCSettings: [.headerSearchPath("../../")],
      extraCxxSettings: [.headerSearchPath("../../")],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/RuntimeExecutor", "ReactCommon/callinvoker"],
      extraGeneratedIncludePaths: ["Base", "ReactApple", "Views", "CxxModule"]
    ),

    .reactNativeTarget(
      name: .reactRCTAnimation,
      dependencies: [.rctTypesafety, .jsi, .reactFeatureFlags],
      path: "Libraries/NativeAnimation",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "React/FBReactNativeSpec", "Libraries/FBLazyVector", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/callinvoker"],
      extraGeneratedIncludePaths: ["Base", "NativeAnimation", "NativeAnimation_Nodes", "NativeAnimation_Drivers", "ReactApple", "Modules", "Views", "Required", "TypeSafety"]
    ),
    .reactNativeTarget(
      name: .reactRCTImage,
      dependencies: [.rctTypesafety, .jsi, .reactTurboModuleBridging, .reactTurboModuleCore],
      path: "Libraries/Image",
      linkerSettings: [.linkedFramework("Accelerate")],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/callinvoker", "React/FBReactNativeSpec", "Libraries/FBLazyVector"],
      extraGeneratedIncludePaths: ["Base", "Image", "Animation", "Views", "ReactApple", "Required", "TypeSafety", "Network", "Modules", "CoreModules"],
    ),
    .reactNativeTarget(
      name: .reactRCTText,
      dependencies: [.yoga],
      path: "Libraries/Text",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/callinvoker", "React/FBReactNativeSpec", "Libraries/FBLazyVector"],
      extraGeneratedIncludePaths: ["Base", "Text", "Text_Text", "Text_VirtualText", "Text_VirtualText", "Text_RawText", "Text_BaseText", "Text_BaseText", "Text_TextInput", "Text_TextInput", "Text_TextInput_SingleLine", "Text_TextInput_Multiline", "Animation", "Views", "ReactApple", "Required", "TypeSafety", "Network", "Modules", "CoreModules", "Views_ScrollView"]
    ),
    .reactNativeTarget(
      name: .reactRCTBlob,
      dependencies: [.yoga, .jsi],
      path: "Libraries/Blob",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/callinvoker", "React/FBReactNativeSpec", "Libraries/FBLazyVector"],
      extraGeneratedIncludePaths: ["Base", "Blob", "Animation", "Views", "ReactApple", "Required", "TypeSafety", "Modules", "CoreModules", "Network"]
    ),

    .reactNativeTarget(
      name: .reactRCTNetwork,
      dependencies: [.yoga, .jsi],
      path: "Libraries/Network",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/callinvoker", "React/FBReactNativeSpec", "Libraries/FBLazyVector"],
      extraGeneratedIncludePaths: ["Base", "Network", "ReactApple", "Required", "TypeSafety", "Modules", "CoreModules", "Views"]
    ),

    .reactNativeTarget(
      name: .reactCoreModules,
      dependencies: [.jsi],
      path: "React/CoreModules",
      extraExcludes: ["PlatformStubs/RCTStatusBarManager.mm"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "React/FBReactNativeSpec", "Libraries/FBLazyVector", "ReactCommon/RuntimeExecutor", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/react/nativemodule/core", "ReactCommon/callinvoker"],
      extraGeneratedIncludePaths: ["Base", "ReactApple", "Required", "TypeSafety", "CoreModules", "Views", "Modules", "Surface", "Surface_SurfaceHostingView", "Profiler", "DevSupport", "Inspector"]
    ),

    .reactNativeTarget(
      name: .reactAppDelegate,
      dependencies: [.jsi, .reactJsiExecutor, .reactRuntime, .reactRCTImage, .reactHermes, .reactCore, .reactFabric, .reactTurboModuleCore],
      path: "Libraries/AppDelegate",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/RuntimeExecutor", "ReactCommon/callinvoker", "ReactCommon/react/renderer/graphics/platform/ios", "ReactCommon/react/runtime/platform/ios", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/hermes", "ReactCommon/jsiexecutor"],
      extraGeneratedIncludePaths: ["Base", "ReactApple", "Views", "CxxUtils", "Modules", "Fabric", "CoreModules", "CxxBridge", "Fabric_Mounting", "Fabric_Surface", "Surface", "Image", "Network", "Surface_SurfaceHostingView", "Fabric_Utils", "Runtime", "Hermes_Executor"]
    ),

    .reactNativeTarget(
      name: .reactCodegen,
      dependencies: [.reactJsiExecutor, .rctTypesafety, .reactCore, .jsi, .reactTurboModuleCore, .reactTurboModuleBridging, .reactRuntimeApple, .reactGraphics, .reactRendererDebug, .reactFabric, .reactDebug, .reactAppDelegate],
      path: ".build/codegen/build/generated",
      extraExcludes: ["ios/RCTAppDependencyProvider.h", "ios/RCTAppDependencyProvider.mm"],
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/yoga", "ReactCommon/RuntimeExecutor", "ReactCommon/callinvoker", "ReactCommon/react/renderer/graphics/platform/ios", "ReactCommon/react/runtime/platform/ios", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios", "ReactCommon/hermes", "ReactCommon/jsiexecutor"],
      extraGeneratedIncludePaths: ["Base", "ReactApple", "Views", "CxxUtils", "Modules", "Fabric", "CoreModules", "CxxBridge", "Fabric_Mounting", "Fabric_Surface", "Surface", "Image", "Network", "Surface_SurfaceHostingView", "Fabric_Utils", "Runtime", "Hermes_Executor", "ReactCodegen"]
    ),

    .reactNativeTarget(
      name: .reactRCTLinking,
      dependencies: [.jsi],
      path: "Libraries/LinkingIOS",
      commonHeaderPathModules: ["ReactCommon", "ReactCommon/callinvoker", "React/FBReactNativeSpec", "Libraries/FBLazyVector", "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios"],
      extraGeneratedIncludePaths: ["Base", "ReactApple", "Modules", "LinkingIOS", "Required", "Typesafety"]
    ),

    .binaryTarget(
      name: .reactNativeDependencies,
      path: "third-party/ReactNativeDependencies.xcframework"
    ),
    .binaryTarget(
      name: .hermesPrebuilt,
      path: ".build/artifacts/hermes-\(hermesVersion)-release/destroot/Library/Frameworks/universal/hermes.xcframework",
    ),
    .target(
      name: .hermesIncludes,
      path: ".build/artifacts/hermes-\(hermesVersion)-release/destroot/",
      sources: ["dummy.c"]
    )
  ]
)

extension String {
  static let reactDebug = "React-debug"
  static let jsi = "React-jsi"
  static let logger = "React-logger"
  static let mapbuffer = "React-Mapbuffer"

  static let rctDeprecation = "RCT-Deprecation"
  static let yoga = "Yoga"
  static let reactUtils = "React-utils"
  static let reactFeatureFlags = "React-featureflags"
  static let reactPerfLogger = "React-perflogger"
  static let reactJsInspectorNetwork = "React-jsinspectornetwork"
  static let reactRuntimeExecutor = "React-runtimeexecutor"
  static let reactOSCompat = "React-oscompat"
  static let reactCallInvoker = "React-callinvoker"
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
  static let reactFabric = "React-Fabric"
  static let reactRCTFabric = "React-RCTFabric"
  static let reactFabricComponents = "React-FabricComponents"
  static let reactFabricImage = "React-FabricImage"

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
  static let reactRCTBlob = "React-RCTBlob"
  static let reactRCTNetwork = "React-RCTNetwork"
  static let reactRCTActionSheet = "React-RCTActionSheet" // Empty target
  static let reactRCTLinking = "React-RCTLinking"
  static let reactCoreModules = "React-CoreModules"
  static let reactTurboModuleBridging = "ReactCommon/turbomodule/bridging"
  static let reactTurboModuleCore = "ReactCommon/turbomodule/core"
  static let reactTurboModuleCoreDefaults = "ReactCommon/turbomodule/core/defaults"
  static let reactTurboModuleCoreMicrotasks = "ReactCommon/turbomodule/core/microtasks"
  static let reactIdleCallbacksNativeModule = "React-idlecallbacksnativemodule"
  static let reactFeatureflagsNativemodule = "React-featureflagsnativemodule"
  static let reactNativeModuleDom = "React-domnativemodule"
  static let reactAppDelegate = "React-RCTAppDelegate"
  static let reactCodegen = "React-Codegen"
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
    commonHeaderPathModules: [String] = [],
    extraGeneratedIncludePaths: [String] = []
  ) -> Target {
    let dependencies = dependencies.map { Dependency.byNameItem(name: $0, condition: nil) }
    let excludes = extraExcludes
    let numOfSlash = path.count { $0 == "/" }

    let cCommonHeaderPaths: [CSetting] = commonHeaderPathModules.map {
      commonModulePath(numOfSlash + 1, $0, CSetting.self)
    } + extraGeneratedIncludePaths.map {
      generatedIncludePath(numOfSlash + 1, $0, CSetting.self)
    } + extraGeneratedIncludePaths.map {
      generatedIncludePath(numOfSlash + 1, $0 + "/React", CSetting.self)
    }

    let cxxCommonHeaderPaths : [CXXSetting] = commonHeaderPathModules.map {
      commonModulePath(numOfSlash + 1, $0, CXXSetting.self)
    } + extraGeneratedIncludePaths.map {
      generatedIncludePath(numOfSlash + 1, $0, CXXSetting.self)
    } + extraGeneratedIncludePaths.map {
      generatedIncludePath(numOfSlash + 1, $0 + "/React", CXXSetting.self)
    }

    let cSettings = [
      cRNDepHeaderSearchPath(numOfSlash + 1),
      .define("DEBUG", .when(configuration: .debug)),
      .define("USE_HERMES", to: "1"),
      // TODO: Why doesn't it pick up this when DEBUG is set??
      .define("RCT_ENABLE_INSPECTOR", to: "1", .when(configuration: .debug))
    ] +
    cCommonHeaderPaths +
    extraCSettings

    let cxxSettings = [
      cxxRNDepHeaderSearchPath(numOfSlash + 1),
      .unsafeFlags(["-std=c++20"]),
      .define("DEBUG", .when(configuration: .debug)),
      .define("USE_HERMES", to: "1"),
      // TODO: Why doesn't it pick up this when DEBUG is set??
      .define("RCT_ENABLE_INSPECTOR", to: "1", .when(configuration: .debug))
    ] +
    cxxCommonHeaderPaths +
    extraCxxSettings

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
