# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -std=c++20
        -Wall
        -Wpedantic
        -DLOG_TAG=\"ReactNative\")

file(GLOB react_performance_timeline_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_performance_timeline OBJECT ${react_performance_timeline_SRC})

target_include_directories(react_performance_timeline PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(react_performance_timeline
        jsinspector_tracing
        react_timing
        react_cxxreact)
