# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

##################
###    jsi     ###
##################

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -O3
        -Wno-unused-lambda-capture
        -DLOG_TAG=\"ReactNative\")

file(GLOB jsi_SRC CONFIGURE_DEPENDS jsi/*.cpp)
add_library(jsi SHARED ${jsi_SRC})

target_include_directories(jsi PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(jsi
        folly_runtime
        glog)

##################
### jscruntime ###
##################

add_library(jscruntime STATIC
        JSCRuntime.h
        JSCRuntime.cpp)

target_include_directories(jscruntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(jscruntime folly_runtime jsc glog)

# TODO: Remove this flag when ready.
# Android has this enabled by default, but the flag is still needed for iOS.
target_compile_options(jscruntime PRIVATE -DRN_FABRIC_ENABLED)
