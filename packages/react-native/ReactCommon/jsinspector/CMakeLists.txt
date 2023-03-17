# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -std=c++17)

file(GLOB jsinspector_SRC CONFIGURE_DEPENDS *.cpp)
add_library(jsinspector SHARED ${jsinspector_SRC})

target_include_directories(jsinspector PUBLIC ${REACT_COMMON_DIR})
