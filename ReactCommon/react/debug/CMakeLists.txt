# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -std=c++17
        -Wall
        -DLOG_TAG=\"Fabric\")

add_library(react_debug
        SHARED
        react_native_assert.cpp)

target_include_directories(react_debug PUBLIC ../../..)

target_link_libraries(react_debug log folly_json)
