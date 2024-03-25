# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

##################
### jscruntime ###
##################

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -O3
        -Wno-unused-lambda-capture
        -DLOG_TAG=\"ReactNative\")

add_library(jscruntime
        STATIC
        JSCRuntime.h
        JSCRuntime.cpp)

target_include_directories(jscruntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(jscruntime
        folly_runtime
        jsc
        jsi
        glog)

if(NOT ${CMAKE_BUILD_TYPE} MATCHES Debug)
        target_compile_options(jscruntime PRIVATE -DNDEBUG)
endif()
