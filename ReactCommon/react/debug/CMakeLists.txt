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
        -Wpedantic
        -Wno-gnu-zero-variadic-macro-arguments
        -DLOG_TAG=\"Fabric\")


file(GLOB react_debug_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_debug SHARED ${react_debug_SRC})

target_include_directories(react_debug PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_debug log folly_runtime)

if(${CMAKE_BUILD_TYPE} MATCHES Release)
        target_compile_options(react_debug PUBLIC -DNDEBUG)
endif()
