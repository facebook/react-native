# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

project(ReactAndroid)

# Convert input paths to CMake format (with forward slashes)
file(TO_CMAKE_PATH "${REACT_ANDROID_DIR}" REACT_ANDROID_DIR)
file(TO_CMAKE_PATH "${REACT_BUILD_DIR}" REACT_BUILD_DIR)
file(TO_CMAKE_PATH "${REACT_COMMON_DIR}" REACT_COMMON_DIR)

# If you have ccache installed, we're going to honor it.
find_program(CCACHE_FOUND ccache)
if(CCACHE_FOUND)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
endif(CCACHE_FOUND)

# Make sure every shared lib includes a .note.gnu.build-id header
add_link_options(-Wl,--build-id)
add_compile_options(-Wall -Werror)

function(add_react_android_subdir relative_path)
  add_subdirectory(${REACT_ANDROID_DIR}/${relative_path} ReactAndroid/${relative_path})
endfunction()

function(add_react_build_subdir relative_path)
  add_subdirectory(${REACT_BUILD_DIR}/${relative_path} build/${relative_path})
endfunction()

function(add_react_third_party_ndk_subdir relative_path)
  add_react_build_subdir(third-party-ndk/${relative_path})
endfunction()

function(add_react_common_subdir relative_path)
  add_subdirectory(${REACT_COMMON_DIR}/${relative_path} ReactCommon/${relative_path})
endfunction()

