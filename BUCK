load("//tools/build_defs:fb_native_wrapper.bzl", "fb_native")
load("//tools/build_defs/apple:fb_apple_test.bzl", "fb_apple_test")
load("//tools/build_defs/apple:flag_defs.bzl", "get_objc_arc_preprocessor_flags", "get_preprocessor_flags_for_build_mode", "get_static_library_ios_flags")
load("//tools/build_defs/apple/plugins:plugin_defs.bzl", "plugin")
load("//tools/build_defs/oss:metro_defs.bzl", "rn_library")
load(
    "//tools/build_defs/oss:rn_codegen_defs.bzl",
    "rn_codegen",
    "rn_codegen_components",
)
load(
    "//tools/build_defs/oss:rn_defs.bzl",
    "ANDROID",
    "APPLE",
    "IOS",
    "RCT_IMAGE_DATA_DECODER_SOCKET",
    "RCT_IMAGE_URL_LOADER_SOCKET",
    "RCT_URL_REQUEST_HANDLER_SOCKET",
    "YOGA_CXX_TARGET",
    "fb_xplat_cxx_test",
    "get_react_native_ios_target_sdk_version",
    "react_cxx_module_plugin_provider",
    "react_fabric_component_plugin_provider",
    "react_module_plugin_providers",
    "react_native_root_target",
    "react_native_xplat_dep",
    "react_native_xplat_target",
    "rn_apple_library",
    "rn_apple_xplat_cxx_library",
    "rn_extra_build_flags",
    "rn_xplat_cxx_library",
    "subdir_glob",
)
load("//tools/build_defs/third_party:yarn_defs.bzl", "yarn_workspace")

RCTCXXBRIDGE_PUBLIC_HEADERS = {
    "React/" + x: "packages/react-native/React/CxxBridge/" + x
    for x in [
        "JSCExecutorFactory.h",
        "NSDataBigString.h",
        "RCTCxxBridgeDelegate.h",
        "RCTJSIExecutorRuntimeInstaller.h",
        "RCTMessageThread.h",
    ]
}

fb_native.genrule(
    name = "codegen_rn_components_schema_rncore",
    srcs = glob(
        [
            "packages/**/*NativeComponent.js",
        ],
        exclude = [
            "**/__*__/**",

            # Subfolders with their own BUCK files, referenced below
            "packages/rn-tester/**",
        ],
    ) + [
        react_native_root_target("packages/rn-tester:nativecomponent-srcs"),
    ],
    out = "schema-rncore.json",
    cmd = "$(exe {}) $OUT $SRCS".format(react_native_root_target("packages/react-native-codegen:write_to_json")),
    labels = ["uses_hg"],
)

rn_codegen_components(
    name = "rncore",
    schema_target = ":codegen_rn_components_schema_rncore",
)

rn_apple_xplat_cxx_library(
    name = "RCTCxxBridge",
    srcs = glob([
        "packages/react-native/React/CxxBridge/*.mm",
    ]),
    headers = subdir_glob(
        [
            (
                "packages/react-native/React/CxxBridge",
                "*.h",
            ),
        ],
        exclude = RCTCXXBRIDGE_PUBLIC_HEADERS.values(),
        prefix = "React",
    ),
    header_namespace = "",
    exported_headers = RCTCXXBRIDGE_PUBLIC_HEADERS,
    compiler_flags = [
        "-fobjc-arc-exceptions",
    ],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    exported_preprocessor_flags = rn_extra_build_flags(),
    fbobjc_enable_exceptions = True,
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
    ],
    # Used via objc_lookupClass in RCTBridge. Semantics are meant to be "if
    # it's linked in your app, transparently use it".
    labels = [
        "depslint_never_remove",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + [
        "-DWITH_FBSYSTRACE=1",
        "-DRCT_USE_HERMES=0",  # This is the default.
    ],
    visibility = ["PUBLIC"],
    deps = [
        ":RCTCxxModule",
        ":RCTCxxUtils",
        ":ReactInternal",
        "//fbobjc/Libraries/FBReactKit:RCTFBSystrace",
        react_native_root_target("packages/react-native/React/CoreModules:CoreModules"),
        react_native_xplat_target("cxxreact:bridge"),
        react_native_xplat_target("cxxreact:jsbigstring"),
        react_native_xplat_target("jsc:JSCRuntime"),
        react_native_xplat_target("jsiexecutor:jsiexecutor"),
        react_native_xplat_target("reactperflogger:reactperflogger"),
    ],
)

RCTCXXMODULE_PUBLIC_HEADERS = {
    "React/" + x: "packages/react-native/React/CxxModule/" + x
    for x in [
        "RCTCxxMethod.h",
        "RCTCxxModule.h",
        "RCTCxxUtils.h",
    ]
}

rn_apple_xplat_cxx_library(
    name = "RCTCxxModule",
    srcs = glob([
        "packages/react-native/React/CxxModule/*.mm",
    ]),
    headers = subdir_glob(
        [
            (
                "packages/react-native/React/CxxModule",
                "*.h",
            ),
        ],
        exclude = RCTCXXMODULE_PUBLIC_HEADERS.values(),
        prefix = "React",
    ),
    header_namespace = "",
    exported_headers = RCTCXXMODULE_PUBLIC_HEADERS,
    compiler_flags = [
        "-fobjc-arc-exceptions",
    ],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    fbobjc_enable_exceptions = True,
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
    ],
    labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + ["-DWITH_FBSYSTRACE=1"],
    visibility = ["PUBLIC"],
    deps = [
        ":RCTCxxUtils",
        ":ReactInternal",
        "//xplat/fbsystrace:fbsystrace",
        react_native_xplat_target("cxxreact:module"),
        react_native_xplat_target("cxxreact:bridge"),
        react_native_xplat_target("reactperflogger:reactperflogger"),
        react_native_xplat_dep("jsi:jsi"),
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTCxxUtils",
    srcs = glob([
        "packages/react-native/React/CxxUtils/*.mm",
    ]),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "packages/react-native/React/CxxUtils",
                "*.h",
            ),
        ],
        exclude = RCTCXXMODULE_PUBLIC_HEADERS.values(),
        prefix = "React",
    ),
    apple_sdks = (IOS,),
    contacts = ["oncall+react_native@xmail.facebook.com"],
    fbobjc_enable_exceptions = True,
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
    ],
    labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/folly:dynamic",
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTCxxLogUtils",
    srcs = glob([
        "packages/react-native/React/CxxLogUtils/*.mm",
    ]),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "packages/react-native/React/CxxLogUtils",
                "*.h",
            ),
        ],
        prefix = "React",
    ),
    contacts = ["oncall+react_native@xmail.facebook.com"],
    fbobjc_enable_exceptions = True,
    labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:ReactInternal",
        react_native_xplat_target("logger:logger"),
    ],
)

RCTLIB_PATH = "packages/react-native/Libraries/"

RCTBASE_PATH = "packages/react-native/React/Base/"

RCTDEVSUPPORT_PATH = "packages/react-native/React/DevSupport/"

RCTMODULES_PATH = "packages/react-native/React/Modules/"

RCTVIEWS_PATH = "packages/react-native/React/Views/"

