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
        -DLOG_TAG=\"ReactNative\")

file(GLOB reactnative_SRC CONFIGURE_DEPENDS *.cpp)
add_library(reactnative STATIC ${reactnative_SRC})

target_include_directories(reactnative PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(reactnative
        boost
        callinvoker
        folly_runtime
        glog
        jsi
        jsinspector
        logger
        reactperflogger
        runtimeexecutor)
