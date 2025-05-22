// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

/**
 This is the `Package.swift` file that allows to build React Native core using Swift PM.
 To build React Native, you need to follow these steps:
 1. inside the `react-native` root folder, run `yarn install`
 2. `cd packages/react-native`
 3. `RNDEP_VERSION=nightly HERMES_VERSION=nightly node scripts/prebuild-ios`
 4. `open Package.swift`
 5. Build in Xcode.

 The Package.swift is structured as it follow:
 - Constants declaration
 - Prebuilt dependencies: we define the prebuilt React Native depends upon - Hermes and ReactNativeDependencies
 - Target definition: we define all the sub targets that compose React Native
     - For each target, we added the equivalent podspec they represents. This should help you porting changes from podspec to SwiftPM
 - The list of all the target: so we can iterate over them.
 - The package definition: this is the actual definition of React
 - A set of utility classes that help us to abstract common details.
 */

// MARK: Constants declaration
let react = "React"
let RuntimeExecutorPath = "ReactCommon/runtimeexecutor"
let CallInvokerPath = "ReactCommon/callinvoker"
let ReactFBReactNativeSpecPath = "React/FBReactNativeSpec"
let FBLazyVectorPath = "Libraries/FBLazyVector"

// MARK: Prebuilt Dependencies declaration
let reactNativeDependencies = BinaryTarget(
  name: .reactNativeDependencies,
  path: "third-party/ReactNativeDependencies.xcframework",
  searchPaths: ["third-party/ReactNativeDependencies.xcframework/Headers"]
)

let hermesPrebuilt = BinaryTarget(
  name: .hermesPrebuilt,
  path: ".build/artifacts/hermes/destroot/Library/Frameworks/universal/hermes.xcframework",
  searchPaths: [".build/artifacts/hermes/destroot/include"]
)

// MARK: React Native targets declaration
/// RCTDeprecation.podspec
let rctDeprecation = RNTarget(
  name: .rctDeprecation,
  path: "ReactApple/Libraries/RCTFoundation/RCTDeprecation",
  searchPaths: ["ReactApple"]
)

// To avoid having to delete the cmake folder at the same level we provide a "wrong" public header path and instead include it using header search paths.
/// Yoga.podspec
let yoga = RNTarget(
  name: .yoga,
  path: "ReactCommon/yoga",
  searchPaths: ["ReactCommon/yoga"],
  publicHeadersPath: "yoga"
)

// React-oscompat.podspec
let reactOSCompat = RNTarget(
  name: .reactOSCompat,
  path: "ReactCommon/oscompat",
  searchPaths: ["ReactCommon"]
)

// React-rendererconsistency.podspec
let reactRendererConsistency = RNTarget(
  name: .reactRendererConsistency,
  path: "ReactCommon/react/renderer/consistency",
  searchPaths: ["ReactCommon"]
)

// React-debug.podspec
let reactDebug = RNTarget(
  name: .reactDebug,
  path: "ReactCommon/react/debug",
  searchPaths: ["ReactCommon"],
  dependencies: [.reactNativeDependencies]
)
/// React-jsi.podspec
let jsi = RNTarget(
  name: .jsi,
  path: "ReactCommon/jsi",
  searchPaths: ["ReactCommon"],
  excludedPaths: ["jsi/test", "CMakeLists.txt", "jsi/CMakeLists.txt"],
  dependencies: [.reactNativeDependencies]
)

/// React-utils.podspec
let reactUtils = RNTarget(
  name: .reactUtils,
  path: "ReactCommon/react/utils",
  searchPaths: ["ReactCommon", "ReactCommon/react/utils/platform/ios"],
  linkedFrameworks: ["CoreFoundation"],
  excludedPaths: ["tests", "platform/android", "platform/cxx", "platform/windows"],
  dependencies: [.reactDebug, .jsi, .reactNativeDependencies]
)

/// React-featureflags.podspec
let reactFeatureFlags = RNTarget(
  name: .reactFeatureFlags,
  path: "ReactCommon/react/featureflags",
  searchPaths: ["ReactCommon"],
  excludedPaths: ["tests"]
)

/// React-perflogger.podspec
let reactPerfLogger = RNTarget(
  name: .reactPerfLogger,
  path: "ReactCommon/reactperflogger",
  excludedPaths: ["fusebox"]
)

