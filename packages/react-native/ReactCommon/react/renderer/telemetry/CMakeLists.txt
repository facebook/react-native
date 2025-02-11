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

file(GLOB react_renderer_telemetry_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_telemetry OBJECT ${react_renderer_telemetry_SRC})

target_include_directories(react_renderer_telemetry PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_renderer_telemetry
        folly_runtime
        glog
        glog_init
        react_debug
        react_renderer_core
        react_renderer_debug
        react_utils
        rrc_root
        rrc_view
        yoga)
