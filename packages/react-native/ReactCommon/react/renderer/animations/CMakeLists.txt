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
        -Wno-gnu-zero-variadic-macro-arguments
        -DLOG_TAG=\"Fabric\")

file(GLOB react_render_animations_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_render_animations SHARED ${react_render_animations_SRC})

target_include_directories(react_render_animations PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_render_animations
        folly_runtime
        glog
        glog_init
        jsi
        react_config
        react_debug
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_mounting
        react_render_uimanager
        rrc_view
        runtimeexecutor
        yoga
)