/// React-logger.podspec
let logger = RNTarget(
  name: .logger,
  path: "ReactCommon/logger",
  dependencies: [.jsi, .reactNativeDependencies]
)

/// React-Mapbuffer.podspec
let mapbuffer = RNTarget(
  name: .mapbuffer,
  path: "ReactCommon/react/renderer/mapbuffer",
  excludedPaths: ["tests"],
  dependencies: [.reactDebug, .reactNativeDependencies]
)

/// React-rendererdebug.podspec
let reactRendererDebug = RNTarget(
  name: .reactRendererDebug,
  path: "ReactCommon/react/renderer/debug",
  searchPaths: ["ReactCommon"],
  excludedPaths: ["tests"],
  dependencies: [.reactDebug, .reactNativeDependencies]
)

/// React-jsinspectortracing.podspec
let reactJsInspectorTracing = RNTarget(
  name: .reactJsInspectorTracing,
  path: "ReactCommon/jsinspector-modern/tracing",
  searchPaths: ["ReactCommon"],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .jsi, .reactOSCompat]
)

/// React-jsinspectornetwork.podspec
let reactJsInspectorNetwork = RNTarget(
  name: .reactJsInspectorNetwork,
  path: "ReactCommon/jsinspector-modern/network",
  searchPaths: ["ReactCommon", RuntimeExecutorPath],
  dependencies: [.reactNativeDependencies],
  defines: [
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED", to: "1", .when(configuration: BuildConfiguration.debug)),
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY", to: "1", .when(configuration: BuildConfiguration.debug)),
  ]
)

/// React-jsinspector.podspec
let reactJsInspector = RNTarget(
  name: .reactJsInspector,
  path: "ReactCommon/jsinspector-modern",
  searchPaths: ["ReactCommon", RuntimeExecutorPath],
  excludedPaths: ["tracing", "network", "tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .jsi, .reactJsInspectorTracing, .reactJsInspectorNetwork],
  defines: [
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED", to: "1", .when(configuration: BuildConfiguration.debug)),
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY", to: "1", .when(configuration: BuildConfiguration.debug)),
  ]
)

/// React-cxxreact.podspec
let reactCxxReact = RNTarget(
  name: .reactCxxReact,
  path: "ReactCommon/cxxreact",
  searchPaths: ["ReactCommon", RuntimeExecutorPath, CallInvokerPath],
  excludedPaths: ["tests", "SampleCXXModule.cpp"],
  dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .logger, .reactDebug, .reactJsInspector]
)

/// React-jsiexecutor.podspec
let reactJsiExecutor = RNTarget(
  name: .reactJsiExecutor,
  path: "ReactCommon/jsiexecutor",
  searchPaths: ["ReactCommon", RuntimeExecutorPath],
  dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .reactCxxReact, .reactJsInspector]
)

/// React-jsitooling.podspec
let reactJsiTooling = RNTarget(
  name: .reactJsiTooling,
  path: "ReactCommon/jsitooling",
  searchPaths: ["ReactCommon", RuntimeExecutorPath],
  dependencies: [.reactNativeDependencies, .reactJsInspector, .reactJsInspectorTracing, .reactCxxReact, .jsi]
)

/// React-hermes.podspec
let reactHermes = RNTarget(
  name: .reactHermes,
  path: "ReactCommon/hermes",
  searchPaths: ["ReactCommon", RuntimeExecutorPath],
  excludedPaths: ["inspector-modern/chrome/tests"],
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactJsiExecutor, .reactJsInspector, .reactJsInspectorTracing, .reactPerfLogger, .hermesPrebuilt, .jsi],
  defines: [
    CXXSetting.define("HERMES_ENABLE_DEBUGGER", to: "1", .when(configuration: BuildConfiguration.debug))
  ]
)

/// React-performancetimeline.podspec
let reactPerformanceTimeline = RNTarget(
  name: .reactPerformanceTimeline,
  path: "ReactCommon/react/performance/timeline",
  searchPaths: ["ReactCommon", RuntimeExecutorPath],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactJsInspectorTracing, .reactCxxReact, .reactPerfLogger]
)