REACT_PUBLIC_HEADERS = {
    "React/RCTAnimationType.h": RCTVIEWS_PATH + "RCTAnimationType.h",
    "React/RCTAssert.h": RCTBASE_PATH + "RCTAssert.h",
    "React/RCTAutoInsetsProtocol.h": RCTVIEWS_PATH + "RCTAutoInsetsProtocol.h",
    "React/RCTBorderCurve.h": RCTVIEWS_PATH + "RCTBorderCurve.h",
    "React/RCTBorderDrawing.h": RCTVIEWS_PATH + "RCTBorderDrawing.h",
    "React/RCTBorderStyle.h": RCTVIEWS_PATH + "RCTBorderStyle.h",
    "React/RCTBridge+Private.h": RCTBASE_PATH + "RCTBridge+Private.h",
    "React/RCTBridge.h": RCTBASE_PATH + "RCTBridge.h",
    "React/RCTBridgeConstants.h": RCTBASE_PATH + "RCTBridgeConstants.h",
    "React/RCTBridgeDelegate.h": RCTBASE_PATH + "RCTBridgeDelegate.h",
    "React/RCTBridgeMethod.h": RCTBASE_PATH + "RCTBridgeMethod.h",
    "React/RCTBridgeModule.h": RCTBASE_PATH + "RCTBridgeModule.h",
    "React/RCTBridgeModuleDecorator.h": RCTBASE_PATH + "RCTBridgeModuleDecorator.h",
    "React/RCTBundleManager.h": RCTBASE_PATH + "RCTBundleManager.h",
    "React/RCTBundleURLProvider.h": RCTBASE_PATH + "RCTBundleURLProvider.h",
    "React/RCTComponent.h": RCTVIEWS_PATH + "RCTComponent.h",
    "React/RCTComponentData.h": RCTVIEWS_PATH + "RCTComponentData.h",
    "React/RCTComponentEvent.h": RCTBASE_PATH + "RCTComponentEvent.h",
    "React/RCTConstants.h": RCTBASE_PATH + "RCTConstants.h",
    "React/RCTConvert.h": RCTBASE_PATH + "RCTConvert.h",
    "React/RCTCxxConvert.h": RCTBASE_PATH + "RCTCxxConvert.h",
    "React/RCTDefines.h": RCTBASE_PATH + "RCTDefines.h",
    "React/RCTDevLoadingViewProtocol.h": RCTDEVSUPPORT_PATH + "RCTDevLoadingViewProtocol.h",
    "React/RCTDevLoadingViewSetEnabled.h": RCTDEVSUPPORT_PATH + "RCTDevLoadingViewSetEnabled.h",
    "React/RCTDisplayLink.h": RCTBASE_PATH + "RCTDisplayLink.h",
    "React/RCTDynamicTypeRamp.h": RCTLIB_PATH + "Text/Text/RCTDynamicTypeRamp.h",
    "React/RCTErrorCustomizer.h": RCTBASE_PATH + "RCTErrorCustomizer.h",
    "React/RCTErrorInfo.h": RCTBASE_PATH + "RCTErrorInfo.h",
    # NOTE: RCTEventDispatcher.h is exported from CoreModules:CoreModulesApple
    "React/RCTEventDispatcherProtocol.h": RCTBASE_PATH + "RCTEventDispatcherProtocol.h",
    "React/RCTEventEmitter.h": RCTMODULES_PATH + "RCTEventEmitter.h",
    "React/RCTFont.h": RCTVIEWS_PATH + "RCTFont.h",
    "React/RCTFrameUpdate.h": RCTBASE_PATH + "RCTFrameUpdate.h",
    "React/RCTI18nUtil.h": RCTMODULES_PATH + "RCTI18nUtil.h",
    "React/RCTImageSource.h": RCTBASE_PATH + "RCTImageSource.h",
    "React/RCTInitializing.h": RCTBASE_PATH + "RCTInitializing.h",
    "React/RCTInspector.h": "packages/react-native/React/Inspector/RCTInspector.h",
    "React/RCTInspectorDevServerHelper.h": RCTDEVSUPPORT_PATH + "RCTInspectorDevServerHelper.h",
    "React/RCTInspectorPackagerConnection.h": "packages/react-native/React/Inspector/RCTInspectorPackagerConnection.h",
    "React/RCTInvalidating.h": RCTBASE_PATH + "RCTInvalidating.h",
    "React/RCTJSScriptLoaderModule.h": RCTBASE_PATH + "RCTJSScriptLoaderModule.h",
    "React/RCTJSStackFrame.h": RCTBASE_PATH + "RCTJSStackFrame.h",
    "React/RCTJSThread.h": RCTBASE_PATH + "RCTJSThread.h",
    "React/RCTJavaScriptExecutor.h": RCTBASE_PATH + "RCTJavaScriptExecutor.h",
    "React/RCTJavaScriptLoader.h": RCTBASE_PATH + "RCTJavaScriptLoader.h",
    "React/RCTKeyCommands.h": RCTBASE_PATH + "RCTKeyCommands.h",
    "React/RCTLayout.h": RCTVIEWS_PATH + "RCTLayout.h",
    "React/RCTLayoutAnimation.h": RCTMODULES_PATH + "RCTLayoutAnimation.h",
    "React/RCTLayoutAnimationGroup.h": RCTMODULES_PATH + "RCTLayoutAnimationGroup.h",
    "React/RCTLog.h": RCTBASE_PATH + "RCTLog.h",
    "React/RCTManagedPointer.h": RCTBASE_PATH + "RCTManagedPointer.h",
    "React/RCTMockDef.h": RCTBASE_PATH + "RCTMockDef.h",
    "React/RCTModalHostViewController.h": RCTVIEWS_PATH + "RCTModalHostViewController.h",
    "React/RCTModalHostViewManager.h": RCTVIEWS_PATH + "RCTModalHostViewManager.h",
    "React/RCTModalManager.h": RCTVIEWS_PATH + "RCTModalManager.h",
    "React/RCTModuleData.h": RCTBASE_PATH + "RCTModuleData.h",
    "React/RCTModuleMethod.h": RCTBASE_PATH + "RCTModuleMethod.h",
    "React/RCTMultipartStreamReader.h": RCTBASE_PATH + "RCTMultipartStreamReader.h",
    "React/RCTNullability.h": RCTBASE_PATH + "RCTNullability.h",
    "React/RCTPLTag.h": RCTBASE_PATH + "RCTPLTag.h",
    "React/RCTPackagerClient.h": RCTDEVSUPPORT_PATH + "RCTPackagerClient.h",
    "React/RCTPackagerConnection.h": RCTDEVSUPPORT_PATH + "RCTPackagerConnection.h",
    "React/RCTPerformanceLogger.h": RCTBASE_PATH + "RCTPerformanceLogger.h",
    "React/RCTPerformanceLoggerLabels.h": RCTBASE_PATH + "RCTPerformanceLoggerLabels.h",
    "React/RCTPointerEvents.h": RCTVIEWS_PATH + "RCTPointerEvents.h",
    "React/RCTProfile.h": "packages/react-native/React/Profiler/RCTProfile.h",
    "React/RCTPushNotificationManager.h": RCTLIB_PATH + "PushNotificationIOS/RCTPushNotificationManager.h",
    "React/RCTReconnectingWebSocket.h": RCTLIB_PATH + "WebSocket/RCTReconnectingWebSocket.h",
    "React/RCTRedBoxExtraDataViewController.h": RCTMODULES_PATH + "RCTRedBoxExtraDataViewController.h",
    "React/RCTRedBoxSetEnabled.h": RCTBASE_PATH + "RCTRedBoxSetEnabled.h",
    "React/RCTRefreshableProtocol.h": RCTVIEWS_PATH + "RefreshControl/RCTRefreshableProtocol.h",
    "React/RCTReloadCommand.h": RCTBASE_PATH + "RCTReloadCommand.h",
    "React/RCTRootContentView.h": RCTBASE_PATH + "RCTRootContentView.h",
    "React/RCTRootShadowView.h": RCTVIEWS_PATH + "RCTRootShadowView.h",
    "React/RCTRootView.h": RCTBASE_PATH + "RCTRootView.h",
    "React/RCTRootViewDelegate.h": RCTBASE_PATH + "RCTRootViewDelegate.h",
    "React/RCTScrollEvent.h": RCTVIEWS_PATH + "ScrollView/RCTScrollEvent.h",
    "React/RCTScrollView.h": RCTVIEWS_PATH + "ScrollView/RCTScrollView.h",
    "React/RCTScrollableProtocol.h": RCTVIEWS_PATH + "ScrollView/RCTScrollableProtocol.h",
    "React/RCTShadowView+Layout.h": RCTVIEWS_PATH + "RCTShadowView+Layout.h",
    "React/RCTShadowView.h": RCTVIEWS_PATH + "RCTShadowView.h",
    "React/RCTSurface.h": RCTBASE_PATH + "Surface/RCTSurface.h",
    "React/RCTSurfaceDelegate.h": RCTBASE_PATH + "Surface/RCTSurfaceDelegate.h",
    "React/RCTSurfaceHostingProxyRootView.h": RCTBASE_PATH + "Surface/SurfaceHostingView/RCTSurfaceHostingProxyRootView.h",
    "React/RCTSurfaceHostingView.h": RCTBASE_PATH + "Surface/SurfaceHostingView/RCTSurfaceHostingView.h",
    "React/RCTSurfacePresenterStub.h": RCTMODULES_PATH + "RCTSurfacePresenterStub.h",
    "React/RCTSurfaceProtocol.h": RCTBASE_PATH + "Surface/RCTSurfaceProtocol.h",
    "React/RCTSurfaceRootShadowView.h": RCTBASE_PATH + "Surface/RCTSurfaceRootShadowView.h",
    "React/RCTSurfaceRootShadowViewDelegate.h": RCTBASE_PATH + "Surface/RCTSurfaceRootShadowViewDelegate.h",
    "React/RCTSurfaceRootView.h": RCTBASE_PATH + "Surface/RCTSurfaceRootView.h",
    "React/RCTSurfaceSizeMeasureMode.h": RCTBASE_PATH + "Surface/SurfaceHostingView/RCTSurfaceSizeMeasureMode.h",
    "React/RCTSurfaceStage.h": RCTBASE_PATH + "Surface/RCTSurfaceStage.h",
    "React/RCTSurfaceView+Internal.h": RCTBASE_PATH + "Surface/RCTSurfaceView+Internal.h",
    "React/RCTSurfaceView.h": RCTBASE_PATH + "Surface/RCTSurfaceView.h",
    "React/RCTTextDecorationLineType.h": RCTVIEWS_PATH + "RCTTextDecorationLineType.h",
    "React/RCTTouchHandler.h": RCTBASE_PATH + "RCTTouchHandler.h",
    "React/RCTTurboModuleRegistry.h": RCTBASE_PATH + "RCTTurboModuleRegistry.h",
    "React/RCTUIManager.h": RCTMODULES_PATH + "RCTUIManager.h",
    "React/RCTUIManagerObserverCoordinator.h": RCTMODULES_PATH + "RCTUIManagerObserverCoordinator.h",
    "React/RCTUIManagerUtils.h": RCTMODULES_PATH + "RCTUIManagerUtils.h",
    "React/RCTUIUtils.h": "packages/react-native/React/UIUtils/RCTUIUtils.h",
    "React/RCTURLRequestDelegate.h": RCTBASE_PATH + "RCTURLRequestDelegate.h",
    "React/RCTURLRequestHandler.h": RCTBASE_PATH + "RCTURLRequestHandler.h",
    "React/RCTUtils.h": RCTBASE_PATH + "RCTUtils.h",
    "React/RCTUtilsUIOverride.h": RCTBASE_PATH + "RCTUtilsUIOverride.h",
    "React/RCTVersion.h": RCTBASE_PATH + "RCTVersion.h",
    "React/RCTView.h": RCTVIEWS_PATH + "RCTView.h",
    "React/RCTViewManager.h": RCTVIEWS_PATH + "RCTViewManager.h",
    "React/RCTViewUtils.h": RCTVIEWS_PATH + "RCTViewUtils.h",
    "React/RCTWrapperViewController.h": RCTVIEWS_PATH + "RCTWrapperViewController.h",
    "React/UIView+React.h": RCTVIEWS_PATH + "UIView+React.h",
}

