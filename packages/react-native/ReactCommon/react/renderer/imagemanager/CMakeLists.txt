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

file(GLOB react_renderer_imagemanager_SRC CONFIGURE_DEPENDS
        *.cpp
        platform/android/react/renderer/imagemanager/*.cpp)

add_library(react_renderer_imagemanager
        OBJECT
        ${react_renderer_imagemanager_SRC})

target_include_directories(react_renderer_imagemanager
        PUBLIC
          ${REACT_COMMON_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        PRIVATE
          ${CMAKE_CURRENT_SOURCE_DIR}
        )

target_link_libraries(react_renderer_imagemanager
        folly_runtime
        mapbufferjni
        react_debug
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        react_renderer_mounting
        reactnativejni
        yoga)