/// React-runtimescheduler.podspec
let reactRuntimeScheduler = RNTarget(
  name: .reactRuntimeScheduler,
  path: "ReactCommon/react/renderer/runtimescheduler",
  searchPaths: ["ReactCommon", RuntimeExecutorPath, CallInvokerPath],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactCxxReact, .reactPerfLogger, .reactPerformanceTimeline, .reactRendererConsistency, .reactUtils]
)

/// ReactCommon.podspec
/// This target represent the ReactCommon/turbomodule/bridging subspec
let reactTurboModuleBridging = RNTarget(
  name: .reactTurboModuleBridging,
  path: "ReactCommon/react/bridging",
  searchPaths: ["ReactCommon", CallInvokerPath],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactPerfLogger, .reactCxxReact, .jsi, .logger]
)

/// React-jserrorhandler.podspec
let reactJsErrorHandler = RNTarget(
  name: .reactJsErrorHandler,
  path: "ReactCommon/jserrorhandler",
  searchPaths: ["ReactCommon", CallInvokerPath],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .jsi, .reactCxxReact, .reactFeatureFlags, .reactDebug, .reactTurboModuleBridging]
)

/// React-graphicsApple
/// This represents the React-graphicsApple BUCK module
let reactGraphicsApple = RNTarget(
  name: .reactGraphicsApple,
  path: "ReactCommon/react/renderer/graphics/platform/ios",
  searchPaths: ["ReactCommon"],
  linkedFrameworks: ["UIKit", "CoreGraphics"],
  dependencies: [.reactDebug, .jsi, .reactUtils, .reactNativeDependencies]
)

/// React-graphics.podspec
let reactGraphics = RNTarget(
  name: .reactGraphics,
  path: "ReactCommon/react/renderer/graphics",
  searchPaths: ["ReactCommon"],
  excludedPaths: ["platform", "tests"],
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactRendererDebug, .reactUtils, .reactGraphicsApple]
)

/// ReactCommon.podspec
/// This target represent the ReactCommon/turbomodule/core subspec
let reactTurboModuleCore = RNTarget(
  name: .reactTurboModuleCore,
  path: "ReactCommon/react/nativemodule/core",
  searchPaths: ["ReactCommon", CallInvokerPath, "ReactCommon/react/nativemodule/core", "ReactCommon/react/nativemodule/core/platform/ios"],
  excludedPaths: ["platform/android", "iostests"],
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleBridging, .yoga]
)

/// React-defaultsnativemodule.podspec
let reactTurboModuleCoreDefaults = RNTarget(
  name: .reactTurboModuleCoreDefaults,
  path: "ReactCommon/react/nativemodule/defaults",
  searchPaths: ["ReactCommon", CallInvokerPath, ReactFBReactNativeSpecPath],
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactTurboModuleCore]
)

/// React-microtasknativemodule.podspec
let reactTurboModuleCoreMicrotasks = RNTarget(
  name: .reactTurboModuleCoreMicrotasks,
  path: "ReactCommon/react/nativemodule/microtasks",
  searchPaths: ["ReactCommon", CallInvokerPath, ReactFBReactNativeSpecPath],
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore]
)

/// React-idlecallback.podspec
let reactIdleCallbacksNativeModule = RNTarget(
  name: .reactIdleCallbacksNativeModule,
  path: "ReactCommon/react/nativemodule/idlecallbacks",
  searchPaths: ["ReactCommon", CallInvokerPath, RuntimeExecutorPath, ReactFBReactNativeSpecPath],
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore]
)

/// React-featureflagnativemodule.podspec
let reactFeatureflagsNativemodule = RNTarget(
  name: .reactFeatureflagsNativemodule,
  path: "ReactCommon/react/nativemodule/featureflags",
  searchPaths: ["ReactCommon", CallInvokerPath, RuntimeExecutorPath, ReactFBReactNativeSpecPath],
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore]
)

/// React-domnativemodule.podspec
let reactNativeModuleDom = RNTarget(
  name: .reactNativeModuleDom,
  path: "ReactCommon/react/nativemodule/dom",
  searchPaths: ["ReactCommon", CallInvokerPath, RuntimeExecutorPath, ReactFBReactNativeSpecPath],
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore, .yoga, .reactGraphicsApple, .reactFabric]
)

/// RCTTypeSafety.podspec
let rctTypesafety = RNTarget(
  name: .rctTypesafety,
  path: "Libraries/Typesafety",
  searchPaths: ["ReactCommon", FBLazyVectorPath],
  dependencies: [.reactNativeDependencies, .yoga]
)

