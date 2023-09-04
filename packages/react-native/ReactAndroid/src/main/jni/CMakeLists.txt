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
add_compile_options(-Wall -Werror -std=c++17)

# This exposes the check_for_circular_dependencies macro to all the submodules
include(CircularDepsValidator.cmake)

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
add_react_third_party_ndk_subdir(fmt)
add_react_third_party_ndk_subdir(libevent)
add_react_third_party_ndk_subdir(folly)
add_react_third_party_ndk_subdir(jsc)

# Common targets
add_react_common_subdir(yoga)
add_react_common_subdir(runtimeexecutor)
add_react_common_subdir(reactperflogger)
add_react_common_subdir(logger)
add_react_common_subdir(jsiexecutor)
add_react_common_subdir(cxxreact)
add_react_common_subdir(jsc)
add_react_common_subdir(jsi)
add_react_common_subdir(butter)
add_react_common_subdir(callinvoker)
add_react_common_subdir(jsinspector)
add_react_common_subdir(hermes/executor)
add_react_common_subdir(hermes/inspector)
add_react_common_subdir(react/renderer/runtimescheduler)
add_react_common_subdir(react/debug)
add_react_common_subdir(react/config)
add_react_common_subdir(react/renderer/animations)
add_react_common_subdir(react/renderer/attributedstring)
add_react_common_subdir(react/renderer/componentregistry)
add_react_common_subdir(react/renderer/mounting)
add_react_common_subdir(react/renderer/scheduler)
add_react_common_subdir(react/renderer/telemetry)
add_react_common_subdir(react/renderer/templateprocessor)
add_react_common_subdir(react/renderer/uimanager)
add_react_common_subdir(react/renderer/core)
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
add_react_common_subdir(react/renderer/leakchecker)
add_react_common_subdir(react/renderer/textlayoutmanager)
add_react_common_subdir(react/utils)
add_react_common_subdir(react/bridging)
add_react_common_subdir(react/renderer/mapbuffer)
add_react_common_subdir(react/nativemodule/core)

# ReactAndroid JNI targets
add_react_build_subdir(generated/source/codegen/jni)
add_react_android_subdir(src/main/jni/first-party/fb)
add_react_android_subdir(src/main/jni/first-party/fbgloginit)
add_react_android_subdir(src/main/jni/first-party/yogajni)
add_react_android_subdir(src/main/jni/react/jni)
add_react_android_subdir(src/main/jni/react/reactperflogger)
add_react_android_subdir(src/main/jni/react/jscexecutor)
add_react_android_subdir(src/main/jni/react/turbomodule)
add_react_android_subdir(src/main/jni/react/uimanager)
add_react_android_subdir(src/main/jni/react/mapbuffer)
add_react_android_subdir(src/main/jni/react/reactnativeblob)
add_react_android_subdir(src/main/jni/react/fabric)
add_react_android_subdir(src/main/jni/react/newarchdefaults)
add_react_android_subdir(src/main/jni/react/hermes/reactexecutor)
add_react_android_subdir(src/main/jni/react/hermes/instrumentation/)

# GTest setup
set(GOOGLETEST_ROOT ${ANDROID_NDK}/sources/third_party/googletest)
add_library(gtest STATIC ${GOOGLETEST_ROOT}/src/gtest_main.cc ${GOOGLETEST_ROOT}/src/gtest-all.cc)
target_include_directories(gtest PRIVATE ${GOOGLETEST_ROOT})
target_include_directories(gtest PUBLIC ${GOOGLETEST_ROOT}/include)

# GTest dependencies
add_executable(reactnative_unittest
  ${REACT_COMMON_DIR}/cxxreact/tests/jsarg_helpers.cpp
  ${REACT_COMMON_DIR}/cxxreact/tests/jsbigstring.cpp
  ${REACT_COMMON_DIR}/cxxreact/tests/methodcall.cpp
  ${REACT_COMMON_DIR}/cxxreact/tests/RecoverableErrorTest.cpp
  ${REACT_COMMON_DIR}/hermes/inspector/chrome/tests/MessageTests.cpp
  ${REACT_COMMON_DIR}/hermes/inspector/chrome/tests/RemoteObjectsTableTest.cpp
  ${REACT_COMMON_DIR}/react/bridging/tests/BridgingTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/attributedstring/tests/AttributedStringBoxTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/attributedstring/tests/AttributedStringTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/attributedstring/tests/ParagraphAttributesTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/attributedstring/tests/TextAttributesTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/image/tests/ImageTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/root/tests/RootShadowNodeTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/scrollview/tests/ScrollViewTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/text/tests/ParagraphLocalDataTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/text/tests/TextTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/view/tests/LayoutTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/components/view/tests/ViewTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/DynamicPropsUtilitiesTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/EventQueueProcessorTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/FindNodeAtPointTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/LayoutableShadowNodeTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/PrimitivesTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/RawPropsTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/ShadowNodeFamilyTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/core/tests/traitCastTest.cpp
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
  ${REACT_COMMON_DIR}/react/renderer/templateprocessor/tests/UITemplateProcessorTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/textlayoutmanager/tests/TextLayoutManagerTest.cpp
  ${REACT_COMMON_DIR}/react/renderer/uimanager/tests/FabricUIManagerTest.cpp
  
  ########## (COMPILE BUT FAIL ON ASSERTS) ###########
  # ${REACT_COMMON_DIR}/react/renderer/animations/tests/LayoutAnimationTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/mounting/tests/MountingTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/mounting/tests/ShadowTreeLifeCycleTest.cpp
  
  ########## (COMPILE BUT FAIL WITH RUNTIME EXCEPTIONS) ###########
  # ${REACT_COMMON_DIR}/hermes/inspector/chrome/tests/ConnectionDemuxTests.cpp
  # ${REACT_COMMON_DIR}/hermes/inspector/detail/tests/SerialExecutorTests.cpp
  # ${REACT_COMMON_DIR}/hermes/inspector/tests/InspectorTests.cpp
  
  ########## (DO NOT COMPILE) ###########
  # ${REACT_COMMON_DIR}/react/renderer/core/tests/ShadowNodeTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/core/tests/ConcreteShadowNodeTest.cpp
  # ${REACT_COMMON_DIR}/react/renderer/core/tests/ComponentDescriptorTest.cpp
  # ${REACT_COMMON_DIR}/hermes/inspector/chrome/tests/ConnectionTests.cpp
  )
  target_compile_options(reactnative_unittest
    PRIVATE
    -Wall
    -Werror
    -fexceptions
    -frtti
    -std=c++17
    -DHERMES_ENABLE_DEBUGGER)

  target_link_libraries(reactnative_unittest
  folly_runtime
  folly_futures
  glog  
  glog_init
  gtest
  hermes-engine::libhermes
  hermes_inspector
  jsi
  react_codegen_rncore
  react_debug
  react_render_animations
  react_render_attributedstring
  react_render_core
  react_render_debug
  react_render_element
  react_render_graphics
  react_render_mapbuffer
  react_render_mounting
  react_render_templateprocessor
  react_render_textlayoutmanager
  react_render_uimanager
  react_utils
  reactnative
  rrc_modal
  rrc_scrollview
  rrc_text
  rrc_view
  yoga
)
