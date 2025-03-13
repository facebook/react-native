# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

##################
### jscruntime ###
##################

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)
include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

add_library(jscruntime
        OBJECT
        JSCRuntime.h
        JSCRuntime.cpp)

target_include_directories(jscruntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_merge_so(jscruntime)

target_link_libraries(jscruntime
        jsc
        jsi
        reactnative)

if(NOT ${CMAKE_BUILD_TYPE} MATCHES Debug)
        target_compile_options(jscruntime PRIVATE -DNDEBUG)
endif()

target_compile_reactnative_options(jscruntime PRIVATE "ReactNative")
target_compile_options(jscruntime PRIVATE -O3 -Wno-unused-lambda-capture)