REACT_COMPONENTVIEWS_BASE_FILES = [
    "packages/react-native/React/Fabric/Mounting/ComponentViews/Image/*.mm",
    "packages/react-native/React/Fabric/RCTImageResponseObserverProxy.mm",
    "packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm",
]

rn_apple_xplat_cxx_library(
    name = "ReactInternal",
    srcs = glob(
        [
            "packages/react-native/React/Base/**/*.m",
            "packages/react-native/React/Base/**/*.mm",
            "packages/react-native/React/DevSupport/**/*.m",
            "packages/react-native/React/DevSupport/**/*.mm",
            "packages/react-native/React/Inspector/**/*.m",
            "packages/react-native/React/Inspector/**/*.mm",
            "packages/react-native/React/Modules/**/*.m",
            "packages/react-native/React/Modules/**/*.mm",
            "packages/react-native/React/Profiler/**/*.m",
            "packages/react-native/React/Profiler/**/*.mm",
            "packages/react-native/React/Profiler/**/*.S",
            "packages/react-native/React/UIUtils/*.m",
            "packages/react-native/React/Views/**/*.m",
            "packages/react-native/React/Views/**/*.mm",
            "packages/react-native/Libraries/ActionSheetIOS/*.m",
            "packages/react-native/Libraries/WebSocket/*.m",
        ],
    ),
    headers = glob(
        [
            "packages/react-native/React/Base/**/*.h",
            "packages/react-native/React/DevSupport/**/*.h",
            "packages/react-native/React/Inspector/**/*.h",
            "packages/react-native/React/Modules/**/*.h",
            "packages/react-native/React/Profiler/**/*.h",
            "packages/react-native/React/Views/**/*.h",
            "packages/react-native/React/UIUtils/**/*.h",
            "packages/react-native/Libraries/ActionSheetIOS/*.h",
            "packages/react-native/Libraries/WebSocket/*.h",
        ],
    ),
    header_namespace = "",
    exported_headers = REACT_PUBLIC_HEADERS,
    compiler_flags = [
        "-Wno-error=unguarded-availability-new",
        "-Wno-unknown-warning-option",
        "-Wno-global-constructors",
    ],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    exported_preprocessor_flags = rn_extra_build_flags(),
    fbobjc_enable_exceptions = True,
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/CFNetwork.framework",
        "$SDKROOT/System/Library/Frameworks/CoreGraphics.framework",
        "$SDKROOT/System/Library/Frameworks/CoreLocation.framework",
        "$SDKROOT/System/Library/Frameworks/CoreText.framework",
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
        "$SDKROOT/System/Library/Frameworks/MapKit.framework",
        "$SDKROOT/System/Library/Frameworks/QuartzCore.framework",
        "$SDKROOT/System/Library/Frameworks/Security.framework",
        "$SDKROOT/System/Library/Frameworks/SystemConfiguration.framework",
        "$SDKROOT/System/Library/Frameworks/UIKit.framework",
        "$SDKROOT/System/Library/Frameworks/UserNotifications.framework",
        "$SDKROOT/System/Library/Frameworks/WebKit.framework",
    ],
    labels = [
        "depslint_never_add",
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    platform_preprocessor_flags = [(
        "linux",
        ["-D PIC_MODIFIER=@PLT"],
    )],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags(),
    visibility = [
        "//fbobjc/Apps/Internal/SparkLabs/...",
        "//fbobjc/Apps/Internal/Venice/...",
        "//fbobjc/Apps/Wilde/FBMarketplaceModule/...",
        "//fbobjc/Apps/Wilde/FBReactModule2/...",
        "//fbobjc/Libraries/FBQPLMetadataProviders/...",
        "//fbobjc/Libraries/FBReactKit/...",
        "//fbobjc/Libraries/FBiOSSecurityUtils/...",
        "//fbobjc/Libraries/RCTPrerendering/...",
        "//fbobjc/VendorLib/react-native-maps:react-native-maps",
        "//xplat/js:",
        "//xplat/js/react-native-github/packages/react-native/React/...",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/nativemodule/core:",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/nativemodule/samples:",
        "//xplat/js/react-native-github/packages/rn-tester:",
        "//xplat/rtc/manul/...",
    ],
    deps = [
        YOGA_CXX_TARGET,
        "//fbobjc/VendorLib/SocketRocket:SocketRocket",
        react_native_xplat_target("cxxreact:bridge"),
        react_native_xplat_target("reactperflogger:reactperflogger"),
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTFabric",
    srcs = glob(
        [
            "packages/react-native/React/Fabric/**/*.cpp",
            "packages/react-native/React/Fabric/**/*.m",
            "packages/react-native/React/Fabric/**/*.mm",
        ],
        exclude = glob(REACT_COMPONENTVIEWS_BASE_FILES),
    ),
    headers = glob(
        [
            "packages/react-native/React/Fabric/**/*.h",
        ],
    ),
    header_namespace = "",
    exported_headers = {
        "React/RCTComponentViewDescriptor.h": "packages/react-native/React/Fabric/Mounting/RCTComponentViewDescriptor.h",
        "React/RCTComponentViewFactory.h": "packages/react-native/React/Fabric/Mounting/RCTComponentViewFactory.h",
        "React/RCTComponentViewRegistry.h": "packages/react-native/React/Fabric/Mounting/RCTComponentViewRegistry.h",
        "React/RCTFabricSurface.h": "packages/react-native/React/Fabric/Surface/RCTFabricSurface.h",
        "React/RCTFabricSurfaceHostingProxyRootView.h": "packages/react-native/React/Fabric/Surface/RCTFabricSurfaceHostingProxyRootView.h",
        "React/RCTGenericDelegateSplitter.h": "packages/react-native/React/Fabric/Utils/RCTGenericDelegateSplitter.h",
        "React/RCTLegacyViewManagerInteropComponentView.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/LegacyViewManagerInterop/RCTLegacyViewManagerInteropComponentView.h",
        "React/RCTLocalizationProvider.h": "packages/react-native/React/Fabric/RCTLocalizationProvider.h",
        "React/RCTModalHostViewComponentView.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.h",
        "React/RCTMountingManager.h": "packages/react-native/React/Fabric/Mounting/RCTMountingManager.h",
        "React/RCTMountingManagerDelegate.h": "packages/react-native/React/Fabric/Mounting/RCTMountingManagerDelegate.h",
        "React/RCTMountingTransactionObserving.h": "packages/react-native/React/Fabric/Mounting/RCTMountingTransactionObserving.h",
        "React/RCTParagraphComponentAccessibilityProvider.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentAccessibilityProvider.h",
        "React/RCTParagraphComponentView.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentView.h",
        "React/RCTPrimitives.h": "packages/react-native/React/Fabric/RCTPrimitives.h",
        "React/RCTRootComponentView.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/Root/RCTRootComponentView.h",
        "React/RCTScheduler.h": "packages/react-native/React/Fabric/RCTScheduler.h",
        "React/RCTScrollViewComponentView.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.h",
        "React/RCTSurfacePresenter.h": "packages/react-native/React/Fabric/RCTSurfacePresenter.h",
        "React/RCTSurfacePresenterBridgeAdapter.h": "packages/react-native/React/Fabric/RCTSurfacePresenterBridgeAdapter.h",
        "React/RCTSurfaceRegistry.h": "packages/react-native/React/Fabric/RCTSurfaceRegistry.h",
        "React/RCTSurfaceTouchHandler.h": "packages/react-native/React/Fabric/RCTSurfaceTouchHandler.h",
    },
    compiler_flags = [
        "-fexceptions",
        "-frtti",
        "-std=c++17",
        "-Wall",
    ],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    fbobjc_enable_exceptions = True,
    fbobjc_target_sdk_version = get_react_native_ios_target_sdk_version(),
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
        "$SDKROOT/System/Library/Frameworks/QuartzCore.framework",
        "$SDKROOT/System/Library/Frameworks/UIKit.framework",
    ],
    header_path_prefix = "React",
    labels = [
        "disable_plugins_only_validation",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    plugins = [
        react_fabric_component_plugin_provider("SafeAreaView", "RCTSafeAreaViewCls"),
        react_fabric_component_plugin_provider("ScrollView", "RCTScrollViewCls"),
        react_fabric_component_plugin_provider("PullToRefreshView", "RCTPullToRefreshViewCls"),
        react_fabric_component_plugin_provider("ActivityIndicatorView", "RCTActivityIndicatorViewCls"),
        react_fabric_component_plugin_provider("Switch", "RCTSwitchCls"),
        react_fabric_component_plugin_provider("UnimplementedNativeView", "RCTUnimplementedNativeViewCls"),
        react_fabric_component_plugin_provider("Paragraph", "RCTParagraphCls"),
        react_fabric_component_plugin_provider("TextInput", "RCTTextInputCls"),
        react_fabric_component_plugin_provider("InputAccessoryView", "RCTInputAccessoryCls"),
        react_fabric_component_plugin_provider("View", "RCTViewCls"),
    ],
    plugins_header = "FBRCTFabricComponentsPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + [
        "-DWITH_FBSYSTRACE=1",
        "-DLOG_TAG=\"ReactNative\"",
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ] + rn_extra_build_flags(),
    tests = [
        ":MountingTests",
        ":TextTests",
    ],
    visibility = ["PUBLIC"],
    deps = [
        ":RCTFabricComponentViewsBase",
        "//fbobjc/Libraries/FBReactKit/RCTFabricComponent/RCTFabricComponentPlugin:RCTFabricComponentPlugin",
        "//xplat/js/react-native-github:RCTCxxBridge",
        "//xplat/js/react-native-github:RCTCxxLogUtils",
        "//xplat/js/react-native-github:RCTCxxUtils",
        "//xplat/js/react-native-github:RCTImage",
        "//xplat/js/react-native-github:RCTPushNotification",
        "//xplat/js/react-native-github:RCTText",
        "//xplat/js/react-native-github:ReactInternal",
        react_native_xplat_target("react/renderer/attributedstring:attributedstring"),
        react_native_xplat_target("react/renderer/componentregistry:componentregistry"),
        react_native_xplat_target("react/renderer/componentregistry/native:native"),
        react_native_xplat_target("react/renderer/textlayoutmanager:textlayoutmanager"),
        react_native_xplat_target("runtimeexecutor:runtimeexecutor"),
        YOGA_CXX_TARGET,
        react_native_xplat_target("react/config:config"),
        react_native_xplat_target("cxxreact:bridge"),
    ],
    exported_deps = [
        react_native_xplat_target("react/renderer/animations:animations"),
        react_native_xplat_target("react/renderer/components/scrollview:scrollview"),
        react_native_xplat_target("react/renderer/components/safeareaview:safeareaview"),
        react_native_xplat_target("react/renderer/components/modal:modal"),
        react_native_xplat_target("react/renderer/components/unimplementedview:unimplementedview"),
        react_native_xplat_target("react/renderer/components/text:text"),
        react_native_xplat_target("react/renderer/components/legacyviewmanagerinterop:legacyviewmanagerinterop"),
        react_native_xplat_target("react/renderer/components/textinput/iostextinput:iostextinput"),
        react_native_xplat_target("react/renderer/components/inputaccessory:inputaccessory"),
        react_native_xplat_target("react/renderer/core:core"),
        react_native_xplat_target("react/renderer/debug:debug"),
        react_native_xplat_target("react/renderer/scheduler:scheduler"),
        react_native_xplat_target("react/renderer/uimanager:uimanager"),
        "//xplat/js/react-native-github:generated_components-rncore",
    ],
)

