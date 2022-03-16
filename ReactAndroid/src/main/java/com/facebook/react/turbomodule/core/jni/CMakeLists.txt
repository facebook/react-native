# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -Wno-unused-lambda-capture
        -std=c++17)

#########################
### callinvokerholder ###
#########################

# TODO This should be exported to its own folder hierarchy
add_library(
        callinvokerholder
        STATIC
        ReactCommon/CallInvokerHolder.cpp
)

target_include_directories(callinvokerholder
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        )

target_link_libraries(callinvokerholder
        fb
        fbjni
        runtimeexecutor
        callinvoker
        reactperfloggerjni)

##################################
### react_nativemodule_manager ###
##################################

# TODO: rename to react_nativemodule_manager
add_library(
        turbomodulejsijni
        SHARED
        ReactCommon/TurboModuleManager.cpp
        ReactCommon/OnLoad.cpp
)

target_include_directories(
        turbomodulejsijni
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(turbomodulejsijni
        fb
        fbjni
        jsi
        react_nativemodule_core
        callinvokerholder
        reactperfloggerjni)
