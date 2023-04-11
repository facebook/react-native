# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Provides macros for working with React Native Codegen."""
# @lint-ignore-every BUCKRESTRICTEDSYNTAX

load(
    "//packages/react-native-codegen:DEFS.bzl",
    _rn_codegen_components = "rn_codegen_components",
    _rn_codegen_cxx_modules = "rn_codegen_cxx_modules",
    _rn_codegen_modules = "rn_codegen_modules",
)
load("//tools/build_defs:fb_native_wrapper.bzl", "fb_native")
load(
    "//tools/build_defs/oss:rn_defs.bzl",
    "react_native_root_target",
)

rn_codegen_components = _rn_codegen_components
rn_codegen_cxx_modules = _rn_codegen_cxx_modules
rn_codegen_modules = _rn_codegen_modules

def rn_codegen(
        name,
        ios_assume_nonnull,
        native_module_spec_name = None,
        native_component_spec_name = None,
        android_package_name = None,
        codegen_components = False,
        codegen_modules = False,
        library_labels = [],
        codegen_src_prefix = "",
        external_spec_target = None):
    if codegen_modules:
        error_header = "rn_codegen(name=\"{}\")".format(name)
        if not native_module_spec_name:
            fail("{}: When codegen_modules = True, native_module_spec_name must be specified.".format(error_header))

        if not android_package_name:
            fail("{}: When codegen_modules = True, android_package_name must be specified.".format(error_header))

        spec_srcs = native.glob(
            [
                codegen_src_prefix + "**/Native*.js",
                codegen_src_prefix + "**/Native*.ts",
            ],
            exclude = [
                codegen_src_prefix + "**/nativeImageSource.js",
                "**/__*__/**",
            ],
        )

        module_schema_target = "{}-codegen-modules-schema".format(native_module_spec_name)

        fb_native.genrule(
            name = module_schema_target,
            srcs = spec_srcs,
            cmd = "$(exe {}) $OUT $SRCS".format(react_native_root_target("packages/react-native-codegen:write_to_json")),
            out = "schema-{}.json".format(native_module_spec_name),
            labels = ["codegen_rule", "react_native_schema_target"],
        )

        rn_codegen_modules(
            name = native_module_spec_name,
            android_package_name = android_package_name,
            ios_assume_nonnull = ios_assume_nonnull,
            schema_target = ":{}".format(module_schema_target),
            library_labels = library_labels,
        )

        rn_codegen_cxx_modules(
            name = native_module_spec_name,
            schema_target = ":{}".format(module_schema_target),
            library_labels = library_labels,
        )

    if codegen_components:
        component_spec_name = native_component_spec_name or name
        fb_native.genrule(
            name = "codegen_rn_components_schema_{}".format(component_spec_name),
            srcs = native.glob(
                [
                    codegen_src_prefix + "**/*NativeComponent.js",
                    codegen_src_prefix + "**/*NativeComponent.ts",
                ],
                exclude = [
                    "**/__*__/**",
                ],
            ),
            cmd = "$(exe {}) $OUT $SRCS".format(react_native_root_target("packages/react-native-codegen:write_to_json")),
            out = "schema-{}.json".format(component_spec_name),
            labels = ["codegen_rule"],
        )

        rn_codegen_components(
            name = component_spec_name,
            schema_target = ":codegen_rn_components_schema_{}".format(component_spec_name),
            library_labels = library_labels,
        )

# Given the codegenConfig defined inside package.json, convert it to the Buck specific configs.
# Specification: https://reactnative.dev/docs/next/new-architecture-library-intro#configure-codegen
def buck_codegen_config_from_package_codegen_config(package_codegen_config):
    configs = {}

    name = package_codegen_config["name"]
    android_package_name = "com.facebook.fbreact.specs"
    if "android" in package_codegen_config:
        android_config = package_codegen_config["android"]
        if "javaPackageName" in android_config:
            # Note: assume Kotlin will use the same package name
            android_package_name = android_config["javaPackageName"]

    codegen_type = package_codegen_config["type"]
    if codegen_type == "modules" or codegen_type == "all":
        configs["codegen_modules"] = True
        configs["native_module_spec_name"] = name
        configs["android_package_name"] = android_package_name

    if codegen_type == "components" or codegen_type == "all":
        configs["codegen_components"] = True
        configs["native_component_spec_name"] = name
        configs["android_package_name"] = android_package_name

    js_srcs_dir = package_codegen_config["jsSrcsDir"]
    configs["codegen_src_prefix"] = (js_srcs_dir + "/") if js_srcs_dir else ""

    return configs