rn_apple_library(
    name = "RCTTypeSafety",
    srcs = glob([
        "packages/react-native/Libraries/TypeSafety/**/*.mm",
    ]),
    exported_headers = glob(
        [
            "packages/react-native/Libraries/TypeSafety/**/*.h",
        ],
    ),
    autoglob = False,
    complete_nullability = True,
    contacts = ["oncall+react_native@xmail.facebook.com"],
    disable_infer_precompiled_header = True,
    extension_api_only = True,
    frameworks = [
        "Foundation",
    ],
    inherited_buck_flags = get_static_library_ios_flags(),
    labels = [
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
        "talkios_link_group:xplat/default/public.react_native.infra",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    reexport_all_header_dependencies = True,
    deps = [
        ":ReactInternalApple",
        "//xplat/folly:optionalApple",
        "//xplat/js/react-native-github/packages/react-native/Libraries/FBLazyVector:FBLazyVector",
    ],
)

yarn_workspace(
    name = "yarn-workspace",
    srcs = [
        "package.json",
    ],
    visibility = ["PUBLIC"],
)

fb_apple_test(
    name = "TextTestsApple",
    srcs = ["packages/react-native/React/Tests/Text/RCTParagraphComponentViewTests.mm"],
    frameworks = [
        "$PLATFORM_DIR/Developer/Library/Frameworks/XCTest.framework",
    ],
    oncall = "react_native",
    deps = [
        ":RCTFabricApple",
        react_native_xplat_target("react/renderer/element:elementApple"),
        "//xplat/js/react-native-github:RCTFabricComponentViewsBaseApple",
        "//xplat/js/react-native-github:RCTTextApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/attributedstring:attributedstringApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/componentregistry:componentregistryApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/components/legacyviewmanagerinterop:legacyviewmanagerinteropApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/components/text:textApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/components/textinput/iostextinput:iostextinputApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/scheduler:schedulerApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/textlayoutmanager:textlayoutmanagerApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/runtimeexecutor:runtimeexecutorApple",
    ],
)

fb_apple_test(
    name = "MountingTestsApple",
    srcs = ["packages/react-native/React/Tests/Mounting/RCTComponentViewRegistryTests.mm"],
    frameworks = [
        "$PLATFORM_DIR/Developer/Library/Frameworks/XCTest.framework",
    ],
    oncall = "react_native",
    deps = [
        ":ImageView",
        ":RCTFabricApple",
        "//xplat/js/react-native-github:RCTFabricComponentViewsBaseApple",
        "//xplat/js/react-native-github:RCTTextApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/attributedstring:attributedstringApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/componentregistry:componentregistryApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/components/legacyviewmanagerinterop:legacyviewmanagerinteropApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/components/textinput/iostextinput:iostextinputApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/scheduler:schedulerApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/textlayoutmanager:textlayoutmanagerApple",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/runtimeexecutor:runtimeexecutorApple",
    ],
)

rn_apple_library(
    name = "ImageView",
    autoglob = False,
    compiler_flags = ["-Wall"],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    labels = [
        "disable_plugins_only_validation",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    plugins = [react_fabric_component_plugin_provider("Image", "RCTImageCls")],
    visibility = ["PUBLIC"],
    exported_deps = [
        ":RCTFabricComponentViewsBaseApple",
    ],
)

# Reduce the RCTFabric target by moving OSS RCTViewComponentViews here, so that
# eventually we can move all of React/Fabric/Mounting/ComponentViews/* here.
# Ideally, each component view gets its own target, and each target uses react_fabric_component_plugin_provider.
# For each component, an app can import the base component view, or an app-specific subclass.
# i.e. Apps depend on "ImageView" target for RCTImageComponentView.h, and "FBReactImageView" target for FBReactImageComponentView.h
rn_apple_xplat_cxx_library(
    name = "RCTFabricComponentViewsBase",
    srcs = glob(REACT_COMPONENTVIEWS_BASE_FILES),
    header_namespace = "",
    exported_headers = {
        "React/RCTComponentViewProtocol.h": "packages/react-native/React/Fabric/Mounting/RCTComponentViewProtocol.h",
        "React/RCTConversions.h": "packages/react-native/React/Fabric/RCTConversions.h",
        "React/RCTImageComponentView.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/Image/RCTImageComponentView.h",
        "React/RCTImageResponseDelegate.h": "packages/react-native/React/Fabric/RCTImageResponseDelegate.h",
        "React/RCTImageResponseObserverProxy.h": "packages/react-native/React/Fabric/RCTImageResponseObserverProxy.h",
        "React/RCTTouchableComponentViewProtocol.h": "packages/react-native/React/Fabric/RCTTouchableComponentViewProtocol.h",
        "React/RCTViewComponentView.h": "packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.h",
        "React/UIView+ComponentViewProtocol.h": "packages/react-native/React/Fabric/Mounting/UIView+ComponentViewProtocol.h",
    },
    compiler_flags = ["-Wall"],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:RCTImage",
        "//xplat/js/react-native-github:RCTLinking",
        react_native_xplat_target("react/renderer/imagemanager:imagemanager"),
        react_native_xplat_target("react/renderer/components/image:image"),
        react_native_xplat_target("react/renderer/components/view:view"),
        react_native_xplat_target("react/renderer/componentregistry:componentregistry"),
    ],
)

rn_library(
    name = "react-native",
    srcs = [
        "packages/react-native/package.json",
        "packages/react-native/index.js",
    ] + glob(
        [
            "packages/react-native/Libraries/**/*.js",
            "packages/react-native/Libraries/NewAppScreen/**/*.png",
            "packages/react-native/Libraries/LogBox/**/*.png",
            "packages/virtualized-lists/**/*.js",
            "packages/virtualized-lists/**/*.json",
        ],
        exclude = [
            "**/__*__/**",
            "**/gulpfile.js",
            "packages/react-native/Libraries/Components/Switch/SwitchSchema.js",
            "**/*._reactvr.js",
        ],
    ),
    labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js:node_modules__abort_19controller",
        "//xplat/js:node_modules__anser",
        "//xplat/js:node_modules__base64_19js",
        "//xplat/js:node_modules__deprecated_19react_19native_19prop_19types",
        "//xplat/js:node_modules__event_19target_19shim",
        "//xplat/js:node_modules__flow_19enums_19runtime",
        "//xplat/js:node_modules__invariant",
        "//xplat/js:node_modules__memoize_19one",
        "//xplat/js:node_modules__nullthrows",
        "//xplat/js:node_modules__pretty_19format",
        "//xplat/js:node_modules__promise",
        "//xplat/js:node_modules__react_19devtools_19core",
        "//xplat/js:node_modules__react_19refresh",
        "//xplat/js:node_modules__react_19shallow_19renderer",
        "//xplat/js:node_modules__regenerator_19runtime",
        "//xplat/js:node_modules__stacktrace_19parser",
        "//xplat/js:node_modules__whatwg_19fetch",
        "//xplat/js/RKJSModules/Libraries/Polyfills:Polyfills",
        "//xplat/js/RKJSModules/Libraries/React:React",
        "//xplat/js/RKJSModules/vendor/react:react",
        "//xplat/js/RKJSModules/vendor/react-test-renderer:react-test-renderer",
        "//xplat/js/RKJSModules/vendor/scheduler:scheduler",
        "//xplat/js/react-native-github/packages/assets:assets",
        "//xplat/js/react-native-github/packages/normalize-color:normalize-color",
        "//xplat/js/react-native-github/packages/polyfills:polyfills",
        "//xplat/js/tools/metro/packages/metro-runtime/src/modules:modules",
        "//xplat/js/tools/metro/packages/metro-runtime/src/polyfills:polyfills",
    ],
)

