# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -std=c++17
        -Wall
        -Wpedantic
        -Wno-gnu-zero-variadic-macro-arguments
        -DLOG_TAG=\"Fabric\")

file(GLOB react_render_leakchecker_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_render_leakchecker SHARED ${react_render_leakchecker_SRC})

target_include_directories(react_render_leakchecker PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(react_render_leakchecker
        glog
        react_render_core
        runtimeexecutor)