/// New target to map Libraries/WebSocket
let reactCoreRCTWebsocket = RNTarget(
  name: .reactCoreRCTWebsocket,
  path: "Libraries/WebSocket",
  dependencies: [.yoga, .reactNativeDependencies]
)

/// React-CoreModules.podspec
let reactCoreModules = RNTarget(
  name: .reactCoreModules,
  path: "React/CoreModules",
  searchPaths: ["ReactCommon", ReactFBReactNativeSpecPath, FBLazyVectorPath, RuntimeExecutorPath, CallInvokerPath],
  excludedPaths: ["PlatformStubs/RCTStatusBarManager.mm"],
  dependencies: [.reactNativeDependencies, .jsi, .yoga, .reactTurboModuleCore]
)

/// React-runtimeCore.podspec
/// React-runtimeHermes.podspec
let reactRuntime = RNTarget(
  name: .reactRuntime,
  path: "ReactCommon/react/runtime",
  searchPaths: ["ReactCommon", RuntimeExecutorPath, CallInvokerPath],
  excludedPaths: ["tests", "iostests", "platform"],
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactCxxReact, .reactJsErrorHandler, .reactPerformanceTimeline, .reactUtils, .reactFeatureFlags, .reactJsInspector, .reactJsiTooling, .reactHermes, .reactRuntimeScheduler, .hermesPrebuilt]
)

/// React-runtimeApple.podspec
let reactRuntimeApple = RNTarget(
  name: .reactRuntimeApple,
  path: "ReactCommon/react/runtime/platform/ios",
  searchPaths: ["ReactCommon", RuntimeExecutorPath, CallInvokerPath, ReactFBReactNativeSpecPath, FBLazyVectorPath],
  excludedPaths: ["ReactCommon/RCTJscInstance.mm", "ReactCommon/metainternal"],
  dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .reactCxxReact, .rctDeprecation, .yoga, .reactRuntime, .reactRCTFabric, .reactCoreModules, .reactTurboModuleCore, .hermesPrebuilt, .reactUtils]
)

/// React-Core.podspec
let reactCore = RNTarget(
  name: .reactCore,
  path: "React",
  searchPaths: ["ReactCommon", RuntimeExecutorPath, CallInvokerPath, ReactFBReactNativeSpecPath, FBLazyVectorPath, "React/I18n", "React/Profiler", "ReactCommon/react/runtime/platform/ios"],
  linkedFrameworks: ["CoreServices"],
  excludedPaths: ["Fabric", "Tests", "Resources", "Runtime/RCTJscInstanceFactory.mm", "I18n/strings", "CxxBridge/JSCExecutorFactory.mm", "CoreModules"],
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactPerfLogger, .jsi, .reactJsiExecutor, .reactUtils, .reactFeatureFlags, .reactRuntimeScheduler, .yoga, .reactJsInspector, .reactJsiTooling, .rctDeprecation, .reactCoreRCTWebsocket, .reactRCTImage, .reactTurboModuleCore, .reactRCTText, .reactRCTBlob, .reactRCTAnimation, .reactRCTNetwork, .reactFabric, .hermesPrebuilt],
  sources: [".", "Runtime/RCTHermesInstanceFactory.mm"]
)

/// React-Fabric.podspec
let reactFabric = RNTarget(
  name: .reactFabric,
  path: "ReactCommon/react/renderer",
  searchPaths: [
    "ReactCommon",
    RuntimeExecutorPath,
    CallInvokerPath,
    "ReactCommon/react/renderer/components/view",
    "ReactCommon/react/renderer/components/view/platform/cxx",
    "ReactCommon/react/renderer/imagemanager/platform/ios",
  ],
  excludedPaths: [
    "animations/tests",
    "attributedstring/tests",
    "core/tests",
    "components/view/tests",
    "components/view/platform/android",
    "components/view/platform/windows",
    "components/view/platform/macos",
    "mounting/tests",
    "uimanager/tests",
    "telemetry/tests",
    "css",
    "debug",
    "graphics",
    "imagemanager",
    "mapbuffer",
    "consistency",
    "uimanager/consistency/tests",
    "components/inputaccessory",
    "components/modal",
    "components/rncore",
    "components/safeareaview",
    "components/scrollview",
    "components/text",
    "components/textinput",
    "components/textinput/platform/ios/",
    "components/unimplementedview",
    "components/root/tests",
  ],
  dependencies: [.reactNativeDependencies, .reactJsiExecutor, .rctTypesafety, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .reactRendererDebug, .reactGraphics, .yoga],
  sources: ["animations", "attributedstring", "core", "componentregistry", "componentregistry/native", "components/root", "components/view", "components/scrollview", "components/legacyviewmanagerinterop", "dom", "scheduler", "mounting", "observers/events", "telemetry", "consistency", "leakchecker", "uimanager", "uimanager/consistency"]
)

