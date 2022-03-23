# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

file(GLOB react_render_imagemanager_SRC CONFIGURE_DEPENDS
        *.cpp
        platform/cxx/react/renderer/imagemanager/*.cpp)

add_library(react_render_imagemanager
        SHARED
        ${react_render_imagemanager_SRC})

target_include_directories(react_render_imagemanager
        PUBLIC
          ${REACT_COMMON_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/cxx/
        PRIVATE
          ${CMAKE_CURRENT_SOURCE_DIR}
        )

target_link_libraries(react_render_imagemanager
        folly_runtime
        react_debug
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_mounting
        yoga)
