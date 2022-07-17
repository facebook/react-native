# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

load("//tools/build_defs:buckconfig.bzl", "read_bool")
load("//tools/build_defs:fb_native_wrapper.bzl", "fb_native")
load(
    "//tools/build_defs/oss:rn_defs.bzl",
    "ANDROID",
    "APPLE",
    "CXX",
    "IOS",
    "IS_OSS_BUILD",
    "MACOSX",
    "YOGA_CXX_TARGET",
    "fb_xplat_cxx_test",
    "get_apple_compiler_flags",
    "get_apple_inspector_flags",
    "get_preprocessor_flags_for_build_mode",
    "react_native_dep",
    "react_native_root_target",
    "react_native_target",
    "react_native_xplat_shared_library_target",
    "react_native_xplat_target",
    "react_native_xplat_target_apple",
    "rn_android_library",
    "rn_apple_library",
    "rn_xplat_cxx_library",
)
load("//tools/build_defs/third_party:yarn_defs.bzl", "yarn_workspace_binary")

# Call this in the react-native-codegen/BUCK file
def rn_codegen_cli():
    if not IS_OSS_BUILD:
        # FB Internal Setup
        yarn_workspace_binary(
            name = "write_to_json",
            main = "src/cli/combine/combine-js-to-schema-cli.js",
            root = "//xplat/js:workspace",
            deps = [
                ":yarn-workspace",
            ],
            visibility = ["PUBLIC"],
        )
        yarn_workspace_binary(
            name = "generate_all_from_schema",
            main = "src/cli/generators/generate-all.js",
            root = "//xplat/js:workspace",
            deps = [
                ":yarn-workspace",
            ],
            visibility = ["PUBLIC"],
        )
    else:
        # OSS setup, assumes yarn and node (v12.0.0+) are installed.
        fb_native.genrule(
            name = "setup_cli",
            srcs = native.glob([
                "scripts/**/*",
                "src/**/*",
            ], exclude = [
                "__tests__/**/*",
            ]) + [
                ".babelrc",
                ".prettierrc",
                "package.json",
            ],
            out = "build",
            bash = r"""
                set -euo pipefail
                mkdir -p "$OUT"
                rsync -rLptgoD "$SRCDIR/" "$OUT"
                cd "$OUT"
                yarn install 2> >(grep -v '^warning' 1>&2)
                yarn run build
            """,
        )

        fb_native.sh_binary(
            name = "write_to_json",
            main = "scripts/buck-oss/combine_js_to_schema.sh",
            resources = [
                ":setup_cli",
            ],
            visibility = ["PUBLIC"],
        )

        fb_native.sh_binary(
            name = "generate_all_from_schema",
            main = "scripts/buck-oss/generate-all.sh",
            resources = [
                ":setup_cli",
            ],
            visibility = ["PUBLIC"],
        )

