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
        -DLOG_TAG=\"ReactNative\")

file(GLOB react_bridging_SRC CONFIGURE_DEPENDS *.cpp)

add_library(react_bridging OBJECT ${react_bridging_SRC})

target_include_directories(react_bridging PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_bridging jsi callinvoker)