rn_codegen(
    name = "FBReactNativeSpec",
    android_package_name = "com.facebook.fbreact.specs",
    codegen_modules = True,
    ios_assume_nonnull = False,
    library_labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    native_module_spec_name = "FBReactNativeSpec",
    src_prefix = "packages/react-native/Libraries/",
)

# TODO: Merge this into FBReactNativeSpec
rn_codegen(
    name = "FBReactNativeComponentSpec",
    codegen_components = True,
    ios_assume_nonnull = False,
    library_labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    src_prefix = "packages/react-native/Libraries/",
)

rn_apple_library(
    name = "RCTAnimationApple",
    srcs = glob([
        "packages/react-native/Libraries/NativeAnimation/**/*.m",
        "packages/react-native/Libraries/NativeAnimation/**/*.mm",
    ]),
    headers = glob(
        [
            "packages/react-native/Libraries/NativeAnimation/**/*.h",
        ],
    ),
    header_namespace = "",
    exported_headers = glob(
        [
            "packages/react-native/Libraries/NativeAnimation/*.h",
            "packages/react-native/Libraries/NativeAnimation/Drivers/*.h",
            "packages/react-native/Libraries/NativeAnimation/Nodes/*.h",
        ],
    ),
    autoglob = False,
    frameworks = [
        "Foundation",
        "QuartzCore",
        "UIKit",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "disable_plugins_only_validation",
        "extension_api_allow_unsafe_unavailable_usages",
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
        "talkios_link_group:xplat/default/public.react_native.infra",
    ],
    plugins =
        react_module_plugin_providers(
            name = "NativeAnimatedModule",
            native_class_func = "RCTNativeAnimatedModuleCls",
        ) + react_module_plugin_providers(
            name = "NativeAnimatedTurboModule",
            native_class_func = "RCTNativeAnimatedTurboModuleCls",
        ),
    plugins_header = "FBRCTAnimationPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:RCTLinkingApple",
        "//xplat/js/react-native-github:RCTPushNotificationApple",
        "//xplat/js/react-native-github:ReactInternalApple",
    ],
)