# Third-party prefabs
find_package(hermes-engine REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
add_library(fbjni ALIAS fbjni::fbjni)

# Third-party downloaded targets
add_react_third_party_ndk_subdir(glog)
add_react_third_party_ndk_subdir(boost)
add_react_third_party_ndk_subdir(double-conversion)
add_react_third_party_ndk_subdir(fast_float)
add_react_third_party_ndk_subdir(fmt)
add_react_third_party_ndk_subdir(folly)
add_react_third_party_ndk_subdir(jsc)
add_react_third_party_ndk_subdir(googletest)

# Common targets
add_react_common_subdir(yoga)
add_react_common_subdir(runtimeexecutor)
add_react_common_subdir(reactperflogger)
add_react_common_subdir(logger)
add_react_common_subdir(jsiexecutor)
add_react_common_subdir(cxxreact)
add_react_common_subdir(jsc)
add_react_common_subdir(jsi)
add_react_common_subdir(callinvoker)
add_react_common_subdir(jsinspector-modern)
add_react_common_subdir(hermes/executor)
add_react_common_subdir(hermes/inspector-modern)
add_react_common_subdir(react/renderer/runtimescheduler)
add_react_common_subdir(react/debug)
add_react_common_subdir(react/config)
add_react_common_subdir(react/featureflags)
add_react_common_subdir(react/performance/timeline)
add_react_common_subdir(react/renderer/animations)
add_react_common_subdir(react/renderer/attributedstring)
add_react_common_subdir(react/renderer/componentregistry)
add_react_common_subdir(react/renderer/mounting)
add_react_common_subdir(react/renderer/scheduler)
add_react_common_subdir(react/renderer/telemetry)
add_react_common_subdir(react/renderer/uimanager)
add_react_common_subdir(react/renderer/core)
add_react_common_subdir(react/renderer/consistency)
add_react_common_subdir(react/renderer/uimanager/consistency)
add_react_common_subdir(react/renderer/dom)
add_react_common_subdir(react/renderer/element)
add_react_common_subdir(react/renderer/graphics)
add_react_common_subdir(react/renderer/debug)
add_react_common_subdir(react/renderer/imagemanager)
add_react_common_subdir(react/renderer/components/view)
add_react_common_subdir(react/renderer/components/switch)
add_react_common_subdir(react/renderer/components/textinput)
add_react_common_subdir(react/renderer/components/progressbar)
add_react_common_subdir(react/renderer/components/root)
add_react_common_subdir(react/renderer/components/image)
add_react_common_subdir(react/renderer/components/legacyviewmanagerinterop)
add_react_common_subdir(react/renderer/componentregistry/native)
add_react_common_subdir(react/renderer/components/text)
add_react_common_subdir(react/renderer/components/unimplementedview)
add_react_common_subdir(react/renderer/components/modal)
add_react_common_subdir(react/renderer/components/scrollview)
add_react_common_subdir(react/renderer/components/safeareaview)
add_react_common_subdir(react/renderer/leakchecker)
add_react_common_subdir(react/renderer/observers/events)
add_react_common_subdir(react/renderer/textlayoutmanager)
add_react_common_subdir(react/utils)
add_react_common_subdir(react/bridging)
add_react_common_subdir(react/renderer/mapbuffer)
add_react_common_subdir(react/nativemodule/core)
add_react_common_subdir(react/nativemodule/defaults)
add_react_common_subdir(react/nativemodule/dom)
add_react_common_subdir(react/nativemodule/featureflags)
add_react_common_subdir(react/nativemodule/microtasks)
add_react_common_subdir(react/nativemodule/idlecallbacks)
add_react_common_subdir(jserrorhandler)
add_react_common_subdir(react/runtime)
add_react_common_subdir(react/runtime/hermes)
add_react_common_subdir(react/runtime/nativeviewconfig)
add_react_common_subdir(react/timing)

# ReactAndroid JNI targets
add_react_build_subdir(generated/source/codegen/jni)
add_react_android_subdir(src/main/jni/first-party/fb)
add_react_android_subdir(src/main/jni/first-party/fbgloginit)
add_react_android_subdir(src/main/jni/first-party/yogajni)
add_react_android_subdir(src/main/jni/first-party/jni-lib-merge)
add_react_android_subdir(src/main/jni/react/jni)
add_react_android_subdir(src/main/jni/react/reactperflogger)
add_react_android_subdir(src/main/jni/react/jscexecutor)
add_react_android_subdir(src/main/jni/react/jsctooling)
add_react_android_subdir(src/main/jni/react/turbomodule)
add_react_android_subdir(src/main/jni/react/uimanager)
add_react_android_subdir(src/main/jni/react/mapbuffer)
add_react_android_subdir(src/main/jni/react/reactnativeblob)
add_react_android_subdir(src/main/jni/react/fabric)
add_react_android_subdir(src/main/jni/react/featureflags)
add_react_android_subdir(src/main/jni/react/newarchdefaults)
add_react_android_subdir(src/main/jni/react/hermes/reactexecutor)
add_react_android_subdir(src/main/jni/react/hermes/tooling)
add_react_android_subdir(src/main/jni/react/hermes/instrumentation/)
add_react_android_subdir(src/main/jni/react/runtime/cxxreactpackage)
add_react_android_subdir(src/main/jni/react/runtime/jni)
add_react_android_subdir(src/main/jni/react/runtime/hermes/jni)
add_react_android_subdir(src/main/jni/react/runtime/jsc/jni)
add_react_android_subdir(src/main/jni/react/devsupport)

# SoMerging Utils
include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

# libreactnative.so Dependency
#
# The React Native Android Library (the .aar) should expose headers only via this target.
# This is needed in order to reduce the number of .so files that we ship in the final library
add_library(reactnative
        SHARED
          $<TARGET_OBJECTS:bridgeless>
          $<TARGET_OBJECTS:bridgelessnativeviewconfig>
          $<TARGET_OBJECTS:callinvokerholder>
          $<TARGET_OBJECTS:fabricjni>
          $<TARGET_OBJECTS:glog_init>
          $<TARGET_OBJECTS:jni_lib_merge_glue>
          $<TARGET_OBJECTS:jserrorhandler>
          $<TARGET_OBJECTS:jsinspector>
          $<TARGET_OBJECTS:jsireact>
          $<TARGET_OBJECTS:logger>
          $<TARGET_OBJECTS:mapbufferjni>
          $<TARGET_OBJECTS:react_bridging>
          $<TARGET_OBJECTS:react_codegen_rncore>
          $<TARGET_OBJECTS:react_config>
          $<TARGET_OBJECTS:react_cxxreact>
          $<TARGET_OBJECTS:react_debug>
          $<TARGET_OBJECTS:react_devsupportjni>
          $<TARGET_OBJECTS:react_featureflags>
          $<TARGET_OBJECTS:react_featureflagsjni>
          $<TARGET_OBJECTS:react_nativemodule_core>
          $<TARGET_OBJECTS:react_nativemodule_defaults>
          $<TARGET_OBJECTS:react_nativemodule_dom>
          $<TARGET_OBJECTS:react_nativemodule_featureflags>
          $<TARGET_OBJECTS:react_nativemodule_idlecallbacks>
          $<TARGET_OBJECTS:react_nativemodule_microtasks>
          $<TARGET_OBJECTS:react_newarchdefaults>
          $<TARGET_OBJECTS:react_performance_timeline>
          $<TARGET_OBJECTS:react_render_animations>
          $<TARGET_OBJECTS:react_render_attributedstring>
          $<TARGET_OBJECTS:react_render_componentregistry>
          $<TARGET_OBJECTS:react_render_consistency>
          $<TARGET_OBJECTS:react_render_core>
          $<TARGET_OBJECTS:react_render_debug>
          $<TARGET_OBJECTS:react_render_dom>
          $<TARGET_OBJECTS:react_render_element>
          $<TARGET_OBJECTS:react_render_graphics>
          $<TARGET_OBJECTS:react_render_imagemanager>
          $<TARGET_OBJECTS:react_render_leakchecker>
          $<TARGET_OBJECTS:react_render_mapbuffer>
          $<TARGET_OBJECTS:react_render_mounting>
          $<TARGET_OBJECTS:react_render_observers_events>
          $<TARGET_OBJECTS:react_render_runtimescheduler>
          $<TARGET_OBJECTS:react_render_scheduler>
          $<TARGET_OBJECTS:react_render_telemetry>
          $<TARGET_OBJECTS:react_render_textlayoutmanager>
          $<TARGET_OBJECTS:react_render_uimanager>
          $<TARGET_OBJECTS:react_render_uimanager_consistency>
          $<TARGET_OBJECTS:react_utils>
          $<TARGET_OBJECTS:reactnativeblob>
          $<TARGET_OBJECTS:reactnativejni>
          $<TARGET_OBJECTS:reactperflogger>
          $<TARGET_OBJECTS:rninstance>
          $<TARGET_OBJECTS:rrc_image>
          $<TARGET_OBJECTS:rrc_legacyviewmanagerinterop>
          $<TARGET_OBJECTS:rrc_modal>
          $<TARGET_OBJECTS:rrc_native>
          $<TARGET_OBJECTS:rrc_progressbar>
          $<TARGET_OBJECTS:rrc_root>
          $<TARGET_OBJECTS:rrc_safeareaview>
          $<TARGET_OBJECTS:rrc_scrollview>
          $<TARGET_OBJECTS:rrc_switch>
          $<TARGET_OBJECTS:rrc_text>
          $<TARGET_OBJECTS:rrc_textinput>
          $<TARGET_OBJECTS:rrc_view>
          $<TARGET_OBJECTS:runtimeexecutor>
          $<TARGET_OBJECTS:turbomodulejsijni>
          $<TARGET_OBJECTS:uimanagerjni>
          $<TARGET_OBJECTS:yoga>
)
target_merge_so(reactnative)

target_link_libraries(reactnative
          PUBLIC
            android
            double-conversion
            fb
            fbjni
            folly_runtime
            glog
            jsi
            log
            yogacore
)

target_include_directories(reactnative
        PUBLIC
        $<TARGET_PROPERTY:bridgeless,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:bridgelessnativeviewconfig,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:callinvokerholder,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:fabricjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:glog_init,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jserrorhandler,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsinspector,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsireact,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:mapbufferjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_bridging,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_codegen_rncore,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_config,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_cxxreact,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_debug,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_devsupportjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_featureflags,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_featureflagsjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_core,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_defaults,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_dom,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_featureflags,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_idlecallbacks,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_microtasks,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_newarchdefaults,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_performance_timeline,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_animations,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_attributedstring,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_componentregistry,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_componentregistry,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_consistency,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_core,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_debug,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_dom,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_element,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_graphics,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_imagemanager,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_leakchecker,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_mapbuffer,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_mounting,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_observers_events,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_runtimescheduler,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_scheduler,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_telemetry,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_textlayoutmanager,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_uimanager,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_render_uimanager_consistency,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_utils,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:reactnativeblob,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:reactnativejni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:reactperflogger,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rninstance,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_image,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_legacyviewmanagerinterop,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_modal,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_native,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_progressbar,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_root,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_safeareaview,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_scrollview,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_switch,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_text,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_textinput,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_view,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:runtimeexecutor,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:turbomodulejsijni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:uimanagerjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:yoga,INTERFACE_INCLUDE_DIRECTORIES>
)

# GTest dependencies
add_executable(reactnative_unittest
  ${REACT_COMMON_DIR}/cxxreact/tests/jsarg_helpers.cpp
  ${REACT_COMMON_DIR}/cxxreact/tests/jsbigstring.cpp
  ${REACT_COMMON_DIR}/cxxreact/tests/methodcall.cpp
  ${REACT_COMMON_DIR}/cxxreact/tests/RecoverableErrorTest.cpp
  ${REACT_COMMON_DIR}/react/bridging/tests/BridgingTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/attributedstring/tests/AttributedStringBoxTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/image/tests/ImageTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/root/tests/RootShadowNodeTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/scrollview/tests/ScrollViewTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/view/tests/LayoutTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/view/tests/ViewTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/DynamicPropsUtilitiesTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/EventQueueProcessorTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/FindNodeAtPointTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/LayoutableShadowNodeTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/PrimitivesTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/RawPropsTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/ShadowNodeFamilyTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/debug/tests/DebugStringConvertibleTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/element/tests/ElementTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/graphics/tests/GraphicsTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/graphics/tests/TransformTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/imagemanager/tests/ImageManagerTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/mapbuffer/tests/MapBufferTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/mounting/tests/StackingContextTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/mounting/tests/StateReconciliationTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/runtimescheduler/tests/RuntimeSchedulerTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/runtimescheduler/tests/SchedulerPriorityTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/telemetry/tests/TransactionTelemetryTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/textlayoutmanager/tests/TextLayoutManagerTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/uimanager/tests/FabricUIManagerTest.cpp

  ########## (COMPILE BUT FAIL ON ASSERTS) ###########
  # ${REACT_COMMON_DIR}/react/renderer/animations/tests/LayoutAnimationTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/mounting/tests/MountingTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/mounting/tests/ShadowTreeLifeCycleTest.cpp

  ########## (COMPILE BUT FAIL WITH RUNTIME EXCEPTIONS) ###########
  # ${REACT_COMMON_DIR}/hermes/inspector-modern/chrome/tests/ConnectionDemuxTests.cpp

  ########## (DO NOT COMPILE) ###########
  # ${REACT_COMMON_DIR}/react/renderer/core/tests/ShadowNodeTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/core/tests/ConcreteShadowNodeTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/core/tests/ComponentDescriptorTest.cpp
  )
  target_compile_options(reactnative_unittest
    PRIVATE
    -Wall
    -Werror
    -fexceptions
    -frtti
    -std=c++20
    -DHERMES_ENABLE_DEBUGGER)

target_link_libraries(reactnative_unittest
  fabricjni
  folly_runtime
  glog
  glog_init
  gtest_main
  hermes-engine::libhermes
  hermes_inspector_modern
  jserrorhandler
  jsi
  mapbufferjni
  react_codegen_rncore
  react_cxxreact
  react_debug
  react_render_animations
  react_render_attributedstring
  react_render_core
  react_render_debug
  react_render_dom
  react_render_element
  react_render_graphics
  react_render_mapbuffer
  react_render_mounting
  react_render_telemetry
  react_render_textlayoutmanager
  react_render_uimanager
  react_render_uimanager_consistency
  react_utils
  reactnative
  rrc_legacyviewmanagerinterop
  rrc_modal
  rrc_root
  rrc_scrollview
  rrc_text
  rrc_textinput
  rrc_view
  yoga
)
