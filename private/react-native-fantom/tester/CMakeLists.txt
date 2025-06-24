# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

project(fantom_tester)
find_library(LIB_HERMES libhermes
  HINTS ${REACT_ANDROID_DIR}/hermes-engine/build/hermes/API/hermes
  REQUIRED)
# Ensure the library path is correct and the library exists
if(NOT LIB_HERMES)
  message(FATAL_ERROR "libhermes not found at the specified path.")
endif()
# Check if the found library is a framework (macOS specific)
get_filename_component(LIB_EXT ${LIB_HERMES} EXT)
if(LIB_EXT STREQUAL ".framework")
  # For frameworks, we need to use a different approach
  add_library(hermes-engine::libhermes INTERFACE IMPORTED)
  set_target_properties(hermes-engine::libhermes PROPERTIES
    INTERFACE_LINK_LIBRARIES ${LIB_HERMES})
else()
  # For regular libraries, use ALIAS as before
  add_library(hermes-engine::libhermes ALIAS ${LIB_HERMES})
endif()

include_directories(${REACT_ANDROID_DIR}/hermes-engine/build/prefab-headers)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/modules/")

include(Deps)

# Boost in NDK is not compatible with desktop build
add_third_party_subdir(boost)

# Third-party downloaded targets
add_react_third_party_ndk_subdir(glog)
add_react_third_party_ndk_subdir(double-conversion)
add_react_third_party_ndk_subdir(fast_float)
add_react_third_party_ndk_subdir(fmt)
add_react_third_party_ndk_subdir(folly)
add_fantom_third_party_subdir(gflags)

add_fantom_codegen_subdir(react)

#add_react_common_subdir(hermes/executor)
#add_react_common_subdir(hermes/inspector-modern)
#add_react_common_subdir(react/runtime/hermes)
add_react_common_subdir(callinvoker)
add_react_common_subdir(cxxreact)
add_react_common_subdir(jsi)
add_react_common_subdir(jsiexecutor)
add_react_common_subdir(jsinspector-modern)
add_react_common_subdir(jsinspector-modern/cdp)
add_react_common_subdir(jsinspector-modern/network)
add_react_common_subdir(jsinspector-modern/tracing)
add_react_common_subdir(jsitooling)
add_react_common_subdir(logger)
add_react_common_subdir(oscompat)
add_react_common_subdir(react/bridging)
add_react_common_subdir(react/debug)
add_react_common_subdir(react/featureflags)
add_react_common_subdir(react/performance/timeline)
add_react_common_subdir(react/timing)
add_react_common_subdir(reactperflogger)
add_react_common_subdir(runtimeexecutor)
add_react_common_subdir(yoga)

add_fantom_react_common_subdir(react/nativemodule/core)
add_fantom_react_common_subdir(react/utils)
add_fantom_react_common_subdir(react/runtime/hermes)
add_fantom_react_common_subdir(hermes/inspector-modern)
add_fantom_react_common_subdir(hermes/executor)

file(GLOB SOURCES "src/*.cpp" "src/*.h")
add_executable(fantom_tester ${SOURCES})

target_link_libraries(fantom_tester
  PRIVATE
    ${LIB_HERMES}
    boost
    bridgelesshermes
    callinvoker
    folly_runtime
    gflags
    glog
    hermes_executor_common
    hermes_inspector_modern
    jsi
    jsinspector
    jsinspector_cdp
    jsinspector_network
    jsinspector_tracing
    jsireact
    jsitooling
    logger
    oscompat
    react_bridging
    react_codegen_rncore
    react_cxxreact
    react_debug
    react_featureflags
    react_nativemodule_core
    react_performance_timeline
    react_timing
    react_utils
    reactperflogger
    runtimeexecutor
    yogacore
)

target_compile_options(fantom_tester
  PRIVATE
    -Wall
    -Werror
    -fexceptions
    -frtti
    -std=c++20)
