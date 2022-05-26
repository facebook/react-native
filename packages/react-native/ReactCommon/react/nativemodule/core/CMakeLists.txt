# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"ReactNative\")


file(GLOB react_nativemodule_core_SRC CONFIGURE_DEPENDS
        ReactCommon/*.cpp
        platform/android/ReactCommon/*.cpp)
add_library(react_nativemodule_core
        SHARED
        ${react_nativemodule_core_SRC})

target_include_directories(react_nativemodule_core
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        )

target_link_libraries(react_nativemodule_core
        fbjni
        folly_runtime
        jsi
        react_bridging
        react_debug
        reactperflogger
        reactnativejni)
