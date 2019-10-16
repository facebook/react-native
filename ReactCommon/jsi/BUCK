# BUILD FILE SYNTAX: SKYLARK

load("//tools/build_defs/oss:rn_defs.bzl", "react_native_xplat_dep", "rn_xplat_cxx_library")

rn_xplat_cxx_library(
    name = "jsi",
    srcs = [
        "jsi/jsi.cpp",
    ],
    header_namespace = "",
    exported_headers = [
        "jsi/instrumentation.h",
        "jsi/jsi.h",
        "jsi/jsi-inl.h",
        "jsi/jsilib.h",
    ],
    compiler_flags = [
        "-O3",
        "-fexceptions",
        "-frtti",
        "-std=c++14",
        "-Wall",
        "-Werror",
        "-Wextra",
        "-Wcast-qual",
        "-Wdelete-non-virtual-dtor",
        "-Wwrite-strings",
    ],
    cxx_compiler_flags = [
        "-Wglobal-constructors",
        "-Wmissing-prototypes",
    ],
    fbobjc_compiler_flags = [
        "-Wglobal-constructors",
        "-Wmissing-prototypes",
    ],
    visibility = ["PUBLIC"],
)

rn_xplat_cxx_library(
    name = "JSIDynamic",
    srcs = [
        "jsi/JSIDynamic.cpp",
    ],
    header_namespace = "",
    exported_headers = [
        "jsi/JSIDynamic.h",
    ],
    compiler_flags = [
        "-fexceptions",
        "-frtti",
    ],
    fbobjc_force_static = True,
    visibility = [
        "PUBLIC",
    ],
    xcode_public_headers_symlinks = True,
    deps = [
        "fbsource//xplat/folly:molly",
        react_native_xplat_dep("jsi:jsi"),
    ],
)

rn_xplat_cxx_library(
    name = "JSCRuntime",
    srcs = [
        "JSCRuntime.cpp",
    ],
    header_namespace = "jsi",
    exported_headers = [
        "JSCRuntime.h",
    ],
    cxx_exported_platform_linker_flags = [
        (
            "macosx-x86_64",
            [
                "-framework",
                "JavaScriptCore",
            ],
        ),
    ],
    cxx_platform_deps = [
        (
            "^(linux|gcc|platform)",
            [
                "fbsource//xplat/jsc:jsc",
            ],
        ),
    ],
    fbandroid_compiler_flags = [
        "-fexceptions",
        "-frtti",
        "-O3",
    ],
    fbandroid_deps = [
        "fbsource//xplat/jsc:jsc",
    ],
    fbobjc_compiler_flags = [
        "-Os",
    ],
    fbobjc_frameworks = [
        "$SDKROOT/System/Library/Frameworks/JavaScriptCore.framework",
    ],
    fbobjc_labels = ["supermodule:ios/isolation/infra.react_native"],
    visibility = ["PUBLIC"],
    xplat_mangled_args = {
        "soname": "libjscjsi.$(ext)",
    },
    exported_deps = [
        react_native_xplat_dep("jsi:jsi"),
    ],
)