def rn_codegen_modules(
        name,
        android_package_name,
        ios_assume_nonnull,
        library_labels = [],
        schema_target = ""):
    generate_fixtures_rule_name = "{}-codegen-modules".format(name)
    generate_module_hobjcpp_name = "{}-codegen-modules-hobjcpp".format(name)
    generate_module_mm_name = "{}-codegen-modules-mm".format(name)
    generate_module_java_name = "{}-codegen-modules-java".format(name)
    generate_module_java_zip_name = "{}-codegen-modules-java_zip".format(name)
    generate_module_jni_h_name = "{}-codegen-modules-jni_h".format(name)
    generate_module_jni_cpp_name = "{}-codegen-modules-jni_cpp".format(name)

    fb_native.genrule(
        name = generate_fixtures_rule_name,
        srcs = native.glob(["src/generators/**/*.js"]),
        cmd = "$(exe {generator_script}) $(location {schema_target}) {library_name} $OUT {android_package_name} {ios_assume_nonnull}".format(
            generator_script = react_native_root_target("packages/react-native-codegen:generate_all_from_schema"),
            schema_target = schema_target,
            library_name = name,
            android_package_name = android_package_name,
            ios_assume_nonnull = ios_assume_nonnull,
        ),
        out = "codegenfiles-{}".format(name),
        labels = ["codegen_rule", "uses_local_filesystem_abspaths"],
    )

    ##################
    # Android handling
    ##################
    fb_native.genrule(
        name = generate_module_java_name,
        cmd = "mkdir -p $OUT/{spec_path} && cp -r $(location {generator_target})/java/{spec_path}/* $OUT/{spec_path}/".format(
            spec_path = android_package_name.replace(".", "/"),
            generator_target = ":" + generate_fixtures_rule_name,
        ),
        out = "src",
        labels = ["codegen_rule"],
    )

    fb_native.zip_file(
        name = generate_module_java_zip_name,
        srcs = [":{}".format(generate_module_java_name)],
        out = "{}.src.zip".format(generate_module_java_zip_name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_jni_h_name,
        cmd = "cp $(location :{})/jni/{}.h $OUT".format(generate_fixtures_rule_name, name),
        out = "{}.h".format(name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_jni_cpp_name,
        cmd = "cp $(location :{})/jni/{}-generated.cpp $OUT".format(generate_fixtures_rule_name, name),
        out = "{}-generated.cpp".format(name),
        labels = ["codegen_rule"],
    )

    rn_android_library(
        name = "{}".format(name),
        srcs = [
            ":{}".format(generate_module_java_zip_name),
        ],
        autoglob = False,
        labels = library_labels + ["codegen_rule"],
        language = "JAVA",
        visibility = ["PUBLIC"],
        deps = [
            react_native_dep("third-party/java/jsr-305:jsr-305"),
            react_native_dep("third-party/java/jsr-330:jsr-330"),
            react_native_target("java/com/facebook/react/bridge:bridge"),
            react_native_target("java/com/facebook/react/common:common"),
        ],
        exported_deps = [
            react_native_target("java/com/facebook/react/turbomodule/core/interfaces:interfaces"),
        ],
    )

    rn_xplat_cxx_library(
        name = "{}-jni".format(name),
        srcs = [
            ":{}".format(generate_module_jni_cpp_name),
        ],
        header_namespace = "",
        headers = [
            ":{}".format(generate_module_jni_h_name),
        ],
        exported_headers = {
            "{}/{}.h".format(name, name): ":{}".format(generate_module_jni_h_name),
        },
        force_static = True,
        preprocessor_flags = [
            "-DLOG_TAG=\"ReactNative\"",
            "-DWITH_FBSYSTRACE=1",
        ],
        visibility = [
            "PUBLIC",
        ],
        deps = [],
        exported_deps = [
            react_native_xplat_shared_library_target("jsi:jsi"),
            react_native_xplat_target("react/nativemodule/core:core"),
        ],
        platforms = (ANDROID,),
        labels = library_labels + ["codegen_rule"],
    )

    ##############
    # iOS handling
    ##############
    if not IS_OSS_BUILD:
        # iOS Buck build isn't fully working in OSS, so let's skip it for OSS for now.
        fb_native.genrule(
            name = generate_module_hobjcpp_name,
            cmd = "cp $(location :{})/{}/{}.h $OUT".format(generate_fixtures_rule_name, name, name),
            out = "{}.h".format(name),
            labels = ["codegen_rule"],
        )

        fb_native.genrule(
            name = generate_module_mm_name,
            cmd = "cp $(location :{})/{}/{}-generated.mm $OUT".format(generate_fixtures_rule_name, name, name),
            out = "{}-generated.mm".format(name),
            labels = ["codegen_rule"],
        )

        rn_apple_library(
            name = "{}Apple".format(name),
            extension_api_only = True,
            header_namespace = "",
            sdks = (IOS),
            compiler_flags = [
                "-Wno-unused-private-field",
            ],
            exported_headers = {
                "{}/{}.h".format(name, name): ":{}".format(generate_module_hobjcpp_name),
            },
            headers = [
                ":{}".format(generate_module_hobjcpp_name),
            ],
            srcs = [
                ":{}".format(generate_module_mm_name),
            ],
            autoglob = False,
            labels = library_labels + ["codegen_rule"],
            visibility = ["PUBLIC"],
            exported_deps = [
                "//xplat/js/react-native-github:RCTTypeSafety",
                "//xplat/js/react-native-github/Libraries/RCTRequired:RCTRequired",
                react_native_xplat_target_apple("react/nativemodule/core:core"),
            ],
        )

def rn_codegen_components(
        name = "",
        schema_target = "",
        library_labels = []):
    generate_fixtures_rule_name = "generate_fixtures_components-{}".format(name)
    generate_component_descriptor_h_name = "generate_component_descriptor_h-{}".format(name)
    generate_component_hobjcpp_name = "generate_component_hobjcpp-{}".format(name)
    generate_event_emitter_cpp_name = "generate_event_emitter_cpp-{}".format(name)
    generate_event_emitter_h_name = "generate_event_emitter_h-{}".format(name)
    generate_props_cpp_name = "generate_props_cpp-{}".format(name)
    generate_props_h_name = "generated_props_h-{}".format(name)
    generate_tests_cpp_name = "generate_tests_cpp-{}".format(name)
    generate_shadow_node_cpp_name = "generated_shadow_node_cpp-{}".format(name)
    generate_shadow_node_h_name = "generated_shadow_node_h-{}".format(name)
    copy_generated_java_files = "copy_generated_java_files-{}".format(name)
    copy_generated_cxx_files = "copy_generated_cxx_files-{}".format(name)
    zip_generated_java_files = "zip_generated_java_files-{}".format(name)
    zip_generated_cxx_files = "zip_generated_cxx_files-{}".format(name)

    fb_native.genrule(
        name = generate_fixtures_rule_name,
        srcs = native.glob(["src/generators/**/*.js"]),
        cmd = "$(exe {}) $(location {}) {} $OUT".format(react_native_root_target("packages/react-native-codegen:generate_all_from_schema"), schema_target, name),
        out = "codegenfiles-{}".format(name),
        labels = ["codegen_rule", "uses_local_filesystem_abspaths"],
    )

    fb_native.genrule(
        name = generate_component_descriptor_h_name,
        cmd = "cp $(location :{})/ComponentDescriptors.h $OUT".format(generate_fixtures_rule_name),
        out = "ComponentDescriptors.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_component_hobjcpp_name,
        cmd = "cp $(location :{})/RCTComponentViewHelpers.h $OUT".format(generate_fixtures_rule_name),
        out = "RCTComponentViewHelpers.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_event_emitter_cpp_name,
        cmd = "cp $(location :{})/EventEmitters.cpp $OUT".format(generate_fixtures_rule_name),
        out = "EventEmitters.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_event_emitter_h_name,
        cmd = "cp $(location :{})/EventEmitters.h $OUT".format(generate_fixtures_rule_name),
        out = "EventEmitters.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_props_cpp_name,
        cmd = "cp $(location :{})/Props.cpp $OUT".format(generate_fixtures_rule_name),
        out = "Props.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_tests_cpp_name,
        cmd = "cp $(location :{})/Tests.cpp $OUT".format(generate_fixtures_rule_name),
        out = "Tests.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_props_h_name,
        cmd = "cp $(location :{})/Props.h $OUT".format(generate_fixtures_rule_name),
        out = "Props.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = copy_generated_java_files,
        # TODO: support different package name internally.
        # Right now, it's hardcoded to `com.facebook.react.viewmanagers`.
        cmd = "mkdir -p $OUT/com/facebook/react/viewmanagers && cp -R $(location :{})/java/com/facebook/react/viewmanagers/* $OUT/com/facebook/react/viewmanagers".format(generate_fixtures_rule_name),
        out = "java",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = copy_generated_cxx_files,
        # The command below is filtering C++ iOS files, this will be refactored when C++ codegen is finished.
        cmd = "mkdir -p $OUT && find $(location :{}) -not -path '*/rncore*' -not -path '*Tests*' -not -path '*NativeModules*' -not -path '*RCTComponentViewHelpers*' -type f \\( -iname \\*.h -o -iname \\*.cpp \\) -print0 -exec cp {{}} $OUT \\;".format(generate_fixtures_rule_name),
        out = "cxx",
        labels = ["codegen_rule"],
    )

    fb_native.zip_file(
        name = zip_generated_cxx_files,
        srcs = [":{}".format(copy_generated_cxx_files)],
        out = "{}.src.zip".format(zip_generated_cxx_files),
        visibility = ["PUBLIC"],
        labels = ["codegen_rule"],
    )

    fb_native.zip_file(
        name = zip_generated_java_files,
        srcs = [":{}".format(copy_generated_java_files)],
        out = "{}.src.zip".format(zip_generated_java_files),
        visibility = ["PUBLIC"],
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_shadow_node_cpp_name,
        cmd = "cp $(location :{})/ShadowNodes.cpp $OUT".format(generate_fixtures_rule_name),
        out = "ShadowNodes.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_shadow_node_h_name,
        cmd = "cp $(location :{})/ShadowNodes.h $OUT".format(generate_fixtures_rule_name),
        out = "ShadowNodes.h",
        labels = ["codegen_rule"],
    )

    ##############
    # iOS handling
    ##############
    if not IS_OSS_BUILD:
        # iOS Buck build isn't fully working in OSS, so let's skip it for OSS for now.
        if is_running_buck_project():
            rn_xplat_cxx_library(name = "generated_components-{}".format(name), visibility = ["PUBLIC"])
        else:
            rn_xplat_cxx_library(
                name = "generated_components-{}".format(name),
                srcs = [
                    ":{}".format(generate_event_emitter_cpp_name),
                    ":{}".format(generate_props_cpp_name),
                    ":{}".format(generate_shadow_node_cpp_name),
                ],
                headers = [
                    ":{}".format(generate_component_descriptor_h_name),
                    ":{}".format(generate_event_emitter_h_name),
                    ":{}".format(generate_props_h_name),
                    ":{}".format(generate_shadow_node_h_name),
                ],
                header_namespace = "react/renderer/components/{}".format(name),
                exported_headers = {
                    "ComponentDescriptors.h": ":{}".format(generate_component_descriptor_h_name),
                    "EventEmitters.h": ":{}".format(generate_event_emitter_h_name),
                    "Props.h": ":{}".format(generate_props_h_name),
                    "RCTComponentViewHelpers.h": ":{}".format(generate_component_hobjcpp_name),
                    "ShadowNodes.h": ":{}".format(generate_shadow_node_h_name),
                },
                fbobjc_compiler_flags = get_apple_compiler_flags(),
                fbobjc_preprocessor_flags = get_preprocessor_flags_for_build_mode() + get_apple_inspector_flags(),
                ios_exported_headers = {
                    "ComponentViewHelpers.h": ":{}".format(generate_component_hobjcpp_name),
                },
                ios_headers = [
                    ":{}".format(generate_component_hobjcpp_name),
                ],
                labels = library_labels + ["codegen_rule"],
                platforms = (ANDROID, APPLE, CXX),
                preprocessor_flags = [
                    "-DLOG_TAG=\"ReactNative\"",
                    "-DWITH_FBSYSTRACE=1",
                ],
                tests = [":generated_tests-{}".format(name)],
                visibility = ["PUBLIC"],
                deps = [
                    "//third-party/glog:glog",
                    "//xplat/fbsystrace:fbsystrace",
                    "//xplat/folly:headers_only_do_not_use",
                    "//xplat/folly:memory",
                    "//xplat/folly:molly",
                    YOGA_CXX_TARGET,
                    react_native_xplat_target("react/renderer/debug:debug"),
                    react_native_xplat_target("react/renderer/core:core"),
                    react_native_xplat_target("react/renderer/graphics:graphics"),
                    react_native_xplat_target("react/renderer/components/image:image"),
                    react_native_xplat_target("react/renderer/imagemanager:imagemanager"),
                    react_native_xplat_target("react/renderer/components/view:view"),
                ],
            )

        # Tests
        fb_xplat_cxx_test(
            name = "generated_tests-{}".format(name),
            # TODO T96844980: Fix and enable generated_tests-codegen_testsAndroid
            srcs = [] if ANDROID else [
                ":{}".format(generate_tests_cpp_name),
            ],
            apple_sdks = (IOS, MACOSX),
            fbandroid_use_instrumentation_test = True,
            compiler_flags = [
                "-fexceptions",
                "-frtti",
                "-std=c++17",
                "-Wall",
            ],
            contacts = ["oncall+react_native@xmail.facebook.com"],
            labels = library_labels + ["codegen_rule"],
            platforms = (ANDROID, APPLE, CXX),
            deps = [
                YOGA_CXX_TARGET,
                react_native_xplat_target("react/renderer/core:core"),
                "//xplat/third-party/gmock:gtest",
                ":generated_components-{}".format(name),
            ],
        )

    ##################
    # Android handling
    ##################
    if is_running_buck_project():
        rn_android_library(name = "generated_components_java-{}".format(name), autoglob = False, language = "JAVA")
    else:
        rn_android_library(
            name = "generated_components_java-{}".format(name),
            srcs = [
                ":{}".format(zip_generated_java_files),
            ],
            language = "JAVA",
            autoglob = False,
            labels = library_labels + ["codegen_rule"],
            visibility = ["PUBLIC"],
            deps = [
                react_native_dep("third-party/android/androidx:annotation"),
                react_native_target("java/com/facebook/react/bridge:bridge"),
                react_native_target("java/com/facebook/react/uimanager:interfaces"),
            ],
        )

        rn_android_library(
            name = "generated_components_cxx-{}".format(name),
            srcs = [
                ":{}".format(zip_generated_cxx_files),
            ],
            language = "JAVA",
            autoglob = False,
            labels = library_labels + ["codegen_rule"],
            visibility = ["PUBLIC"],
            deps = [
                react_native_dep("third-party/android/androidx:annotation"),
                react_native_target("java/com/facebook/react/bridge:bridge"),
                react_native_target("java/com/facebook/react/common:common"),
                react_native_target("java/com/facebook/react/turbomodule/core:core"),
                react_native_target("java/com/facebook/react/uimanager:uimanager"),
            ],
        )

def rn_codegen_cxx_modules(
        name = "",
        schema_target = "",
        library_labels = []):
    generate_fixtures_rule_name = "generate_fixtures_cxx-{}".format(name)
    generate_module_h_name = "generate_module_h-{}".format(name)
    generate_module_cpp_name = "generate_module_cpp-{}".format(name)

    fb_native.genrule(
        name = generate_fixtures_rule_name,
        srcs = native.glob(["src/generators/**/*.js"]),
        cmd = "$(exe {}) $(location {}) {} $OUT {}".format(react_native_root_target("packages/react-native-codegen:generate_all_from_schema"), schema_target, name, name),
        out = "codegenfiles-{}".format(name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_h_name,
        cmd = "cp $(location :{})/{}JSI.h $OUT".format(generate_fixtures_rule_name, name),
        out = "{}JSI.h".format(name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_cpp_name,
        cmd = "cp $(location :{})/{}JSI-generated.cpp $OUT".format(generate_fixtures_rule_name, name),
        out = "{}JSI-generated.cpp".format(name),
        labels = ["codegen_rule"],
    )

    if is_running_buck_project():
        rn_xplat_cxx_library(name = "{}JSI".format(name), visibility = ["PUBLIC"])
    else:
        rn_xplat_cxx_library(
            name = "{}JSI".format(name),
            srcs = [
                ":{}".format(generate_module_cpp_name),
            ],
            headers = [
                ":{}".format(generate_module_h_name),
            ],
            header_namespace = "",
            exported_headers = {
                "{}/{}JSI.h".format(name, name): ":{}".format(generate_module_h_name),
            },
            fbobjc_compiler_flags = get_apple_compiler_flags(),
            fbobjc_preprocessor_flags = get_preprocessor_flags_for_build_mode() + get_apple_inspector_flags(),
            labels = library_labels + ["codegen_rule"],
            platforms = (ANDROID, APPLE, CXX),
            preprocessor_flags = [
                "-DLOG_TAG=\"ReactNative\"",
                "-DWITH_FBSYSTRACE=1",
            ],
            visibility = ["PUBLIC"],
            exported_deps = [
                react_native_xplat_target("react/nativemodule/core:core"),
            ],
        )

def is_running_buck_project():
    return read_bool("fbandroid", "is_running_buck_project", False)