rn_apple_library(
    name = "RCTBlobApple",
    srcs = glob([
        "packages/react-native/Libraries/Blob/*.m",
        "packages/react-native/Libraries/Blob/*.mm",
    ]),
    headers = glob(
        [
            "packages/react-native/Libraries/Blob/*.h",
        ],
    ),
    exported_headers = glob(
        [
            "packages/react-native/Libraries/Blob/*.h",
        ],
    ),
    autoglob = False,
    enable_exceptions = True,
    frameworks = [
        "Foundation",
        "UIKit",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "disable_plugins_only_validation",
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    plugins =
        react_module_plugin_providers(
            name = "FileReaderModule",
            native_class_func = "RCTFileReaderModuleCls",
        ) + react_module_plugin_providers(
            name = "BlobModule",
            native_class_func = "RCTBlobManagerCls",
        ) + [
            plugin(
                RCT_URL_REQUEST_HANDLER_SOCKET,
                name = "BlobModule",
            ),
        ],
    plugins_header = "FBRCTBlobPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        ":RCTNetworkApple",
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:RCTLinkingApple",
        "//xplat/js/react-native-github:RCTPushNotificationApple",
        "//xplat/js/react-native-github:ReactInternalApple",
        "//xplat/js/react-native-github/packages/react-native/React/CoreModules:CoreModulesApple",
        "//xplat/jsi:jsiApple",
    ],
)

rn_apple_library(
    name = "RCTLinkingApple",
    srcs = glob([
        "packages/react-native/Libraries/LinkingIOS/*.m",
        "packages/react-native/Libraries/LinkingIOS/*.mm",
    ]),
    headers = glob(
        [
            "packages/react-native/Libraries/LinkingIOS/*.h",
        ],
    ),
    exported_headers = glob(
        [
            "packages/react-native/Libraries/LinkingIOS/*.h",
        ],
    ),
    autoglob = False,
    enable_exceptions = True,
    frameworks = [
        "Foundation",
        "UIKit",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "disable_plugins_only_validation",
        "extension_api_allow_unsafe_unavailable_usages",
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
        "talkios_link_group:xplat/default/public.react_native.infra",
    ],
    plugins =
        react_module_plugin_providers(
            name = "LinkingManager",
            native_class_func = "RCTLinkingManagerCls",
        ),
    plugins_header = "FBRCTLinkingPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:RCTPushNotificationApple",
        "//xplat/js/react-native-github:ReactInternalApple",
        "//xplat/jsi:jsiApple",
    ],
)

