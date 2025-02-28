# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

#########################
### callinvokerholder ###
#########################

# TODO This should be exported to its own folder hierarchy
add_library(
        callinvokerholder
        OBJECT
        ReactCommon/CallInvokerHolder.cpp
        ReactCommon/NativeMethodCallInvokerHolder.cpp
)

target_include_directories(callinvokerholder
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        )

target_link_libraries(callinvokerholder
        fbjni
        runtimeexecutor
        callinvoker
        reactperfloggerjni)
target_compile_reactnative_options(callinvokerholder PRIVATE)

##################################
### react_nativemodule_manager ###
##################################

# TODO: rename to react_nativemodule_manager
add_library(
        turbomodulejsijni
        OBJECT
        ReactCommon/BindingsInstallerHolder.cpp
        ReactCommon/OnLoad.cpp
        ReactCommon/TurboModuleManager.cpp
        $<TARGET_OBJECTS:logger>
        $<TARGET_OBJECTS:react_bridging>
)
target_merge_so(turbomodulejsijni)

target_include_directories(
        turbomodulejsijni
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(turbomodulejsijni
        fbjni
        jsi
        react_nativemodule_core
        callinvokerholder
        reactperfloggerjni)
target_compile_reactnative_options(turbomodulejsijni PRIVATE)