/// React-RCTFabric.podspec
let reactRCTFabric = RNTarget(
  name: .reactRCTFabric,
  path: "React/Fabric",
  searchPaths: ["ReactCommon", RuntimeExecutorPath, CallInvokerPath],
  dependencies: [.reactNativeDependencies, .reactCore, .reactRCTImage, .yoga, .reactRCTText, .jsi, .reactFabricComponents, .reactGraphics, .reactImageManager, .reactDebug, .reactUtils, .reactPerformanceTimeline, .reactRendererDebug, .reactRendererConsistency, .reactRuntimeScheduler, .reactRCTAnimation, .reactJsInspector, .reactJsInspectorNetwork, .reactJsInspectorTracing, .reactFabric, .reactFabricImage]
)

/// React-FabricComponents.podspec
let reactFabricComponents = RNTarget(
  name: .reactFabricComponents,
  path: "ReactCommon/react/renderer",
  searchPaths: [
    "ReactCommon",
    "ReactCommon/react/renderer/components/view/platform/cxx",
    "ReactCommon/react/renderer/components/text",
    "ReactCommon/react/renderer/components/text/platform/cxx",
    "ReactCommon/react/renderer/components/textinput/platform/ios",
    "ReactCommon/react/renderer/textlayoutmanager/platform/ios",
    "ReactCommon/react/renderer/textlayoutmanager",
  ],
  excludedPaths: [
    "components/view/platform/android",
    "components/view/platform/windows",
    "components/view/platform/macos",
    "components/scrollview/tests",
    "components/scrollview/platform/android",
    "components/textinput/platform/android",
    "components/text/platform/android",
    "components/textinput/platform/macos",
    "components/text/tests",
    "textlayoutmanager/tests",
    "textlayoutmanager/platform/android",
    "textlayoutmanager/platform/cxx",
    "textlayoutmanager/platform/windows",
    "textlayoutmanager/platform/macos",
  ],
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging],
  sources: ["components/inputaccessory", "components/modal", "components/rncore", "components/safeareaview", "components/scrollview", "components/text", "components/text/platform/cxx", "components/textinput", "components/textinput/platform/ios/", "components/unimplementedview", "textlayoutmanager", "textlayoutmanager/platform/ios"]
)

/// React-FabricImage.podspec
let reactFabricImage = RNTarget(
  name: .reactFabricImage,
  path: "ReactCommon/react/renderer/components/image",
  searchPaths: ["ReactCommon"],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFabric, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactTurboModuleBridging, .reactImageManagerApple]
)

/// React-ImageManagerApple.podspec
let reactImageManagerApple = RNTarget(
  name: .reactImageManagerApple,
  path: "ReactCommon/react/renderer/imagemanager/platform/ios",
  searchPaths: ["ReactCommon"],
  dependencies: [.reactNativeDependencies, .reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .reactImageManager, .reactRCTImage, .reactCore, .yoga]
)

/// React-ImageManager.podspec
let reactImageManager = RNTarget(
  name: .reactImageManager,
  path: "ReactCommon/react/renderer/imagemanager",
  searchPaths: ["ReactCommon"],
  excludedPaths: ["platform", "tests"],
  dependencies: [.reactNativeDependencies, .reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .yoga]
)

/// React-RCTAnimation.podspec
let reactRCTAnimation = RNTarget(
  name: .reactRCTAnimation,
  path: "Libraries/NativeAnimation",
  searchPaths: ["ReactCommon", ReactFBReactNativeSpecPath, FBLazyVectorPath, CallInvokerPath],
  dependencies: [.reactNativeDependencies, .rctTypesafety, .jsi, .reactFeatureFlags, .yoga, .reactTurboModuleCore, .reactUtils]
)