rn_apple_library(
    name = "RCTPushNotificationApple",
    srcs = glob([
        "packages/react-native/Libraries/PushNotificationIOS/*.m",
        "packages/react-native/Libraries/PushNotificationIOS/*.mm",
    ]),
    headers = glob(
        [
            "packages/react-native/Libraries/PushNotificationIOS/*.h",
        ],
    ),
    exported_headers = glob(
        [
            "packages/react-native/Libraries/PushNotificationIOS/*.h",
        ],
    ),
    autoglob = False,
    enable_exceptions = True,
    frameworks = [
        "Foundation",
        "UIKit",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "disable_plugins_only_validation",
        "extension_api_allow_unsafe_unavailable_usages",
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
        "talkios_link_group:xplat/default/public.react_native.infra",
    ],
    plugins =
        react_module_plugin_providers(
            name = "PushNotificationManager",
            native_class_func = "RCTPushNotificationManagerCls",
        ),
    plugins_header = "FBRCTPushNotificationPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:ReactInternalApple",
        "//xplat/jsi:jsiApple",
    ],
)

rn_apple_library(
    name = "RCTImageApple",
    srcs = glob([
        "packages/react-native/Libraries/Image/*.m",
        "packages/react-native/Libraries/Image/*.mm",
    ]),
    headers = glob(
        [
            "packages/react-native/Libraries/Image/*.h",
        ],
    ),
    exported_headers = glob(
        [
            "packages/react-native/Libraries/Image/*.h",
        ],
    ),
    autoglob = False,
    frameworks = [
        "AVFoundation",
        "Accelerate",
        "CoreMedia",
        "Foundation",
        "ImageIO",
        "MobileCoreServices",
        "QuartzCore",
        "UIKit",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "disable_plugins_only_validation",
        "extension_api_allow_unsafe_unavailable_usages",
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
        "talkios_link_group:xplat/default/public.react_native.infra",
    ],
    plugins =
        react_module_plugin_providers(
            name = "GIFImageDecoder",
            native_class_func = "RCTGIFImageDecoderCls",
        ) + react_module_plugin_providers(
            name = "ImageEditingManager",
            native_class_func = "RCTImageEditingManagerCls",
        ) + react_module_plugin_providers(
            name = "ImageLoader",
            native_class_func = "RCTImageLoaderCls",
        ) + react_module_plugin_providers(
            name = "ImageStoreManager",
            native_class_func = "RCTImageStoreManagerCls",
        ) + react_module_plugin_providers(
            name = "LocalAssetImageLoader",
            native_class_func = "RCTLocalAssetImageLoaderCls",
        ) + [
            plugin(
                RCT_IMAGE_DATA_DECODER_SOCKET,
                name = "GIFImageDecoder",
            ),
            plugin(
                RCT_IMAGE_URL_LOADER_SOCKET,
                name = "LocalAssetImageLoader",
            ),
            plugin(
                RCT_URL_REQUEST_HANDLER_SOCKET,
                name = "ImageLoader",
            ),
            plugin(
                RCT_URL_REQUEST_HANDLER_SOCKET,
                name = "ImageStoreManager",
            ),
        ],
    plugins_header = "FBRCTImagePlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        ":RCTNetworkApple",
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:RCTLinkingApple",
        "//xplat/js/react-native-github:RCTPushNotificationApple",
        "//xplat/js/react-native-github:ReactInternalApple",
    ],
)

RCTNETWORK_PUBLIC_HEADERS = [
    "packages/react-native/Libraries/Network/RCTNetworkTask.h",
    "packages/react-native/Libraries/Network/RCTNetworking.h",
]

rn_apple_library(
    name = "RCTNetworkApple",
    srcs = glob([
        "packages/react-native/Libraries/Network/*.m",
        "packages/react-native/Libraries/Network/*.mm",
    ]),
    headers = glob(
        [
            "packages/react-native/Libraries/Network/*.h",
        ],
        exclude = RCTNETWORK_PUBLIC_HEADERS,
    ),
    exported_headers = RCTNETWORK_PUBLIC_HEADERS,
    autoglob = False,
    enable_exceptions = True,
    frameworks = [
        "CoreTelephony",
        "Foundation",
        "MobileCoreServices",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "disable_plugins_only_validation",
        "extension_api_allow_unsafe_unavailable_usages",
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
        "talkios_link_group:xplat/default/public.react_native.infra",
    ],
    plugins =
        react_module_plugin_providers(
            name = "Networking",
            native_class_func = "RCTNetworkingCls",
        ) + react_module_plugin_providers(
            name = "DataRequestHandler",
            native_class_func = "RCTDataRequestHandlerCls",
        ) + react_module_plugin_providers(
            name = "FileRequestHandler",
            native_class_func = "RCTFileRequestHandlerCls",
        ) + react_module_plugin_providers(
            name = "HTTPRequestHandler",
            native_class_func = "RCTHTTPRequestHandlerCls",
        ) + [
            plugin(
                RCT_URL_REQUEST_HANDLER_SOCKET,
                name = "DataRequestHandler",
            ),
            plugin(
                RCT_URL_REQUEST_HANDLER_SOCKET,
                name = "FileRequestHandler",
            ),
            plugin(
                RCT_URL_REQUEST_HANDLER_SOCKET,
                name = "HTTPRequestHandler",
            ),
        ],
    plugins_header = "FBRCTNetworkPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:RCTLinkingApple",
        "//xplat/js/react-native-github:RCTPushNotificationApple",
        "//xplat/js/react-native-github:ReactInternalApple",
    ],
)

rn_apple_library(
    name = "RCTSettingsApple",
    srcs = glob([
        "packages/react-native/Libraries/Settings/*.m",
        "packages/react-native/Libraries/Settings/*.mm",
    ]),
    exported_headers = glob(
        [
            "packages/react-native/Libraries/Settings/*.h",
        ],
    ),
    autoglob = False,
    extension_api_only = True,
    frameworks = [
        "Foundation",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "disable_plugins_only_validation",
    ],
    plugins = react_module_plugin_providers(
        name = "SettingsManager",
        native_class_func = "RCTSettingsManagerCls",
    ),
    plugins_header = "FBRCTSettingsPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:RCTLinkingApple",
        "//xplat/js/react-native-github:RCTPushNotificationApple",
        "//xplat/js/react-native-github:ReactInternalApple",
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTText",
    srcs = glob([
        "packages/react-native/Libraries/Text/**/*.m",
        "packages/react-native/Libraries/Text/**/*.mm",
    ]),
    headers = glob(
        [
            "packages/react-native/Libraries/Text/**/*.h",
        ],
    ),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "packages/react-native/Libraries/Text",
                "*.h",
            ),
            (
                "packages/react-native/Libraries/Text/BaseText",
                "*.h",
            ),
            (
                "packages/react-native/Libraries/Text/RawText",
                "*.h",
            ),
            (
                "packages/react-native/Libraries/Text/Text",
                "*.h",
            ),
            (
                "packages/react-native/Libraries/Text/TextInput",
                "*.h",
            ),
            (
                "packages/react-native/Libraries/Text/TextInput/Multiline",
                "*.h",
            ),
            (
                "packages/react-native/Libraries/Text/TextInput/Singleline",
                "*.h",
            ),
            (
                "packages/react-native/Libraries/Text/VirtualText",
                "*.h",
            ),
        ],
        prefix = "React",
    ),
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/UIKit.framework",
    ],
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:RCTLinking",
        "//xplat/js/react-native-github:RCTPushNotification",
        "//xplat/js/react-native-github:ReactInternal",
        YOGA_CXX_TARGET,
    ],
)

