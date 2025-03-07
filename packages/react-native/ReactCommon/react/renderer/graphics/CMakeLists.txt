# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_graphics_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_graphics OBJECT ${react_renderer_graphics_SRC})

target_include_directories(react_renderer_graphics
        PUBLIC
          ${REACT_COMMON_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        )

target_link_libraries(react_renderer_graphics
        glog
        fbjni
        folly_runtime
        react_debug
        react_utils
)
target_compile_reactnative_options(react_renderer_graphics PRIVATE "Fabric")
target_compile_options(react_renderer_graphics PRIVATE -Wpedantic)
