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

file(GLOB rrc_native_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rrc_native SHARED ${rrc_native_SRC})

target_include_directories(rrc_native PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(rrc_native
        folly_runtime
        glog_init
        jsi
        react_debug
        react_render_core
        react_render_debug
        react_utils
)