/// React-RCTImage.podspec
let reactRCTImage = RNTarget(
  name: .reactRCTImage,
  path: "Libraries/Image",
  searchPaths: ["ReactCommon", CallInvokerPath, ReactFBReactNativeSpecPath, FBLazyVectorPath],
  linkedFrameworks: ["Accelerate"],
  dependencies: [.rctTypesafety, .jsi, .yoga, .reactTurboModuleBridging, .reactTurboModuleCore]
)

/// React-RCTText.podspec
let reactRCTText = RNTarget(
  name: .reactRCTText,
  path: "Libraries/Text",
  searchPaths: ["ReactCommon", CallInvokerPath, ReactFBReactNativeSpecPath, FBLazyVectorPath],
  dependencies: [.yoga, .reactTurboModuleCore]
)

/// React-RCTBlocl.podspec
let reactRCTBlob = RNTarget(
  name: .reactRCTBlob,
  path: "Libraries/Blob",
  searchPaths: ["ReactCommon", CallInvokerPath, ReactFBReactNativeSpecPath, FBLazyVectorPath],
  dependencies: [.yoga, .jsi, .reactTurboModuleCore]
)

/// React-RCTNetwork.podspec
let reactRCTNetwork = RNTarget(
  name: .reactRCTNetwork,
  path: "Libraries/Network",
  searchPaths: ["ReactCommon", CallInvokerPath, ReactFBReactNativeSpecPath, FBLazyVectorPath],
  dependencies: [.yoga, .jsi, .reactTurboModuleCore]
)

/// React-RCTAppDelegate.podspec
let reactAppDelegate = RNTarget(
  name: .reactAppDelegate,
  path: "Libraries/AppDelegate",
  searchPaths: ["ReactCommon", RuntimeExecutorPath, CallInvokerPath],
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactRuntime, .reactRCTImage, .reactHermes, .reactCore, .reactFabric, .reactTurboModuleCore, .hermesPrebuilt, .yoga]
)

/// React-RCTLinking.podspec
let reactRCTLinking = RNTarget(
  name: .reactRCTLinking,
  path: "Libraries/LinkingIOS",
  searchPaths: ["ReactCommon", CallInvokerPath, ReactFBReactNativeSpecPath, FBLazyVectorPath],
  dependencies: [.jsi, .reactTurboModuleCore]
)

/// React-RCTSettings.podspec
let reactSettings = RNTarget(
  name: .reactSettings,
  path: "Libraries/Settings",
  searchPaths: ["ReactCommon", ReactFBReactNativeSpecPath, FBLazyVectorPath],
  dependencies: [.reactTurboModuleCore, .yoga]
)

// MARK: Target list
let targets = [
  reactDebug,
  jsi,
  logger,
  mapbuffer,
  rctDeprecation,
  yoga,
  reactUtils,
  reactFeatureFlags,
  reactPerfLogger,
  reactJsInspectorNetwork,
  reactOSCompat,
  reactRendererDebug,
  reactRendererConsistency,
  reactHermes,
  reactJsiExecutor,
  reactJsInspector,
  reactJsInspectorTracing,
  reactCxxReact,
  reactCore,
  reactCoreRCTWebsocket,
  reactFabric,
  reactRCTFabric,
  reactFabricComponents,
  reactFabricImage,
  reactNativeDependencies,
  hermesPrebuilt,
  reactJsiTooling,
  reactPerformanceTimeline,
  reactRuntimeScheduler,
  rctTypesafety,
  reactGraphics,
  reactGraphicsApple,
  reactImageManager,
  reactImageManagerApple,
  reactJsErrorHandler,
  reactRuntime,
  reactRuntimeApple,
  reactRCTAnimation,
  reactRCTImage,
  reactRCTText,
  reactRCTBlob,
  reactRCTNetwork,
  reactRCTLinking,
  reactCoreModules,
  reactTurboModuleBridging,
  reactTurboModuleCore,
  reactTurboModuleCoreDefaults,
  reactTurboModuleCoreMicrotasks,
  reactIdleCallbacksNativeModule,
  reactFeatureflagsNativemodule,
  reactNativeModuleDom,
  reactAppDelegate,
  reactSettings,
]

