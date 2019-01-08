load("@fbsource//tools/build_defs:default_platform_defs.bzl", "ANDROID", "APPLE")
load("@fbsource//tools/build_defs:fb_native_wrapper.bzl", "fb_native")
load(
    "//tools/build_defs/oss:rn_defs.bzl",
    "react_native_xplat_target",
    "rn_xplat_cxx_library",
)

def rn_codegen_test(
        fixture_name = ""):
    generate_fixtures_rule_name = "generate_fixtures-{}".format(fixture_name)
    generate_component_descriptor_h_name = "generate_component_descriptor_h-{}".format(fixture_name)
    generate_event_emitter_cpp_name = "generate_event_emitter_cpp-{}".format(fixture_name)
    generate_event_emitter_h_name = "generate_event_emitter_h-{}".format(fixture_name)
    generate_props_cpp_name = "generate_props_cpp-{}".format(fixture_name)
    generate_props_h_name = "generated_props_h-{}".format(fixture_name)
    generate_shadow_node_h_name = "generated_shadow_node_h-{}".format(fixture_name)

    fb_native.genrule(
        name = generate_fixtures_rule_name,
        srcs = [],
        cmd = "$(exe :rn_codegen) {} $OUT".format(fixture_name),
        out = "codegenfiles-{}".format(fixture_name),
    )

    fb_native.genrule(
        name = generate_component_descriptor_h_name,
        cmd = "cp $(location :{})/ComponentDescriptors.h $OUT".format(generate_fixtures_rule_name),
        out = "ComponentDescriptors.h",
    )

    fb_native.genrule(
        name = generate_event_emitter_cpp_name,
        cmd = "cp $(location :{})/EventEmitters.cpp $OUT".format(generate_fixtures_rule_name),
        out = "EventEmitters.cpp",
    )

    fb_native.genrule(
        name = generate_event_emitter_h_name,
        cmd = "cp $(location :{})/EventEmitters.h $OUT".format(generate_fixtures_rule_name),
        out = "EventEmitters.h",
    )

    fb_native.genrule(
        name = generate_props_cpp_name,
        cmd = "cp $(location :{})/Props.cpp $OUT".format(generate_fixtures_rule_name),
        out = "Props.cpp",
    )

    fb_native.genrule(
        name = generate_props_h_name,
        cmd = "cp $(location :{})/Props.h $OUT".format(generate_fixtures_rule_name),
        out = "Props.h",
    )

    fb_native.genrule(
        name = generate_shadow_node_h_name,
        cmd = "cp $(location :{})/ShadowNodes.h $OUT".format(generate_fixtures_rule_name),
        out = "ShadowNodes.h",
    )

    # libs
    rn_xplat_cxx_library(
        name = "generated_fixture_library-{}".format(fixture_name),
        srcs = [
            ":{}".format(generate_event_emitter_cpp_name),
            ":{}".format(generate_props_cpp_name),
        ],
        headers = [
            ":{}".format(generate_component_descriptor_h_name),
            ":{}".format(generate_event_emitter_h_name),
            ":{}".format(generate_props_h_name),
            ":{}".format(generate_shadow_node_h_name),
        ],
        exported_headers = {
            "ComponentDescriptors.h": ":{}".format(generate_component_descriptor_h_name),
            "EventEmitters.h": ":{}".format(generate_event_emitter_h_name),
            "Props.h": ":{}".format(generate_props_h_name),
            "ShadowNodes.h": ":{}".format(generate_shadow_node_h_name),
        },
        header_namespace = "react/components/{}".format(fixture_name),
        compiler_flags = [
            "-fexceptions",
            "-frtti",
            "-std=c++14",
            "-Wall",
        ],
        platforms = (ANDROID, APPLE),
        preprocessor_flags = [
            "-DLOG_TAG=\"ReactNative\"",
            "-DWITH_FBSYSTRACE=1",
        ],
        deps = [
            react_native_xplat_target("fabric/components/view:view"),
        ],
    )
