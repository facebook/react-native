load("@fbsource//tools/build_defs:fb_native_wrapper.bzl", "fb_native")
load("@fbsource//tools/build_defs:glob_defs.bzl", "subdir_glob")
load("@fbsource//tools/build_defs:platform_defs.bzl", "APPLETVOS", "IOS")
load("@fbsource//tools/build_defs/apple:config_utils_defs.bzl", "STATIC_LIBRARY_APPLETVOS_CONFIG", "fbobjc_configs")
load("@fbsource//tools/build_defs/apple:fb_apple_test.bzl", "fb_apple_test")
load("@fbsource//tools/build_defs/apple:flag_defs.bzl", "get_base_appletvos_flags", "get_objc_arc_preprocessor_flags", "get_preprocessor_flags_for_build_mode", "get_static_library_ios_flags")
load("@fbsource//tools/build_defs/oss:metro_defs.bzl", "rn_library")
load("@fbsource//tools/build_defs/oss:rn_defs.bzl", "YOGA_CXX_TARGET", "react_native_xplat_dep", "react_native_xplat_target", "rn_apple_library")
load("@fbsource//tools/build_defs/third_party:yarn_defs.bzl", "yarn_workspace")
load(
    "@fbsource//xplat/configurations/buck/apple/plugins/sad_xplat_hosted_configurations:react_components_registration.bzl",
    "react_fabric_component_plugin_provider",
)
load("@fbsource//xplat/hermes/defs:hermes.bzl", "HERMES_BYTECODE_VERSION")
load("@fbsource//xplat/js:rn_xplat_defs.bzl", "rn_extra_build_flags", "rn_xplat_cxx_library")
load("@fbsource//xplat/js/react-native-github/packages/react-native-codegen:DEFS.bzl", "rn_codegen_components")
load(
    "//tools/build_defs/oss:rn_codegen_defs.bzl",
    "rn_codegen",
)

RCTCXXBRIDGE_PUBLIC_HEADERS = {
    "React/" + x: "React/CxxBridge/" + x
    for x in [
        "JSCExecutorFactory.h",
        "NSDataBigString.h",
        "RCTCxxBridgeDelegate.h",
        "RCTMessageThread.h",
    ]
}

fb_native.genrule(
    name = "codegen_rn_components_schema_rncore",
    srcs = glob(
        [
            "**/*NativeComponent.js",
        ],
        exclude = [
            "**/__*__/**",

            # Subfolders with their own BUCK files, referenced below
            "packages/rn-tester/**",
        ],
    ) + [
        "//xplat/js/react-native-github/packages/rn-tester:nativecomponent-srcs",
    ],
    cmd = "$(exe //xplat/js/react-native-github/packages/react-native-codegen:write_to_json) $OUT $SRCS",
    out = "schema-rncore.json",
)

rn_codegen_components(
    name = "rncore",
    schema_target = ":codegen_rn_components_schema_rncore",
)

