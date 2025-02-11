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

file(GLOB react_renderer_mapbuffer_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_mapbuffer OBJECT ${react_renderer_mapbuffer_SRC})

target_include_directories(react_renderer_mapbuffer PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(react_renderer_mapbuffer glog glog_init react_debug)
