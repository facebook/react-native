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
        -DLOG_TAG=\"Fabric\")

file(GLOB react_render_graphics_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_render_graphics OBJECT ${react_render_graphics_SRC})

target_include_directories(react_render_graphics
        PUBLIC
          ${REACT_COMMON_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        )

target_link_libraries(react_render_graphics
        glog
        fbjni
        folly_runtime
        react_debug
        react_utils
)
