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

file(GLOB react_renderer_css_SRC CONFIGURE_DEPENDS *.cpp)

# We need to create library as INTERFACE if it is header only
if("${react_renderer_css_SRC}" STREQUAL "")
  add_library(react_renderer_css INTERFACE)

  target_include_directories(react_renderer_css INTERFACE ${REACT_COMMON_DIR})
  target_link_libraries(react_renderer_css INTERFACE
        glog
        react_debug
        react_utils)
else()
  add_library(react_renderer_css OBJECT ${react_renderer_css_SRC})

  target_include_directories(react_renderer_css PUBLIC ${REACT_COMMON_DIR})
  target_link_libraries(react_renderer_css
        glog
        react_debug
        react_utils)
endif()
