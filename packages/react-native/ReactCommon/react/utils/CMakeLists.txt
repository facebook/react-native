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
        -DLOG_TAG=\"Fabric\")

file(GLOB react_utils_SRC CONFIGURE_DEPENDS *.cpp *.mm)
add_library(react_utils SHARED ${react_utils_SRC})

target_include_directories(react_utils PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_utils
        glog
        glog_init
        react_debug)
