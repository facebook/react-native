load("//tools/build_defs/oss:rn_defs.bzl", "fb_apple_library", "react_native_xplat_target_apple", "subdir_glob")

fb_apple_library(
    name = "FBReactNativeSpecApple",
    srcs = glob(["FBReactNativeSpec/**/*.mm"]),
    exported_headers = subdir_glob(
        [
            ("FBReactNativeSpec", "*.h"),
        ],
        prefix = "FBReactNativeSpec",
    ),
    contacts = ["oncall+react_native@xmail.facebook.com"],
    frameworks = [
        "Foundation",
        "UIKit",
    ],
    reexport_all_header_dependencies = True,
    deps = [
        "fbsource//xplat/js/react-native-github:RCTTypeSafety",
        "fbsource//xplat/js/react-native-github/Libraries/RCTRequired:RCTRequired",
        react_native_xplat_target_apple("turbomodule/core:core"),
    ],
)
