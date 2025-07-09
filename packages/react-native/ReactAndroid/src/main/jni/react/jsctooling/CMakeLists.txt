# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# jsctooling is a shared library where we merge all the jsc* related libraries.
#
# It acts as an 'umbrella' library and gets removed by RNGP (see `configureJsEnginePackagingOptions`)
# Please note that this library gets removed for users that opt to use Hermes as their JS engine.

add_library(jsctooling
        SHARED
        $<TARGET_OBJECTS:jni_lib_merge_glue>
        $<TARGET_OBJECTS:jscinstance>
        $<TARGET_OBJECTS:jscruntime>
        $<TARGET_OBJECTS:jscexecutor>
)
target_merge_so(jsctooling)
target_link_libraries(jsctooling
        PUBLIC
        reactnative
        jsc
)
target_include_directories(jsctooling
        PUBLIC
        $<TARGET_PROPERTY:jscexecutor,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jscruntime,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jscinstance,INTERFACE_INCLUDE_DIRECTORIES>
)
target_compile_reactnative_options(jsctooling PRIVATE)
