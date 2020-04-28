load("@fbsource//tools/build_defs/apple:flag_defs.bzl", "OBJC_ARC_PREPROCESSOR_FLAGS", "get_debug_preprocessor_flags", "get_fbobjc_enable_exception_lang_compiler_flags_DEPRECATED")
load("@fbsource//tools/build_defs/oss:rn_defs.bzl", "rn_apple_library", "rn_debug_flags")
load(
    "@fbsource//xplat/configurations/buck/apple/plugins/sad_xplat_hosted_configurations:react_module_registration.bzl",
    "react_module_plugin_providers",
)

rn_apple_library(
    name = "CoreModulesApple",
    srcs = glob(
        [
            "**/*.m",
            "**/*.mm",
        ],
    ),
    exported_headers = glob(["**/*.h"]),
    compiler_flags = [
        "-Wno-error=unguarded-availability-new",
        "-Wno-unknown-warning-option",
    ],
    contacts = ["oncall+react_native@xmail.facebook.com"],
    exported_linker_flags = [
        "-weak_framework",
        "UserNotifications",
        "-weak_framework",
        "WebKit",
    ],
    exported_preprocessor_flags = rn_debug_flags(),
    frameworks = [
        "Foundation",
        "UIKit",
    ],
    header_path_prefix = "React",
    lang_compiler_flags = get_fbobjc_enable_exception_lang_compiler_flags_DEPRECATED(),
    link_whole = True,
    platform_preprocessor_flags = [(
        "linux",
        ["-D PIC_MODIFIER=@PLT"],
    )],
    plugins = react_module_plugin_providers(
                name = "ExceptionsManager",
                native_class_func = "RCTExceptionsManagerCls",
              ) +
              react_module_plugin_providers(
                  name = "ImageLoader",
                  native_class_func = "RCTImageLoaderCls",
              ) +
              react_module_plugin_providers(
                  name = "PlatformConstants",
                  native_class_func = "RCTPlatformCls",
              ),
    preprocessor_flags = OBJC_ARC_PREPROCESSOR_FLAGS + get_debug_preprocessor_flags() + rn_debug_flags() + [
        "-DRN_DISABLE_OSS_PLUGIN_HEADER",
    ],
    reexport_all_header_dependencies = True,
    visibility = ["PUBLIC"],
    exported_deps = [
        "fbsource//xplat/js:RCTImageApple",
        "fbsource//xplat/js/react-native-github:ReactInternalApple",
        "fbsource//xplat/js/react-native-github/Libraries/FBReactNativeSpec:FBReactNativeSpecApple",
    ],
)