rn_apple_library(
    name = "RCTVibrationApple",
    srcs = glob([
        "packages/react-native/Libraries/Vibration/**/*.m",
        "packages/react-native/Libraries/Vibration/**/*.mm",
    ]),
    exported_headers = glob(
        [
            "packages/react-native/Libraries/Vibration/*.h",
        ],
    ),
    autoglob = False,
    frameworks = [
        "AudioToolbox",
        "Foundation",
    ],
    header_path_prefix = "React",
    labels = [
        "depslint_never_remove",
        "disable_plugins_only_validation",
        "fbios_link_group:xplat/default/public.react_native.infra",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    plugins = react_module_plugin_providers(
        name = "Vibration",
        native_class_func = "RCTVibrationCls",
    ),
    plugins_header = "FBRCTVibrationPlugins.h",
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + rn_extra_build_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:FBReactNativeSpecApple",
        "//xplat/js/react-native-github:RCTLinkingApple",
        "//xplat/js/react-native-github:RCTPushNotificationApple",
        "//xplat/js/react-native-github:ReactInternalApple",
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTWrapper",
    srcs = glob([
        "packages/react-native/Libraries/Wrapper/*.m",
        "packages/react-native/Libraries/Wrapper/*.mm",
    ]),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "packages/react-native/Libraries/Wrapper",
                "*.h",
            ),
        ],
        prefix = "RCTWrapper",
    ),
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
    ],
    labels = [
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js/react-native-github:RCTLinking",
        "//xplat/js/react-native-github:RCTPushNotification",
        "//xplat/js/react-native-github:ReactInternal",
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTWrapperExample",
    srcs = glob([
        "packages/react-native/Libraries/Wrapper/Example/*.m",
        "packages/react-native/Libraries/Wrapper/Example/*.mm",
    ]),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "packages/react-native/Libraries/Wrapper/Example",
                "*.h",
            ),
        ],
        prefix = "RCTWrapperExample",
    ),
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
    ],
    labels = [
        "depslint_never_remove",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        ":RCTWrapper",
        "//xplat/js/react-native-github:RCTLinking",
        "//xplat/js/react-native-github:RCTPushNotification",
        "//xplat/js/react-native-github:ReactInternal",
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTSurfaceHostingComponent",
    srcs = glob([
        "packages/react-native/Libraries/SurfaceHostingComponent/**/*.m",
        "packages/react-native/Libraries/SurfaceHostingComponent/**/*.mm",
    ]),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "packages/react-native/Libraries/SurfaceHostingComponent",
                "*.h",
            ),
        ],
        prefix = "RCTSurfaceHostingComponent",
    ),
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
        "$SDKROOT/System/Library/Frameworks/UIKit.framework",
    ],
    labels = [
        "depslint_never_remove",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        "//fbobjc/Libraries/MobileUI/ComponentKit:ComponentKit",
        "//xplat/js/react-native-github:RCTFabric",
        "//xplat/js/react-native-github:RCTLinking",
        "//xplat/js/react-native-github:RCTPushNotification",
        "//xplat/js/react-native-github:ReactInternal",
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTSurfaceBackedComponent",
    srcs = glob([
        "packages/react-native/Libraries/SurfaceBackedComponent/**/*.m",
        "packages/react-native/Libraries/SurfaceBackedComponent/**/*.mm",
    ]),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "packages/react-native/Libraries/SurfaceBackedComponent",
                "*.h",
            ),
        ],
        prefix = "RCTSurfaceBackedComponent",
    ),
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
        "$SDKROOT/System/Library/Frameworks/UIKit.framework",
    ],
    labels = [
        "depslint_never_remove",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        ":RCTSurfaceHostingComponent",
        "//fbobjc/Libraries/MobileUI/ComponentKit:ComponentKit",
        "//xplat/js/react-native-github:RCTFabric",
        "//xplat/js/react-native-github:RCTLinking",
        "//xplat/js/react-native-github:RCTPushNotification",
        "//xplat/js/react-native-github:ReactInternal",
    ],
)

rn_apple_xplat_cxx_library(
    name = "RCTMapView_RNHeader",
    header_namespace = "",
    exported_headers = {
        "React/RCTConvert+CoreLocation.h": RCTVIEWS_PATH + "RCTConvert+CoreLocation.h",
    },
    labels = [
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    visibility = [
        "//fbobjc/Libraries/FBReactKit:RCTMapView",
        "//fbobjc/VendorLib/react-native-maps:react-native-maps",
    ],
)

rn_xplat_cxx_library(
    name = "RCTWebPerformance",
    srcs = glob(
        [
            "packages/react-native/Libraries/WebPerformance/**/*.cpp",
        ],
        exclude = ["packages/react-native/Libraries/WebPerformance/__tests__/*"],
    ),
    header_namespace = "",
    exported_headers = subdir_glob(
        [("packages/react-native/Libraries/WebPerformance", "*.h")],
        prefix = "RCTWebPerformance",
    ),
    compiler_flags_enable_exceptions = True,
    compiler_flags_enable_rtti = True,
    labels = [
        "depslint_never_remove",
        "pfh:ReactNative_CommonInfrastructurePlaceholder",
    ],
    platforms = (ANDROID, APPLE),
    plugins = [
        react_cxx_module_plugin_provider(
            name = "NativePerformanceCxx",
            function = "NativePerformanceModuleProvider",
        ),
        react_cxx_module_plugin_provider(
            name = "NativePerformanceObserverCxx",
            function = "NativePerformanceObserverModuleProvider",
        ),
    ],
    visibility = ["PUBLIC"],
    deps = [
        ":FBReactNativeSpecJSI",
        react_native_xplat_target("react/renderer/core:core"),
        react_native_xplat_target("cxxreact:bridge"),
    ],
)

fb_xplat_cxx_test(
    name = "RCTWebPerformance_tests",
    srcs = glob([
        "packages/react-native/Libraries/WebPerformance/__tests__/*.cpp",
    ]),
    headers = glob(["packages/react-native/Libraries/WebPerformance/__tests__/*.h"]),
    header_namespace = "",
    compiler_flags = [
        "-fexceptions",
        "-frtti",
        "-std=c++17",
        "-Wall",
    ],
    platforms = (ANDROID, APPLE),
    deps = [
        ":RCTWebPerformance",
        "//xplat/third-party/gmock:gmock",
        "//xplat/third-party/gmock:gtest",
    ],
)