// MARK: Package object

let package = Package(
  name: react,
  platforms: [.iOS(.v15), .macCatalyst(SupportedPlatform.MacCatalystVersion.v13)],
  products: [
    .library(
      name: react,
      type: .dynamic,
      targets: targets.map { $0.name }
    )
  ],
  targets: targets.map { $0.target(targets: targets) }
)

// MARK: Support & Utility Classes

class BaseTarget {
  let name: String
  let path: String
  let searchPaths: [String]

  init(name: String, path: String, searchPaths: [String] = []) {
    self.name = name
    self.path = path
    self.searchPaths = searchPaths
  }

  func target(targets: [BaseTarget]) -> Target {
    fatalError("Must override in subclass")
  }
}

class BinaryTarget: BaseTarget {
  override func target(targets: [BaseTarget]) -> Target {
    return .binaryTarget(name: self.name, path: self.path)
  }
}

class RNTarget: BaseTarget {
  let linkedFrameworks: [String]
  let excludedPaths: [String]
  let dependencies: [String]
  let sources: [String]?
  let publicHeadersPath: String?
  let defines: [CXXSetting]

  init(name: String, path: String, searchPaths: [String] = [], linkedFrameworks: [String] = [], excludedPaths: [String] = [], dependencies: [String] = [], sources: [String]? = nil, publicHeadersPath: String? = ".", defines: [CXXSetting] = []) {
    self.linkedFrameworks = linkedFrameworks
    self.excludedPaths = excludedPaths
    self.dependencies = dependencies
    self.sources = sources
    self.publicHeadersPath = publicHeadersPath
    self.defines = defines

    super.init(name: name, path: path, searchPaths: searchPaths)
  }

  override func target(targets: [BaseTarget]) -> Target {
    let dependencies = self.dependencies.compactMap { depName in
      targets.first(where: { $0.name == depName })
    }

    let searchPaths = self.searchPaths + dependencies.compactMap { $0.searchPaths }.flatMap { $0 }
    let linkerSettings = self.linkedFrameworks.reduce([]) { $0 + [LinkerSetting.linkedFramework($1)] }

    return Target.reactNativeTarget(
      name: self.name,
      path: self.path,
      searchPaths: searchPaths,
      excludedPaths: self.excludedPaths,
      dependencies: self.dependencies,
      sources: self.sources,
      publicHeadersPath: self.publicHeadersPath,
      linkerSettings: linkerSettings,
      defines: self.defines
    )
  }
}

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
  static let reactSettings = "React-RCTSettings"
}

func relativeSearchPath(_ depth: Int, _ path: String) -> String {
  let slashes = (0..<depth).map { _ in "../" }.joined(separator: "")
  return "\(slashes)\(path)"
}

extension Target {
  static func reactNativeTarget(
    name: String,
    path: String,
    searchPaths: [String] = [],
    excludedPaths: [String] = [],
    dependencies: [String] = [],
    sources: [String]? = nil,
    publicHeadersPath: String? = ".",
    linkerSettings: [LinkerSetting] = [],
    defines: [CXXSetting] = []
  ) -> Target {
    let dependencies = dependencies.map { Dependency.byNameItem(name: $0, condition: nil) }
    let excludes = excludedPaths
    let numOfSlash = path.count { $0 == "/" }

    let cxxCommonHeaderPaths: [CXXSetting] =
      Set(searchPaths).map {
        CXXSetting.headerSearchPath(relativeSearchPath(numOfSlash + 1, $0))
      } + [
        CXXSetting.headerSearchPath(relativeSearchPath(numOfSlash + 1, ".build/headers")),
        CXXSetting.headerSearchPath(relativeSearchPath(numOfSlash + 1, ".build/headers/React")),
      ]

    let cxxSettings =
      [
        .unsafeFlags(["-std=c++20"]),
        .define("DEBUG", .when(configuration: .debug)),
        .define("NDEBUG", .when(configuration: .release)),
        .define("USE_HERMES", to: "1"),
      ] + defines + cxxCommonHeaderPaths

    return .target(
      name: name,
      dependencies: dependencies,
      path: path,
      exclude: excludes,
      sources: sources,
      publicHeadersPath: publicHeadersPath,
      cxxSettings: cxxSettings,
      linkerSettings: linkerSettings
    )
  }
}
