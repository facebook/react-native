# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"ReactNative\")

add_library(react_nativemodule_core
        SHARED
        ReactCommon/LongLivedObject.cpp
        ReactCommon/TurboCxxModule.cpp
        ReactCommon/TurboModule.cpp
        ReactCommon/TurboModuleBinding.cpp
        ReactCommon/TurboModulePerfLogger.cpp
        ReactCommon/TurboModuleUtils.cpp
        platform/android/ReactCommon/JavaTurboModule.cpp)

target_include_directories(react_nativemodule_core
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        )

target_link_libraries(react_nativemodule_core
        fbjni
        folly_json
        jsi
        react_debug
        reactperflogger
        reactnativejni)
