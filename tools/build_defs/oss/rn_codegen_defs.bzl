# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Provides macros for working with React Native Codegen."""
# @lint-ignore-every BUCKRESTRICTEDSYNTAX

load(
    "//packages/react-native-codegen:DEFS.bzl",
    _rn_codegen_components = "rn_codegen_components",
    _rn_codegen_modules = "rn_codegen_modules",
)
load("//tools/build_defs:fb_native_wrapper.bzl", "fb_native")
load(
    "//tools/build_defs/oss:rn_defs.bzl",
    "react_native_root_target",
)

rn_codegen_components = _rn_codegen_components
rn_codegen_modules = _rn_codegen_modules

def rn_codegen(
        name,
        native_module_spec_name = None,
        android_package_name = None,
        codegen_components = False,
        codegen_modules = False,
        library_labels = []):
    if (codegen_modules):
        error_header = "rn_codegen(name=\"{}\")".format(name)
        if not native_module_spec_name:
            fail("{}: When codegen_modules = True, native_module_spec_name must be specified.".format(error_header))

        if not android_package_name:
            fail("{}: When codegen_modules = True, android_package_name must be specified.".format(error_header))

        spec_srcs = native.glob(
            [
                "**/Native*.js",
            ],
            exclude = [
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
            schema_target = ":{}".format(module_schema_target),
            library_labels = library_labels,
        )

    if (codegen_components):
        fb_native.genrule(
            name = "codegen_rn_components_schema_{}".format(name),
            srcs = native.glob(
                [
                    "**/*NativeComponent.js",
                ],
                exclude = [
                    "**/__*__/**",
                ],
            ),
            cmd = "$(exe {}) $OUT $SRCS".format(react_native_root_target("packages/react-native-codegen:write_to_json")),
            out = "schema-{}.json".format(name),
            labels = ["codegen_rule"],
        )

        rn_codegen_components(
            name = name,
            schema_target = ":codegen_rn_components_schema_{}".format(name),
            library_labels = library_labels,
        )