rn_xplat_cxx_library(
    name = "RCTCxxBridge",
    srcs = glob([
        "React/CxxBridge/*.mm",
    ]),
    headers = subdir_glob(
        [
            (
                "React/CxxBridge",
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
        "supermodule:xplat/default/public.react_native.infra",
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
        "//xplat/folly:molly",
        "//xplat/js/react-native-github/React/CoreModules:CoreModules",
        react_native_xplat_target("cxxreact:bridge"),
        react_native_xplat_target("cxxreact:jsbigstring"),
        react_native_xplat_target("jsi:JSCRuntime"),
        react_native_xplat_target("jsiexecutor:jsiexecutor"),
        react_native_xplat_target("reactperflogger:reactperflogger"),
    ],
)

RCTCXXMODULE_PUBLIC_HEADERS = {
    "React/" + x: "React/CxxModule/" + x
    for x in [
        "RCTCxxMethod.h",
        "RCTCxxModule.h",
        "RCTCxxUtils.h",
    ]
}

rn_xplat_cxx_library(
    name = "RCTCxxModule",
    srcs = glob([
        "React/CxxModule/*.mm",
    ]),
    headers = subdir_glob(
        [
            (
                "React/CxxModule",
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
    labels = ["supermodule:xplat/default/public.react_native.infra"],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + ["-DWITH_FBSYSTRACE=1"],
    visibility = ["PUBLIC"],
    deps = [
        ":RCTCxxUtils",
        ":ReactInternal",
        "//xplat/fbsystrace:fbsystrace",
        "//xplat/folly:headers_only",
        react_native_xplat_target("cxxreact:module"),
        react_native_xplat_target("cxxreact:bridge"),
        react_native_xplat_target("reactperflogger:reactperflogger"),
        react_native_xplat_dep("jsi:jsi"),
    ],
)

rn_xplat_cxx_library(
    name = "RCTCxxUtils",
    srcs = glob([
        "React/CxxUtils/*.mm",
    ]),
    header_namespace = "",
    exported_headers = subdir_glob(
        [
            (
                "React/CxxUtils",
                "*.h",
            ),
        ],
        exclude = RCTCXXMODULE_PUBLIC_HEADERS.values(),
        prefix = "React",
    ),
    apple_sdks = (IOS, APPLETVOS),
    appletvos_configs = fbobjc_configs(STATIC_LIBRARY_APPLETVOS_CONFIG),
    appletvos_inherited_buck_flags = get_base_appletvos_flags(),
    contacts = ["oncall+react_native@xmail.facebook.com"],
    fbobjc_enable_exceptions = True,
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
    ],
    labels = ["supermodule:xplat/default/public.react_native.infra"],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/folly:molly",
    ],
)

RCTLIB_PATH = "Libraries/"

RCTBASE_PATH = "React/Base/"

RCTCOREMODULES_PATH = "React/CoreModules/"

RCTDEVSUPPORT_PATH = "React/DevSupport/"

RCTMODULES_PATH = "React/Modules/"

RCTVIEWS_PATH = "React/Views/"

REACT_PUBLIC_HEADERS = {
    "React/RCTAnimationType.h": RCTVIEWS_PATH + "RCTAnimationType.h",
    "React/RCTAssert.h": RCTBASE_PATH + "RCTAssert.h",
    "React/RCTAutoInsetsProtocol.h": RCTVIEWS_PATH + "RCTAutoInsetsProtocol.h",
    "React/RCTBorderDrawing.h": RCTVIEWS_PATH + "RCTBorderDrawing.h",
    "React/RCTBorderStyle.h": RCTVIEWS_PATH + "RCTBorderStyle.h",
    "React/RCTBridge+Private.h": RCTBASE_PATH + "RCTBridge+Private.h",
    "React/RCTBridge.h": RCTBASE_PATH + "RCTBridge.h",
    "React/RCTBridgeDelegate.h": RCTBASE_PATH + "RCTBridgeDelegate.h",
    "React/RCTBridgeMethod.h": RCTBASE_PATH + "RCTBridgeMethod.h",
    "React/RCTBridgeModule.h": RCTBASE_PATH + "RCTBridgeModule.h",
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
    "React/RCTErrorCustomizer.h": RCTBASE_PATH + "RCTErrorCustomizer.h",
    "React/RCTErrorInfo.h": RCTBASE_PATH + "RCTErrorInfo.h",
    "React/RCTEventDispatcher.h": RCTCOREMODULES_PATH + "RCTEventDispatcher.h",
    "React/RCTEventDispatcherProtocol.h": RCTBASE_PATH + "RCTEventDispatcherProtocol.h",
    "React/RCTEventEmitter.h": RCTMODULES_PATH + "RCTEventEmitter.h",
    "React/RCTFont.h": RCTVIEWS_PATH + "RCTFont.h",
    "React/RCTFrameUpdate.h": RCTBASE_PATH + "RCTFrameUpdate.h",
    "React/RCTI18nUtil.h": RCTMODULES_PATH + "RCTI18nUtil.h",
    "React/RCTImageSource.h": RCTBASE_PATH + "RCTImageSource.h",
    "React/RCTInitializing.h": RCTBASE_PATH + "RCTInitializing.h",
    "React/RCTInspector.h": "React/Inspector/RCTInspector.h",
    "React/RCTInspectorDevServerHelper.h": RCTDEVSUPPORT_PATH + "RCTInspectorDevServerHelper.h",
    "React/RCTInspectorPackagerConnection.h": "React/Inspector/RCTInspectorPackagerConnection.h",
    "React/RCTInvalidating.h": RCTBASE_PATH + "RCTInvalidating.h",
    "React/RCTJSScriptLoaderModule.h": RCTBASE_PATH + "RCTJSScriptLoaderModule.h",
    "React/RCTJSStackFrame.h": RCTBASE_PATH + "RCTJSStackFrame.h",
    "React/RCTJavaScriptExecutor.h": RCTBASE_PATH + "RCTJavaScriptExecutor.h",
    "React/RCTJavaScriptLoader.h": RCTBASE_PATH + "RCTJavaScriptLoader.h",
    "React/RCTKeyCommands.h": RCTBASE_PATH + "RCTKeyCommands.h",
    "React/RCTLayout.h": RCTVIEWS_PATH + "RCTLayout.h",
    "React/RCTLayoutAnimation.h": RCTMODULES_PATH + "RCTLayoutAnimation.h",
    "React/RCTLayoutAnimationGroup.h": RCTMODULES_PATH + "RCTLayoutAnimationGroup.h",
    "React/RCTLog.h": RCTBASE_PATH + "RCTLog.h",
    "React/RCTManagedPointer.h": RCTBASE_PATH + "RCTManagedPointer.h",
    "React/RCTModalHostViewController.h": RCTVIEWS_PATH + "RCTModalHostViewController.h",
    "React/RCTModalHostViewManager.h": RCTVIEWS_PATH + "RCTModalHostViewManager.h",
    "React/RCTModalManager.h": RCTVIEWS_PATH + "RCTModalManager.h",
    "React/RCTModuleData.h": RCTBASE_PATH + "RCTModuleData.h",
    "React/RCTModuleMethod.h": RCTBASE_PATH + "RCTModuleMethod.h",
    "React/RCTMultipartStreamReader.h": RCTBASE_PATH + "RCTMultipartStreamReader.h",
    "React/RCTNullability.h": RCTBASE_PATH + "RCTNullability.h",
    "React/RCTPackagerClient.h": RCTDEVSUPPORT_PATH + "RCTPackagerClient.h",
    "React/RCTPackagerConnection.h": RCTDEVSUPPORT_PATH + "RCTPackagerConnection.h",
    "React/RCTPerformanceLogger.h": RCTBASE_PATH + "RCTPerformanceLogger.h",
    "React/RCTPointerEvents.h": RCTVIEWS_PATH + "RCTPointerEvents.h",
    "React/RCTProfile.h": "React/Profiler/RCTProfile.h",
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
    "React/RCTSRWebSocket.h": RCTLIB_PATH + "WebSocket/RCTSRWebSocket.h",
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
    "React/RCTUIManager.h": RCTMODULES_PATH + "RCTUIManager.h",
    "React/RCTUIManagerObserverCoordinator.h": RCTMODULES_PATH + "RCTUIManagerObserverCoordinator.h",
    "React/RCTUIManagerUtils.h": RCTMODULES_PATH + "RCTUIManagerUtils.h",
    "React/RCTUIUtils.h": "React/UIUtils/RCTUIUtils.h",
    "React/RCTURLRequestDelegate.h": RCTBASE_PATH + "RCTURLRequestDelegate.h",
    "React/RCTURLRequestHandler.h": RCTBASE_PATH + "RCTURLRequestHandler.h",
    "React/RCTUtils.h": RCTBASE_PATH + "RCTUtils.h",
    "React/RCTUtilsUIOverride.h": RCTBASE_PATH + "RCTUtilsUIOverride.h",
    "React/RCTVersion.h": RCTBASE_PATH + "RCTVersion.h",
    "React/RCTView.h": RCTVIEWS_PATH + "RCTView.h",
    "React/RCTViewManager.h": RCTVIEWS_PATH + "RCTViewManager.h",
    "React/RCTWeakProxy.h": RCTBASE_PATH + "RCTWeakProxy.h",
    "React/RCTWeakViewHolder.h": RCTVIEWS_PATH + "RCTWeakViewHolder.h",
    "React/RCTWrapperViewController.h": RCTVIEWS_PATH + "RCTWrapperViewController.h",
    "React/UIView+React.h": RCTVIEWS_PATH + "UIView+React.h",
}

REACT_COMPONENTVIEWS_BASE_FILES = [
    "React/Fabric/Mounting/ComponentViews/Image/*.mm",
    "React/Fabric/RCTImageResponseObserverProxy.mm",
    "React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm",
]

rn_xplat_cxx_library(
    name = "ReactInternal",
    srcs = glob(
        [
            "React/Base/**/*.m",
            "React/Base/**/*.mm",
            "React/DevSupport/**/*.m",
            "React/DevSupport/**/*.mm",
            "React/Inspector/**/*.m",
            "React/Inspector/**/*.mm",
            "React/Modules/**/*.m",
            "React/Modules/**/*.mm",
            "React/Profiler/**/*.m",
            "React/Profiler/**/*.mm",
            "React/Profiler/**/*.S",
            "React/UIUtils/*.m",
            "React/Views/**/*.m",
            "React/Views/**/*.mm",
            "Libraries/ActionSheetIOS/*.m",
            "Libraries/WebSocket/*.m",
        ],
    ),
    headers = glob(
        [
            "React/Base/**/*.h",
            "React/DevSupport/**/*.h",
            "React/Inspector/**/*.h",
            "React/Modules/**/*.h",
            "React/Profiler/**/*.h",
            "React/Views/**/*.h",
            "React/UIUtils/**/*.h",
            "Libraries/ActionSheetIOS/*.h",
            "Libraries/WebSocket/*.h",
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
    exported_linker_flags = [
        "-weak_framework",
        "UserNotifications",
        "-weak_framework",
        "WebKit",
    ],
    exported_preprocessor_flags = rn_extra_build_flags(),
    fbobjc_enable_exceptions = True,
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/CFNetwork.framework",
        "$SDKROOT/System/Library/Frameworks/CoreGraphics.framework",
        "$SDKROOT/System/Library/Frameworks/CoreLocation.framework",
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
        "$SDKROOT/System/Library/Frameworks/MapKit.framework",
        "$SDKROOT/System/Library/Frameworks/QuartzCore.framework",
        "$SDKROOT/System/Library/Frameworks/Security.framework",
        "$SDKROOT/System/Library/Frameworks/SystemConfiguration.framework",
        "$SDKROOT/System/Library/Frameworks/UIKit.framework",
        "$SDKROOT/System/Library/Frameworks/UserNotifications.framework",
    ],
    labels = [
        "depslint_never_add",
        "depslint_never_remove",  # Some old NativeModule still relies on +load unfortunately.
        "supermodule:xplat/default/public.react_native.infra",
    ],
    platform_preprocessor_flags = [(
        "linux",
        ["-D PIC_MODIFIER=@PLT"],
    )],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode() + [
        "-DHERMES_BYTECODE_VERSION={}".format(HERMES_BYTECODE_VERSION),
    ] + rn_extra_build_flags(),
    visibility = [
        "//fbobjc/Apps/Internal/SparkLabs/...",
        "//fbobjc/Apps/Internal/Venice/...",
        "//fbobjc/Apps/Wilde/FBMarketplaceModule/...",
        "//fbobjc/Apps/Wilde/FBReactModule2/...",
        "//fbobjc/Libraries/FBQPLMetadataProviders/...",
        "//fbobjc/Libraries/FBReactKit/...",
        "//fbobjc/Libraries/FBiOSSecurityUtils/...",
        "//fbobjc/VendorLib/react-native-maps:react-native-maps",
        "//xplat/js:",
        "//xplat/js/react-native-github/React/...",
        "//xplat/js/react-native-github/ReactCommon/react/nativemodule/core:",
        "//xplat/js/react-native-github/ReactCommon/react/nativemodule/samples:",
    ],
    deps = [
        YOGA_CXX_TARGET,
        react_native_xplat_target("cxxreact:bridge"),
        react_native_xplat_target("reactperflogger:reactperflogger"),
    ],
)

rn_xplat_cxx_library(
    name = "RCTFabric",
    srcs = glob(
        [
            "React/Fabric/**/*.cpp",
            "React/Fabric/**/*.m",
            "React/Fabric/**/*.mm",
        ],
        exclude = glob(REACT_COMPONENTVIEWS_BASE_FILES),
    ),
    headers = glob(
        [
            "React/Fabric/**/*.h",
        ],
    ),
    header_namespace = "",
    exported_headers = {
        "React/RCTComponentViewDescriptor.h": "React/Fabric/Mounting/RCTComponentViewDescriptor.h",
        "React/RCTComponentViewFactory.h": "React/Fabric/Mounting/RCTComponentViewFactory.h",
        "React/RCTComponentViewRegistry.h": "React/Fabric/Mounting/RCTComponentViewRegistry.h",
        "React/RCTFabricSurface.h": "React/Fabric/Surface/RCTFabricSurface.h",
        "React/RCTFabricSurfaceHostingProxyRootView.h": "React/Fabric/Surface/RCTFabricSurfaceHostingProxyRootView.h",
        "React/RCTFabricSurfaceHostingView.h": "React/Fabric/Surface/RCTFabricSurfaceHostingView.h",
        "React/RCTGenericDelegateSplitter.h": "React/Fabric/Utils/RCTGenericDelegateSplitter.h",
        "React/RCTLegacyViewManagerInteropComponentView.h": "React/Fabric/Mounting/ComponentViews/LegacyViewManagerInterop/RCTLegacyViewManagerInteropComponentView.h",
        "React/RCTLocalizationProvider.h": "React/Fabric/RCTLocalizationProvider.h",
        "React/RCTModalHostViewComponentView.h": "React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.h",
        "React/RCTMountingManager.h": "React/Fabric/Mounting/RCTMountingManager.h",
        "React/RCTMountingManagerDelegate.h": "React/Fabric/Mounting/RCTMountingManagerDelegate.h",
        "React/RCTMountingTransactionObserving.h": "React/Fabric/Mounting/RCTMountingTransactionObserving.h",
        "React/RCTParagraphComponentAccessibilityProvider.h": "React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentAccessibilityProvider.h",
        "React/RCTParagraphComponentView.h": "React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentView.h",
        "React/RCTPrimitives.h": "React/Fabric/RCTPrimitives.h",
        "React/RCTRootComponentView.h": "React/Fabric/Mounting/ComponentViews/Root/RCTRootComponentView.h",
        "React/RCTScheduler.h": "React/Fabric/RCTScheduler.h",
        "React/RCTScrollViewComponentView.h": "React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.h",
        "React/RCTSurfacePresenter.h": "React/Fabric/RCTSurfacePresenter.h",
        "React/RCTSurfacePresenterBridgeAdapter.h": "React/Fabric/RCTSurfacePresenterBridgeAdapter.h",
        "React/RCTSurfaceRegistry.h": "React/Fabric/RCTSurfaceRegistry.h",
        "React/RCTSurfaceTouchHandler.h": "React/Fabric/RCTSurfaceTouchHandler.h",
    },
    compiler_flags = [
        "-fexceptions",
        "-frtti",
        "-std=c++17",
        "-Wall",
    ],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    fbobjc_enable_exceptions = True,
    fbobjc_target_sdk_version = "11.0",
    frameworks = [
        "$SDKROOT/System/Library/Frameworks/Foundation.framework",
        "$SDKROOT/System/Library/Frameworks/QuartzCore.framework",
        "$SDKROOT/System/Library/Frameworks/UIKit.framework",
    ],
    header_path_prefix = "React",
    labels = [
        "disable_plugins_only_validation",
        "supermodule:xplat/default/public.react_native.infra",
    ],
    plugins = [
        react_fabric_component_plugin_provider("SafeAreaView", "RCTSafeAreaViewCls"),
        react_fabric_component_plugin_provider("ScrollView", "RCTScrollViewCls"),
        react_fabric_component_plugin_provider("PullToRefreshView", "RCTPullToRefreshViewCls"),
        react_fabric_component_plugin_provider("ActivityIndicatorView", "RCTActivityIndicatorViewCls"),
        react_fabric_component_plugin_provider("Slider", "RCTSliderCls"),
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
        "//xplat/js:RCTImage",
        "//xplat/js:RCTPushNotification",
        "//xplat/js:RCTText",
        "//xplat/js/react-native-github:RCTCxxBridge",
        "//xplat/js/react-native-github:RCTCxxUtils",
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
        react_native_xplat_target("react/renderer/components/slider:slider"),
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
        "Libraries/TypeSafety/**/*.mm",
    ]),
    exported_headers = glob(
        [
            "Libraries/TypeSafety/**/*.h",
        ],
    ),
    autoglob = False,
    contacts = ["oncall+react_native@xmail.facebook.com"],
    extension_api_only = True,
    frameworks = [
        "$PLATFORM_DIR/Developer/Library/Frameworks/Foundation.framework",
    ],
    inherited_buck_flags = get_static_library_ios_flags(),
    labels = ["supermodule:xplat/default/public.react_native.infra"],
    preprocessor_flags = get_objc_arc_preprocessor_flags() + get_preprocessor_flags_for_build_mode(),
    reexport_all_header_dependencies = True,
    deps = [
        ":ReactInternalApple",
        "//xplat/folly:optionalApple",
        "//xplat/js/react-native-github/Libraries/FBLazyVector:FBLazyVector",
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
    srcs = ["React/Tests/Text/RCTParagraphComponentViewTests.mm"],
    frameworks = [
        "$PLATFORM_DIR/Developer/Library/Frameworks/XCTest.framework",
    ],
    oncall = "react_native",
    deps = [
        ":RCTFabricApple",
        react_native_xplat_target("react/renderer/element:elementApple"),
        "//xplat/js:RCTTextApple",
        "//xplat/js/react-native-github:RCTFabricComponentViewsBaseApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/attributedstring:attributedstringApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/componentregistry:componentregistryApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/components/legacyviewmanagerinterop:legacyviewmanagerinteropApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/components/text:textApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/components/textinput/iostextinput:iostextinputApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/scheduler:schedulerApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/textlayoutmanager:textlayoutmanagerApple",
        "//xplat/js/react-native-github/ReactCommon/runtimeexecutor:runtimeexecutorApple",
    ],
)

fb_apple_test(
    name = "MountingTestsApple",
    srcs = ["React/Tests/Mounting/RCTComponentViewRegistryTests.mm"],
    frameworks = [
        "$PLATFORM_DIR/Developer/Library/Frameworks/XCTest.framework",
    ],
    oncall = "react_native",
    deps = [
        ":ImageView",
        ":RCTFabricApple",
        "//xplat/js:RCTTextApple",
        "//xplat/js/react-native-github:RCTFabricComponentViewsBaseApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/attributedstring:attributedstringApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/componentregistry:componentregistryApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/components/legacyviewmanagerinterop:legacyviewmanagerinteropApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/components/textinput/iostextinput:iostextinputApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/scheduler:schedulerApple",
        "//xplat/js/react-native-github/ReactCommon/react/renderer/textlayoutmanager:textlayoutmanagerApple",
        "//xplat/js/react-native-github/ReactCommon/runtimeexecutor:runtimeexecutorApple",
    ],
)

rn_apple_library(
    name = "ImageView",
    autoglob = False,
    compiler_flags = ["-Wall"],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    labels = [
        "disable_plugins_only_validation",
        "supermodule:xplat/default/public.react_native.infra",
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
rn_xplat_cxx_library(
    name = "RCTFabricComponentViewsBase",
    srcs = glob(REACT_COMPONENTVIEWS_BASE_FILES),
    header_namespace = "",
    exported_headers = {
        "React/RCTComponentViewProtocol.h": "React/Fabric/Mounting/RCTComponentViewProtocol.h",
        "React/RCTConversions.h": "React/Fabric/RCTConversions.h",
        "React/RCTImageComponentView.h": "React/Fabric/Mounting/ComponentViews/Image/RCTImageComponentView.h",
        "React/RCTImageResponseDelegate.h": "React/Fabric/RCTImageResponseDelegate.h",
        "React/RCTImageResponseObserverProxy.h": "React/Fabric/RCTImageResponseObserverProxy.h",
        "React/RCTTouchableComponentViewProtocol.h": "React/Fabric/RCTTouchableComponentViewProtocol.h",
        "React/RCTViewComponentView.h": "React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.h",
        "React/UIView+ComponentViewProtocol.h": "React/Fabric/Mounting/UIView+ComponentViewProtocol.h",
    },
    compiler_flags = ["-Wall"],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    labels = ["supermodule:xplat/default/public.react_native.infra"],
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js:RCTImage",
        "//xplat/js:RCTLinking",
        react_native_xplat_target("react/renderer/imagemanager:imagemanager"),
        react_native_xplat_target("react/renderer/components/image:image"),
        react_native_xplat_target("react/renderer/components/view:view"),
        react_native_xplat_target("react/renderer/componentregistry:componentregistry"),
    ],
)

rn_library(
    name = "react-native",
    srcs = [
        "package.json",
        "index.js",
    ] + glob(
        [
            "Libraries/**/*.js",
            "Libraries/NewAppScreen/**/*.png",
            "Libraries/LogBox/**/*.png",
        ],
        exclude = [
            "**/__*__/**",
            "**/gulpfile.js",
            "Libraries/Components/Switch/SwitchSchema.js",
        ],
    ),
    labels = ["supermodule:xplat/default/public.react_native.core"],
    skip_processors = True,  # Don't anticipate routes or fbicon here
    visibility = ["PUBLIC"],
    deps = [
        "//xplat/js:node_modules__abort_19controller",
        "//xplat/js:node_modules__anser",
        "//xplat/js:node_modules__base64_19js",
        "//xplat/js:node_modules__event_19target_19shim",
        "//xplat/js:node_modules__invariant",
        "//xplat/js:node_modules__nullthrows",
        "//xplat/js:node_modules__pretty_19format",
        "//xplat/js:node_modules__promise",
        "//xplat/js:node_modules__prop_19types",
        "//xplat/js:node_modules__react_19devtools_19core",
        "//xplat/js:node_modules__react_19refresh",
        "//xplat/js:node_modules__react_19shallow_19renderer",
        "//xplat/js:node_modules__regenerator_19runtime",
        "//xplat/js:node_modules__stacktrace_19parser",
        "//xplat/js:node_modules__use_19subscription",
        "//xplat/js:node_modules__whatwg_19fetch",
        "//xplat/js/RKJSModules/Libraries/Polyfills:Polyfills",
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
    library_labels = ["supermodule:xplat/default/public.react_native.infra"],
    native_module_spec_name = "FBReactNativeSpec",
    src_prefix = "Libraries/",
)

# TODO: Merge this into FBReactNativeSpec
rn_codegen(
    name = "FBReactNativeComponentSpec",
    codegen_components = True,
    ios_assume_nonnull = False,
    library_labels = ["supermodule:xplat/default/public.react_native.infra"],
    src_prefix = "Libraries/",
)
